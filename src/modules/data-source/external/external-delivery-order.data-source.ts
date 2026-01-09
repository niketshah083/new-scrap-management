import { Injectable, Logger } from "@nestjs/common";
import {
  ExternalConnectionService,
  ExternalDbConfig,
} from "../../external-connection/external-connection.service";
import {
  IDeliveryOrderDataSource,
  DeliveryOrderDto,
  DeliveryOrderItemDto,
} from "../interfaces";
import { FieldMappingService } from "../services/field-mapping.service";
import { CacheService } from "../services/cache.service";
import { FieldMapping } from "../../../entities/tenant.entity";

interface DeliveryOrderConfig {
  dbConfig: ExternalDbConfig;
  tableName: string;
  mappings: FieldMapping[];
  cacheTtl: number;
  itemConfig?: {
    tableName: string;
    mappings: FieldMapping[];
    relationKey: string; // e.g., 'doNumber' or 'id'
    // Material join configuration for getting material name
    materialJoin?: {
      tableName: string; // e.g., 'item'
      foreignKey: string; // e.g., 'itemcode' (column in items table)
      primaryKey: string; // e.g., 'itemcode' (column in material table)
      nameField: string; // e.g., 'itemname' (material name column)
    };
  };
  // Vendor join configuration for getting vendor name
  vendorJoin?: {
    tableName: string; // e.g., 'acmast'
    foreignKey: string; // e.g., 'party' (column in DO table)
    primaryKey: string; // e.g., 'id' (column in vendor table)
    nameField: string; // e.g., 'name' or 'acname' (vendor name column)
  };
}

/**
 * External Delivery Order Data Source
 * Fetches delivery order data from external third-party databases
 */
@Injectable()
export class ExternalDeliveryOrderDataSource implements IDeliveryOrderDataSource {
  private readonly logger = new Logger(ExternalDeliveryOrderDataSource.name);

  constructor(
    private readonly connectionService: ExternalConnectionService,
    private readonly fieldMappingService: FieldMappingService,
    private readonly cacheService: CacheService
  ) {}

  /**
   * Find all delivery orders from external database
   */
  async findAll(
    tenantId: number,
    filters?: Record<string, any>,
    config?: DeliveryOrderConfig
  ): Promise<DeliveryOrderDto[]> {
    if (!config) {
      throw new Error("External database configuration is required");
    }

    const cacheKey = `do:${tenantId}:all:${JSON.stringify(filters || {})}`;
    const cached = this.cacheService.get<DeliveryOrderDto[]>(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      let query: string;
      const params: any[] = [];

      // Build query with optional vendor join
      if (config.vendorJoin) {
        const vj = config.vendorJoin;
        query = `SELECT d.*, v.${vj.nameField} as _vendorName 
                 FROM ${config.tableName} d 
                 LEFT JOIN ${vj.tableName} v ON d.${vj.foreignKey} = v.${vj.primaryKey}`;
      } else {
        query = `SELECT * FROM ${config.tableName}`;
      }

      if (filters?.vendorId) {
        const vendorIdField = this.fieldMappingService.getExternalField(
          config.mappings,
          "vendorId"
        );
        query += ` WHERE ${config.vendorJoin ? "d." : ""}${vendorIdField} = ?`;
        params.push(filters.vendorId);
      }

      this.logger.debug(`Executing query: ${query}`, {
        params,
        vendorJoin: config.vendorJoin,
      });

      const rows = await this.connectionService.executeQuery<any>(
        tenantId,
        config.dbConfig,
        query,
        params
      );

      this.logger.debug(`Query returned ${rows.length} rows`, {
        firstRow: rows[0],
      });

      // Map delivery orders
      const deliveryOrders = rows.map((row) =>
        this.mapToDto(row, config.mappings, config.vendorJoin)
      );

      // Fetch items for all delivery orders if item config is provided
      if (config.itemConfig && deliveryOrders.length > 0) {
        await this.fetchItemsForOrders(
          tenantId,
          deliveryOrders,
          config.dbConfig,
          config.itemConfig
        );
      }

      this.cacheService.set(cacheKey, deliveryOrders, config.cacheTtl);
      return deliveryOrders;
    } catch (error) {
      this.logger.error(
        `Failed to fetch delivery orders from external DB for tenant ${tenantId}`,
        error.stack
      );
      throw new Error(`External database unavailable: ${error.message}`);
    }
  }

