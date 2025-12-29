import { Injectable, Logger } from "@nestjs/common";
import {
  ExternalConnectionService,
  ExternalDbConfig,
} from "../../external-connection/external-connection.service";
import { IPurchaseOrderDataSource, PurchaseOrderDto } from "../interfaces";
import { FieldMappingService } from "../services/field-mapping.service";
import { CacheService } from "../services/cache.service";
import { FieldMapping } from "../../../entities/tenant.entity";

/**
 * External Purchase Order Data Source
 * Fetches purchase order data from external third-party databases
 */
@Injectable()
export class ExternalPurchaseOrderDataSource implements IPurchaseOrderDataSource {
  private readonly logger = new Logger(ExternalPurchaseOrderDataSource.name);

  constructor(
    private readonly connectionService: ExternalConnectionService,
    private readonly fieldMappingService: FieldMappingService,
    private readonly cacheService: CacheService
  ) {}

  /**
   * Find all purchase orders from external database
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
  ): Promise<PurchaseOrderDto[]> {
    if (!config) {
      throw new Error("External database configuration is required");
    }

    const cacheKey = `po:${tenantId}:all:${JSON.stringify(filters || {})}`;
    const cached = this.cacheService.get<PurchaseOrderDto[]>(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      let query = `SELECT * FROM ${config.tableName}`;
      const params: any[] = [];

      // Apply vendor filter if provided
      if (filters?.vendorId) {
        const vendorIdField = this.fieldMappingService.getExternalField(
          config.mappings,
          "vendorId"
        );
        query += ` WHERE ${vendorIdField} = ?`;
        params.push(filters.vendorId);
      }

      const rows = await this.connectionService.executeQuery<any>(
        tenantId,
        config.dbConfig,
        query,
        params
      );

      const purchaseOrders = rows.map((row) =>
        this.mapToDto(row, config.mappings)
      );

      this.cacheService.set(cacheKey, purchaseOrders, config.cacheTtl);
      return purchaseOrders;
    } catch (error) {
      this.logger.error(
        `Failed to fetch purchase orders from external DB for tenant ${tenantId}`,
        error.stack
      );
      throw new Error(`External database unavailable: ${error.message}`);
    }
  }

  /**
   * Find a single purchase order by ID from external database
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
  ): Promise<PurchaseOrderDto | null> {
    if (!config) {
      throw new Error("External database configuration is required");
    }

    const cacheKey = `po:${tenantId}:${id}`;
    const cached = this.cacheService.get<PurchaseOrderDto>(cacheKey);
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

      const purchaseOrder = this.mapToDto(rows[0], config.mappings);
      this.cacheService.set(cacheKey, purchaseOrder, config.cacheTtl);
      return purchaseOrder;
    } catch (error) {
      this.logger.error(
        `Failed to fetch purchase order ${id} from external DB for tenant ${tenantId}`,
        error.stack
      );
      throw new Error(`External database unavailable: ${error.message}`);
    }
  }

  /**
   * Find multiple purchase orders by IDs from external database
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
  ): Promise<PurchaseOrderDto[]> {
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
        `Failed to fetch purchase orders by IDs from external DB for tenant ${tenantId}`,
        error.stack
      );
      throw new Error(`External database unavailable: ${error.message}`);
    }
  }

  /**
   * Find purchase orders by vendor ID from external database
   */
  async findByVendorId(
    tenantId: number,
    vendorId: number | string,
    config?: {
      dbConfig: ExternalDbConfig;
      tableName: string;
      mappings: FieldMapping[];
      cacheTtl: number;
    }
  ): Promise<PurchaseOrderDto[]> {
    if (!config) {
      throw new Error("External database configuration is required");
    }

    const cacheKey = `po:${tenantId}:vendor:${vendorId}`;
    const cached = this.cacheService.get<PurchaseOrderDto[]>(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const vendorIdField = this.fieldMappingService.getExternalField(
        config.mappings,
        "vendorId"
      );
      const query = `SELECT * FROM ${config.tableName} WHERE ${vendorIdField} = ?`;
      const rows = await this.connectionService.executeQuery<any>(
        tenantId,
        config.dbConfig,
        query,
        [vendorId]
      );

      const purchaseOrders = rows.map((row) =>
        this.mapToDto(row, config.mappings)
      );

      this.cacheService.set(cacheKey, purchaseOrders, config.cacheTtl);
      return purchaseOrders;
    } catch (error) {
      this.logger.error(
        `Failed to fetch purchase orders by vendor from external DB for tenant ${tenantId}`,
        error.stack
      );
      throw new Error(`External database unavailable: ${error.message}`);
    }
  }

  /**
   * Map external database row to PurchaseOrderDto using field mappings
   */
  private mapToDto(row: any, mappings: FieldMapping[]): PurchaseOrderDto {
    const mapped = this.fieldMappingService.applyMappings(row, mappings);
    return {
      id: mapped.id,
      poNumber: mapped.poNumber || "",
      vendorId: mapped.vendorId,
      orderDate: mapped.orderDate,
      expectedDeliveryDate: mapped.expectedDeliveryDate,
      status: mapped.status || "pending",
      totalAmount: mapped.totalAmount,
      notes: mapped.notes,
      isExternal: true,
    };
  }
}
