import { Injectable, Logger, OnModuleDestroy } from "@nestjs/common";
import * as mysql from "mysql2/promise";
import { EncryptionService } from "../../common/services/encryption.service";

/**
 * Configuration for external database connection
 */
export interface ExternalDbConfig {
  host: string;
  port: number;
  database: string;
  username: string;
  password: string; // Decrypted password
}

/**
 * Connection pool entry with metadata
 */
interface PoolEntry {
  pool: mysql.Pool;
  config: ExternalDbConfig;
  createdAt: Date;
  lastUsed: Date;
}

/**
 * External Connection Manager Service
 * Manages connection pools for each tenant's external database.
 * Provides connection pooling, refresh, and cleanup functionality.
 */
@Injectable()
export class ExternalConnectionService implements OnModuleDestroy {
  private readonly logger = new Logger(ExternalConnectionService.name);
  private readonly connectionPools: Map<number, PoolEntry> = new Map();
  private readonly maxRetries = 3;
  private readonly baseRetryDelay = 1000; // 1 second
  private readonly idleTimeout = 300000; // 5 minutes
  private cleanupInterval: NodeJS.Timeout;

  constructor(private readonly encryptionService: EncryptionService) {
    // Start cleanup interval for idle connections
    this.cleanupInterval = setInterval(() => {
      this.cleanupIdleConnections();
    }, 60000); // Check every minute
  }

  /**
   * Get a connection from the pool for a specific tenant.
   * Creates a new pool if one doesn't exist.
   */
  async getConnection(
    tenantId: number,
    config: ExternalDbConfig
  ): Promise<mysql.PoolConnection> {
    let poolEntry = this.connectionPools.get(tenantId);

    // Create new pool if doesn't exist or config changed
    if (!poolEntry || this.configChanged(poolEntry.config, config)) {
      await this.createPool(tenantId, config);
      poolEntry = this.connectionPools.get(tenantId);
    }

    if (!poolEntry) {
      throw new Error(
        `Failed to create connection pool for tenant ${tenantId}`
      );
    }

    // Update last used timestamp
    poolEntry.lastUsed = new Date();

    return this.getConnectionWithRetry(poolEntry.pool, tenantId);
  }

  /**
   * Get connection with exponential backoff retry
   */
  private async getConnectionWithRetry(
    pool: mysql.Pool,
    tenantId: number,
    attempt: number = 1
  ): Promise<mysql.PoolConnection> {
    try {
      return await pool.getConnection();
    } catch (error) {
      if (attempt >= this.maxRetries) {
        this.logger.error(
          `Failed to get connection for tenant ${tenantId} after ${this.maxRetries} attempts`,
          error.stack
        );
        throw new Error(
          `External database connection failed: ${error.message}`
        );
      }

      const delay = this.baseRetryDelay * Math.pow(2, attempt - 1);
      this.logger.warn(
        `Connection attempt ${attempt} failed for tenant ${tenantId}, retrying in ${delay}ms`
      );

      await this.sleep(delay);
      return this.getConnectionWithRetry(pool, tenantId, attempt + 1);
    }
  }

  /**
   * Create a new connection pool for a tenant
   */
  private async createPool(
    tenantId: number,
    config: ExternalDbConfig
  ): Promise<void> {
    // Close existing pool if any
    await this.closeConnection(tenantId);

    const pool = mysql.createPool({
      host: config.host,
      port: config.port,
      database: config.database,
      user: config.username,
      password: config.password,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      connectTimeout: 10000, // 10 seconds
      enableKeepAlive: true,
      keepAliveInitialDelay: 10000,
    });

    this.connectionPools.set(tenantId, {
      pool,
      config,
      createdAt: new Date(),
      lastUsed: new Date(),
    });

    this.logger.log(`Created connection pool for tenant ${tenantId}`);
  }

  /**
   * Refresh the connection pool for a tenant
   */
  async refreshConnection(
    tenantId: number,
    config: ExternalDbConfig
  ): Promise<void> {
    this.logger.log(`Refreshing connection pool for tenant ${tenantId}`);
    await this.createPool(tenantId, config);
  }

  /**
   * Close and remove the connection pool for a tenant
   */
  async closeConnection(tenantId: number): Promise<void> {
    const poolEntry = this.connectionPools.get(tenantId);
    if (poolEntry) {
      try {
        await poolEntry.pool.end();
        this.connectionPools.delete(tenantId);
        this.logger.log(`Closed connection pool for tenant ${tenantId}`);
      } catch (error) {
        this.logger.error(
          `Error closing connection pool for tenant ${tenantId}`,
          error.stack
        );
      }
    }
  }

  /**
   * Test a database connection without creating a persistent pool
   */
  async testConnection(config: ExternalDbConfig): Promise<boolean> {
    let connection: mysql.Connection | null = null;
    try {
      connection = await mysql.createConnection({
        host: config.host,
        port: config.port,
        database: config.database,
        user: config.username,
        password: config.password,
        connectTimeout: 10000,
      });

      // Execute a simple query to verify connection
      await connection.query("SELECT 1");
      return true;
    } catch (error) {
      this.logger.error(`Connection test failed: ${error.message}`);
      throw new Error(`Connection test failed: ${error.message}`);
    } finally {
      if (connection) {
        await connection.end();
      }
    }
  }

  /**
   * Execute a query on the external database
   */
  async executeQuery<T>(
    tenantId: number,
    config: ExternalDbConfig,
    query: string,
    params?: any[]
  ): Promise<T[]> {
    const connection = await this.getConnection(tenantId, config);
    try {
      const [rows] = await connection.query(query, params);
      return rows as T[];
    } finally {
      connection.release();
    }
  }

  /**
   * Check if configuration has changed
   */
  private configChanged(
    oldConfig: ExternalDbConfig,
    newConfig: ExternalDbConfig
  ): boolean {
    return (
      oldConfig.host !== newConfig.host ||
      oldConfig.port !== newConfig.port ||
      oldConfig.database !== newConfig.database ||
      oldConfig.username !== newConfig.username ||
      oldConfig.password !== newConfig.password
    );
  }

  /**
   * Clean up idle connections
   */
  private async cleanupIdleConnections(): Promise<void> {
    const now = new Date().getTime();
    const tenantsToCleanup: number[] = [];

    this.connectionPools.forEach((entry, tenantId) => {
      if (now - entry.lastUsed.getTime() > this.idleTimeout) {
        tenantsToCleanup.push(tenantId);
      }
    });

    for (const tenantId of tenantsToCleanup) {
      this.logger.log(`Cleaning up idle connection for tenant ${tenantId}`);
      await this.closeConnection(tenantId);
    }
  }

  /**
   * Check if a tenant has an active connection pool
   */
  hasConnection(tenantId: number): boolean {
    return this.connectionPools.has(tenantId);
  }

  /**
   * Get the number of active connection pools
   */
  getActivePoolCount(): number {
    return this.connectionPools.size;
  }

  /**
   * Sleep utility for retry delays
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Cleanup on module destroy
   */
  async onModuleDestroy(): Promise<void> {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }

    // Close all connection pools
    const closePromises: Promise<void>[] = [];
    this.connectionPools.forEach((_, tenantId) => {
      closePromises.push(this.closeConnection(tenantId));
    });

    await Promise.all(closePromises);
    this.logger.log("All external connection pools closed");
  }
}