  /**
   * Find a single delivery order by ID from external database
   */
  async findOne(
    tenantId: number,
    id: number | string,
    config?: DeliveryOrderConfig
  ): Promise<DeliveryOrderDto | null> {
    if (!config) {
      throw new Error("External database configuration is required");
    }

    const cacheKey = `do:${tenantId}:${id}`;
    const cached = this.cacheService.get<DeliveryOrderDto>(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const idField = this.fieldMappingService.getExternalField(
        config.mappings,
        "id"
      );

      let query: string;
      if (config.vendorJoin) {
        const vj = config.vendorJoin;
        query = `SELECT d.*, v.${vj.nameField} as _vendorName 
                 FROM ${config.tableName} d 
                 LEFT JOIN ${vj.tableName} v ON d.${vj.foreignKey} = v.${vj.primaryKey}
                 WHERE d.${idField} = ?`;
      } else {
        query = `SELECT * FROM ${config.tableName} WHERE ${idField} = ?`;
      }

      const rows = await this.connectionService.executeQuery<any>(
        tenantId,
        config.dbConfig,
        query,
        [id]
      );

      if (rows.length === 0) {
        return null;
      }

      const deliveryOrder = this.mapToDto(
        rows[0],
        config.mappings,
        config.vendorJoin
      );

      // Fetch items if item config is provided
      if (config.itemConfig) {
        await this.fetchItemsForOrders(
          tenantId,
          [deliveryOrder],
          config.dbConfig,
          config.itemConfig
        );
      }

      this.cacheService.set(cacheKey, deliveryOrder, config.cacheTtl);
      return deliveryOrder;
    } catch (error) {
      this.logger.error(
        `Failed to fetch delivery order ${id} from external DB for tenant ${tenantId}`,
        error.stack
      );
      throw new Error(`External database unavailable: ${error.message}`);
    }
  }

