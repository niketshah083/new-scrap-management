import { Injectable, Logger } from "@nestjs/common";
import {
  ExternalConnectionService,
  ExternalDbConfig,
} from "../../external-connection/external-connection.service";
import { ITransporterDataSource, TransporterDto } from "../interfaces";
import { FieldMappingService } from "../services/field-mapping.service";
import { CacheService } from "../services/cache.service";
import { FieldMapping } from "../../../entities/tenant.entity";

/**
 * External Transporter Data Source
 * Fetches transporter data from external third-party databases
 */
@Injectable()
export class ExternalTransporterDataSource implements ITransporterDataSource {
  private readonly logger = new Logger(ExternalTransporterDataSource.name);

  constructor(
    private readonly connectionService: ExternalConnectionService,
    private readonly fieldMappingService: FieldMappingService,
    private readonly cacheService: CacheService
  ) {}

  /**
   * Find all transporters from external database
   */
  async findAll(
    tenantId: number,
    filters?: Record<string, any>,
    config?: {
      dbConfig: ExternalDbConfig;
      tableName: string;
      mappings: FieldMapping[];
      cacheTtl: number;
    }
  ): Promise<TransporterDto[]> {
    if (!config) {
      throw new Error("External database configuration is required");
    }

    const cacheKey = `transporter:${tenantId}:all:${JSON.stringify(filters || {})}`;
    const cached = this.cacheService.get<TransporterDto[]>(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const query = `SELECT * FROM ${config.tableName}`;
      const rows = await this.connectionService.executeQuery<any>(
        tenantId,
        config.dbConfig,
        query
      );

      const transporters = rows.map((row) =>
        this.mapToDto(row, config.mappings)
      );

      this.cacheService.set(cacheKey, transporters, config.cacheTtl);
      return transporters;
    } catch (error) {
      this.logger.error(
        `Failed to fetch transporters from external DB for tenant ${tenantId}`,
        error.stack
      );
      throw new Error(`External database unavailable: ${error.message}`);
    }
  }

  /**
   * Find a single transporter by ID from external database
   */
  async findOne(
    tenantId: number,
    id: number | string,
    config?: {
      dbConfig: ExternalDbConfig;
      tableName: string;
      mappings: FieldMapping[];
      cacheTtl: number;
    }
  ): Promise<TransporterDto | null> {
    if (!config) {
      throw new Error("External database configuration is required");
    }

    const cacheKey = `transporter:${tenantId}:${id}`;
    const cached = this.cacheService.get<TransporterDto>(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const idField = this.fieldMappingService.getExternalField(
        config.mappings,
        "id"
      );
      const query = `SELECT * FROM ${config.tableName} WHERE ${idField} = ?`;
      const rows = await this.connectionService.executeQuery<any>(
        tenantId,
        config.dbConfig,
        query,
        [id]
      );

      if (rows.length === 0) {
        return null;
      }

      const transporter = this.mapToDto(rows[0], config.mappings);
      this.cacheService.set(cacheKey, transporter, config.cacheTtl);
      return transporter;
    } catch (error) {
      this.logger.error(
        `Failed to fetch transporter ${id} from external DB for tenant ${tenantId}`,
        error.stack
      );
      throw new Error(`External database unavailable: ${error.message}`);
    }
  }

  /**
   * Find multiple transporters by IDs from external database
   */
  async findByIds(
    tenantId: number,
    ids: (number | string)[],
    config?: {
      dbConfig: ExternalDbConfig;
      tableName: string;
      mappings: FieldMapping[];
      cacheTtl: number;
    }
  ): Promise<TransporterDto[]> {
    if (!config) {
      throw new Error("External database configuration is required");
    }

    if (ids.length === 0) {
      return [];
    }

    try {
      const idField = this.fieldMappingService.getExternalField(
        config.mappings,
        "id"
      );
      const placeholders = ids.map(() => "?").join(", ");
      const query = `SELECT * FROM ${config.tableName} WHERE ${idField} IN (${placeholders})`;
      const rows = await this.connectionService.executeQuery<any>(
        tenantId,
        config.dbConfig,
        query,
        ids
      );

      return rows.map((row) => this.mapToDto(row, config.mappings));
    } catch (error) {
      this.logger.error(
        `Failed to fetch transporters by IDs from external DB for tenant ${tenantId}`,
        error.stack
      );
      throw new Error(`External database unavailable: ${error.message}`);
    }
  }

  /**
   * Map external database row to TransporterDto using field mappings
   */
  private mapToDto(row: any, mappings: FieldMapping[]): TransporterDto {
    const mapped = this.fieldMappingService.applyMappings(row, mappings);
    return {
      id: mapped.id,
      transporterName: mapped.transporterName || "",
      gstin: mapped.gstin,
      mobileNo: mapped.mobileNo,
      gstState: mapped.gstState,
      isActive: mapped.isActive ?? true,
      isExternal: true,
    };
  }
}
