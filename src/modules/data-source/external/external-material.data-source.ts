import { Injectable, Logger } from "@nestjs/common";
import {
  ExternalConnectionService,
  ExternalDbConfig,
} from "../../external-connection/external-connection.service";
import { IMaterialDataSource, MaterialDto } from "../interfaces";
import { FieldMappingService } from "../services/field-mapping.service";
import { CacheService } from "../services/cache.service";
import { FieldMapping } from "../../../entities/tenant.entity";

/**
 * External Material Data Source
 * Fetches material data from external third-party databases
 */
@Injectable()
export class ExternalMaterialDataSource implements IMaterialDataSource {
  private readonly logger = new Logger(ExternalMaterialDataSource.name);

  constructor(
    private readonly connectionService: ExternalConnectionService,
    private readonly fieldMappingService: FieldMappingService,
    private readonly cacheService: CacheService
  ) {}

  /**
   * Find all materials from external database
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
  ): Promise<MaterialDto[]> {
    if (!config) {
      throw new Error("External database configuration is required");
    }

    const cacheKey = `material:${tenantId}:all:${JSON.stringify(filters || {})}`;
    const cached = this.cacheService.get<MaterialDto[]>(cacheKey);
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

      const materials = rows.map((row) => this.mapToDto(row, config.mappings));

      this.cacheService.set(cacheKey, materials, config.cacheTtl);
      return materials;
    } catch (error) {
      this.logger.error(
        `Failed to fetch materials from external DB for tenant ${tenantId}`,
        error.stack
      );
      throw new Error(`External database unavailable: ${error.message}`);
    }
  }

  /**
   * Find a single material by ID from external database
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
  ): Promise<MaterialDto | null> {
    if (!config) {
      throw new Error("External database configuration is required");
    }

    const cacheKey = `material:${tenantId}:${id}`;
    const cached = this.cacheService.get<MaterialDto>(cacheKey);
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

      const material = this.mapToDto(rows[0], config.mappings);
      this.cacheService.set(cacheKey, material, config.cacheTtl);
      return material;
    } catch (error) {
      this.logger.error(
        `Failed to fetch material ${id} from external DB for tenant ${tenantId}`,
        error.stack
      );
      throw new Error(`External database unavailable: ${error.message}`);
    }
  }

  /**
   * Find multiple materials by IDs from external database
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
  ): Promise<MaterialDto[]> {
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
        `Failed to fetch materials by IDs from external DB for tenant ${tenantId}`,
        error.stack
      );
      throw new Error(`External database unavailable: ${error.message}`);
    }
  }

  /**
   * Map external database row to MaterialDto using field mappings
   */
  private mapToDto(row: any, mappings: FieldMapping[]): MaterialDto {
    const mapped = this.fieldMappingService.applyMappings(row, mappings);
    return {
      id: mapped.id,
      name: mapped.name || "",
      code: mapped.code || "",
      description: mapped.description,
      unitOfMeasure: mapped.unitOfMeasure,
      category: mapped.category,
      isActive: mapped.isActive ?? true,
      isExternal: true,
    };
  }
}