  /**
   * Find multiple delivery orders by IDs from external database
   */
  async findByIds(
    tenantId: number,
    ids: (number | string)[],
    config?: DeliveryOrderConfig
  ): Promise<DeliveryOrderDto[]> {
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

      let query: string;
      if (config.vendorJoin) {
        const vj = config.vendorJoin;
        query = `SELECT d.*, v.${vj.nameField} as _vendorName 
                 FROM ${config.tableName} d 
                 LEFT JOIN ${vj.tableName} v ON d.${vj.foreignKey} = v.${vj.primaryKey}
                 WHERE d.${idField} IN (${placeholders})`;
      } else {
        query = `SELECT * FROM ${config.tableName} WHERE ${idField} IN (${placeholders})`;
      }

      const rows = await this.connectionService.executeQuery<any>(
        tenantId,
        config.dbConfig,
        query,
        ids
      );

      const deliveryOrders = rows.map((row) =>
        this.mapToDto(row, config.mappings, config.vendorJoin)
      );

      // Fetch items if item config is provided
      if (config.itemConfig && deliveryOrders.length > 0) {
        await this.fetchItemsForOrders(
          tenantId,
          deliveryOrders,
          config.dbConfig,
          config.itemConfig
        );
      }

      return deliveryOrders;
    } catch (error) {
      this.logger.error(
        `Failed to fetch delivery orders by IDs from external DB for tenant ${tenantId}`,
        error.stack
      );
      throw new Error(`External database unavailable: ${error.message}`);
    }
  }

  /**
   * Find delivery orders by vendor ID from external database
   */
  async findByVendorId(
    tenantId: number,
    vendorId: number | string,
    config?: DeliveryOrderConfig
  ): Promise<DeliveryOrderDto[]> {
    if (!config) {
      throw new Error("External database configuration is required");
    }

    const cacheKey = `do:${tenantId}:vendor:${vendorId}`;
    const cached = this.cacheService.get<DeliveryOrderDto[]>(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const vendorIdField = this.fieldMappingService.getExternalField(
        config.mappings,
        "vendorId"
      );

      let query: string;
      if (config.vendorJoin) {
        const vj = config.vendorJoin;
        query = `SELECT d.*, v.${vj.nameField} as _vendorName 
                 FROM ${config.tableName} d 
                 LEFT JOIN ${vj.tableName} v ON d.${vj.foreignKey} = v.${vj.primaryKey}
                 WHERE d.${vendorIdField} = ?`;
      } else {
        query = `SELECT * FROM ${config.tableName} WHERE ${vendorIdField} = ?`;
      }

      const rows = await this.connectionService.executeQuery<any>(
        tenantId,
        config.dbConfig,
        query,
        [vendorId]
      );

      const deliveryOrders = rows.map((row) =>
        this.mapToDto(row, config.mappings, config.vendorJoin)
      );

      // Fetch items if item config is provided
      if (config.itemConfig && deliveryOrders.length > 0) {
        await this.fetchItemsForOrders(
          tenantId,
          deliveryOrders,
          config.dbConfig,
          config.itemConfig
        );
      }

      this.cacheService.set(cacheKey, deliveryOrders, config.cacheTtl);
      return deliveryOrders;
    } catch (error) {
      this.logger.error(
        `Failed to fetch delivery orders by vendor from external DB for tenant ${tenantId}`,
        error.stack
      );
      throw new Error(`External database unavailable: ${error.message}`);
    }
  }

  /**
   * Fetch items for multiple delivery orders using the configured relation key
   */
  private async fetchItemsForOrders(
    tenantId: number,
    deliveryOrders: DeliveryOrderDto[],
    dbConfig: ExternalDbConfig,
    itemConfig: {
      tableName: string;
      mappings: FieldMapping[];
      relationKey: string;
      materialJoin?: {
        tableName: string;
        foreignKey: string;
        primaryKey: string;
        nameField: string;
      };
    }
  ): Promise<void> {
    if (deliveryOrders.length === 0) {
      return;
    }

    try {
      // Get the relation key values from delivery orders (e.g., doNumber or id)
      const relationKey = itemConfig.relationKey; // e.g., 'doNumber'
      const relationValues = deliveryOrders.map((d) => d[relationKey]);

      this.logger.debug(`Fetching items for DOs`, {
        relationKey,
        relationValues: relationValues.slice(0, 5),
        itemTable: itemConfig.tableName,
        firstDO: deliveryOrders[0],
      });

      // Get the external field name for the relation key in items table
      const externalRelationField = this.fieldMappingService.getExternalField(
        itemConfig.mappings,
        relationKey
      );

      this.logger.debug(`External relation field: ${externalRelationField}`);

      // Build query with optional material join
      let query: string;
      const placeholders = relationValues.map(() => "?").join(", ");

      if (itemConfig.materialJoin) {
        const mj = itemConfig.materialJoin;
        query = `SELECT i.*, m.${mj.nameField} as _materialName 
                 FROM ${itemConfig.tableName} i 
                 LEFT JOIN ${mj.tableName} m ON i.${mj.foreignKey} = m.${mj.primaryKey}
                 WHERE i.${externalRelationField} IN (${placeholders})`;
      } else {
        query = `SELECT * FROM ${itemConfig.tableName} WHERE ${externalRelationField} IN (${placeholders})`;
      }

      this.logger.debug(`Item query: ${query}`);

      const itemRows = await this.connectionService.executeQuery<any>(
        tenantId,
        dbConfig,
        query,
        relationValues
      );

      this.logger.debug(`Found ${itemRows.length} item rows`);

      // Map items and group by relation key value
      const itemsByRelationKey = new Map<string, DeliveryOrderItemDto[]>();

      for (const row of itemRows) {
        const item = this.mapItemToDto(
          row,
          itemConfig.mappings,
          itemConfig.materialJoin
        );
        const mapped = this.fieldMappingService.applyMappings(
          row,
          itemConfig.mappings
        );
        const keyValue = String(mapped[relationKey]);

        if (!itemsByRelationKey.has(keyValue)) {
          itemsByRelationKey.set(keyValue, []);
        }
        itemsByRelationKey.get(keyValue)!.push(item);
      }

      // Assign items to their respective delivery orders
      for (const deliveryOrder of deliveryOrders) {
        const keyValue = String(deliveryOrder[relationKey]);
        deliveryOrder.items = itemsByRelationKey.get(keyValue) || [];
      }
    } catch (error) {
      this.logger.warn(
        `Failed to fetch items for delivery orders: ${error.message}`
      );
      // Don't fail the whole request if items can't be fetched
      for (const deliveryOrder of deliveryOrders) {
        deliveryOrder.items = [];
      }
    }
  }

  /**
   * Map external database row to DeliveryOrderDto using field mappings
   */
  private mapToDto(
    row: any,
    mappings: FieldMapping[],
    vendorJoin?: { nameField: string }
  ): DeliveryOrderDto {
    const mapped = this.fieldMappingService.applyMappings(row, mappings);

    // Get vendor name from join result or from mapping
    let vendorName = mapped.vendorName;
    if (!vendorName && vendorJoin && row._vendorName) {
      vendorName = row._vendorName;
    }

    return {
      id: mapped.id,
      doNumber: mapped.doNumber || "",
      vendorId: mapped.vendorId,
      vendorName: vendorName,
      doDate: mapped.doDate,
      vehicleNo: mapped.vehicleNo,
      grossWeight: mapped.grossWeight,
      tareWeight: mapped.tareWeight,
      netWeight: mapped.netWeight,
      totalAmount: mapped.totalAmount,
      remarks: mapped.remarks,
      items: [],
      isExternal: true,
    };
  }

  /**
   * Map external database row to DeliveryOrderItemDto using field mappings
   */
  private mapItemToDto(
    row: any,
    mappings: FieldMapping[],
    materialJoin?: { nameField: string }
  ): DeliveryOrderItemDto {
    const mapped = this.fieldMappingService.applyMappings(row, mappings);

    // Get material name from join result or from mapping
    let materialName = mapped.materialName;
    if (!materialName && materialJoin && row._materialName) {
      materialName = row._materialName;
    }

    return {
      id: mapped.id,
      materialId: mapped.materialId,
      materialName: materialName,
      wbNetWeight: mapped.wbNetWeight,
      quantity: mapped.quantity,
      rate: mapped.rate,
      amount: mapped.amount,
    };
  }
}
