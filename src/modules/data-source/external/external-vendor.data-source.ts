import { Injectable, Logger } from "@nestjs/common";
import {
  ExternalConnectionService,
  ExternalDbConfig,
} from "../../external-connection/external-connection.service";
import { IVendorDataSource, VendorDto } from "../interfaces";
import { FieldMappingService } from "../services/field-mapping.service";
import { CacheService } from "../services/cache.service";
import { FieldMapping } from "../../../entities/tenant.entity";

/**
 * External Vendor Data Source
 * Fetches vendor data from external third-party databases
 */
@Injectable()
export class ExternalVendorDataSource implements IVendorDataSource {
  private readonly logger = new Logger(ExternalVendorDataSource.name);

  constructor(
    private readonly connectionService: ExternalConnectionService,
    private readonly fieldMappingService: FieldMappingService,
    private readonly cacheService: CacheService
  ) {}

  /**
   * Find all vendors from external database
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
  ): Promise<VendorDto[]> {
    if (!config) {
      throw new Error("External database configuration is required");
    }

    const cacheKey = `vendor:${tenantId}:all:${JSON.stringify(filters || {})}`;
    const cached = this.cacheService.get<VendorDto[]>(cacheKey);
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

      const vendors = rows.map((row) => this.mapToDto(row, config.mappings));

      this.cacheService.set(cacheKey, vendors, config.cacheTtl);
      return vendors;
    } catch (error) {
      this.logger.error(
        `Failed to fetch vendors from external DB for tenant ${tenantId}`,
        error.stack
      );
      throw new Error(`External database unavailable: ${error.message}`);
    }
  }

  /**
   * Find a single vendor by ID from external database
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
  ): Promise<VendorDto | null> {
    if (!config) {
      throw new Error("External database configuration is required");
    }

    const cacheKey = `vendor:${tenantId}:${id}`;
    const cached = this.cacheService.get<VendorDto>(cacheKey);
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

      const vendor = this.mapToDto(rows[0], config.mappings);
      this.cacheService.set(cacheKey, vendor, config.cacheTtl);
      return vendor;
    } catch (error) {
      this.logger.error(
        `Failed to fetch vendor ${id} from external DB for tenant ${tenantId}`,
        error.stack
      );
      throw new Error(`External database unavailable: ${error.message}`);
    }
  }

  /**
   * Find multiple vendors by IDs from external database
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
  ): Promise<VendorDto[]> {
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
        `Failed to fetch vendors by IDs from external DB for tenant ${tenantId}`,
        error.stack
      );
      throw new Error(`External database unavailable: ${error.message}`);
    }
  }

  /**
   * Map external database row to VendorDto using field mappings
   */
  private mapToDto(row: any, mappings: FieldMapping[]): VendorDto {
    const mapped = this.fieldMappingService.applyMappings(row, mappings);
    return {
      id: mapped.id,
      companyName: mapped.companyName || "",
      contactPerson: mapped.contactPerson,
      email: mapped.email,
      phone: mapped.phone,
      address: mapped.address,
      isActive: mapped.isActive ?? true,
      isExternal: true,
    };
  }
}
