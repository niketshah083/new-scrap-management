import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Tenant } from "../../entities/tenant.entity";
import { EncryptionService } from "../../common/services/encryption.service";
import { ExternalDbConfig } from "../external-connection/external-connection.service";
import {
  IVendorDataSource,
  IPurchaseOrderDataSource,
  IMaterialDataSource,
  VendorDto,
  PurchaseOrderDto,
  MaterialDto,
} from "./interfaces";
import { InternalVendorDataSource } from "./internal/internal-vendor.data-source";
import { InternalPurchaseOrderDataSource } from "./internal/internal-purchase-order.data-source";
import { InternalMaterialDataSource } from "./internal/internal-material.data-source";
import { ExternalVendorDataSource } from "./external/external-vendor.data-source";
import { ExternalPurchaseOrderDataSource } from "./external/external-purchase-order.data-source";
import { ExternalMaterialDataSource } from "./external/external-material.data-source";
import { FieldMappingService } from "./services/field-mapping.service";

/**
 * Data Source Factory
 * Determines which data source (internal or external) to use based on tenant configuration
 */
@Injectable()
export class DataSourceFactoryService {
  private readonly logger = new Logger(DataSourceFactoryService.name);

  constructor(
    @InjectRepository(Tenant)
    private readonly tenantRepository: Repository<Tenant>,
    private readonly encryptionService: EncryptionService,
    private readonly fieldMappingService: FieldMappingService,
    private readonly internalVendorDataSource: InternalVendorDataSource,
    private readonly internalPurchaseOrderDataSource: InternalPurchaseOrderDataSource,
    private readonly internalMaterialDataSource: InternalMaterialDataSource,
    private readonly externalVendorDataSource: ExternalVendorDataSource,
    private readonly externalPurchaseOrderDataSource: ExternalPurchaseOrderDataSource,
    private readonly externalMaterialDataSource: ExternalMaterialDataSource
  ) {}

  /**
   * Get vendor data source for a tenant
   */
  async getVendors(
    tenantId: number,
    filters?: Record<string, any>
  ): Promise<VendorDto[]> {
    const tenant = await this.getTenant(tenantId);

    if (this.shouldUseExternalDb(tenant)) {
      const config = this.getExternalConfig(tenant, "vendor");
      return this.externalVendorDataSource.findAll(tenantId, filters, config);
    }

    return this.internalVendorDataSource.findAll(tenantId, filters);
  }

  /**
   * Get a single vendor by ID
   */
  async getVendor(
    tenantId: number,
    id: number | string
  ): Promise<VendorDto | null> {
    const tenant = await this.getTenant(tenantId);

    if (this.shouldUseExternalDb(tenant)) {
      const config = this.getExternalConfig(tenant, "vendor");
      return this.externalVendorDataSource.findOne(tenantId, id, config);
    }

    return this.internalVendorDataSource.findOne(tenantId, id);
  }

  /**
   * Get vendors by IDs
   */
  async getVendorsByIds(
    tenantId: number,
    ids: (number | string)[]
  ): Promise<VendorDto[]> {
    const tenant = await this.getTenant(tenantId);

    if (this.shouldUseExternalDb(tenant)) {
      const config = this.getExternalConfig(tenant, "vendor");
      return this.externalVendorDataSource.findByIds(tenantId, ids, config);
    }

    return this.internalVendorDataSource.findByIds(tenantId, ids);
  }

  /**
   * Get purchase order data source for a tenant
   */
  async getPurchaseOrders(
    tenantId: number,
    filters?: Record<string, any>
  ): Promise<PurchaseOrderDto[]> {
    const tenant = await this.getTenant(tenantId);

    if (this.shouldUseExternalDb(tenant)) {
      const config = this.getExternalConfig(tenant, "purchaseOrder");
      return this.externalPurchaseOrderDataSource.findAll(
        tenantId,
        filters,
        config
      );
    }

    return this.internalPurchaseOrderDataSource.findAll(tenantId, filters);
  }

  /**
   * Get a single purchase order by ID
   */
  async getPurchaseOrder(
    tenantId: number,
    id: number | string
  ): Promise<PurchaseOrderDto | null> {
    const tenant = await this.getTenant(tenantId);

    if (this.shouldUseExternalDb(tenant)) {
      const config = this.getExternalConfig(tenant, "purchaseOrder");
      return this.externalPurchaseOrderDataSource.findOne(tenantId, id, config);
    }

    return this.internalPurchaseOrderDataSource.findOne(tenantId, id);
  }

  /**
   * Get purchase orders by vendor ID
   */
  async getPurchaseOrdersByVendor(
    tenantId: number,
    vendorId: number | string
  ): Promise<PurchaseOrderDto[]> {
    const tenant = await this.getTenant(tenantId);

    if (this.shouldUseExternalDb(tenant)) {
      const config = this.getExternalConfig(tenant, "purchaseOrder");
      return this.externalPurchaseOrderDataSource.findByVendorId(
        tenantId,
        vendorId,
        config
      );
    }

    return this.internalPurchaseOrderDataSource.findByVendorId(
      tenantId,
      vendorId
    );
  }

  /**
   * Get material data source for a tenant
   */
  async getMaterials(
    tenantId: number,
    filters?: Record<string, any>
  ): Promise<MaterialDto[]> {
    const tenant = await this.getTenant(tenantId);

    if (this.shouldUseExternalDb(tenant)) {
      const config = this.getExternalConfig(tenant, "material");
      return this.externalMaterialDataSource.findAll(tenantId, filters, config);
    }

    return this.internalMaterialDataSource.findAll(tenantId, filters);
  }

  /**
   * Get a single material by ID
   */
  async getMaterial(
    tenantId: number,
    id: number | string
  ): Promise<MaterialDto | null> {
    const tenant = await this.getTenant(tenantId);

    if (this.shouldUseExternalDb(tenant)) {
      const config = this.getExternalConfig(tenant, "material");
      return this.externalMaterialDataSource.findOne(tenantId, id, config);
    }

    return this.internalMaterialDataSource.findOne(tenantId, id);
  }

  /**
   * Get materials by IDs
   */
  async getMaterialsByIds(
    tenantId: number,
    ids: (number | string)[]
  ): Promise<MaterialDto[]> {
    const tenant = await this.getTenant(tenantId);

    if (this.shouldUseExternalDb(tenant)) {
      const config = this.getExternalConfig(tenant, "material");
      return this.externalMaterialDataSource.findByIds(tenantId, ids, config);
    }

    return this.internalMaterialDataSource.findByIds(tenantId, ids);
  }

  /**
   * Check if external database is enabled for a tenant
   */
  async isExternalDbEnabled(tenantId: number): Promise<boolean> {
    const tenant = await this.getTenant(tenantId);
    return this.shouldUseExternalDb(tenant);
  }

  /**
   * Get tenant by ID
   */
  private async getTenant(tenantId: number): Promise<Tenant> {
    const tenant = await this.tenantRepository.findOne({
      where: { id: tenantId },
    });

    if (!tenant) {
      throw new Error(`Tenant with ID ${tenantId} not found`);
    }

    return tenant;
  }

  /**
   * Check if external database should be used
   */
  private shouldUseExternalDb(tenant: Tenant): boolean {
    return (
      tenant.externalDbEnabled &&
      !!tenant.externalDbHost &&
      !!tenant.externalDbName &&
      !!tenant.externalDbUsername &&
      !!tenant.externalDbPassword
    );
  }

  /**
   * Get external database configuration for a specific entity type
   */
  private getExternalConfig(
    tenant: Tenant,
    entityType: "vendor" | "purchaseOrder" | "material"
  ): {
    dbConfig: ExternalDbConfig;
    tableName: string;
    mappings: any[];
    cacheTtl: number;
  } {
    const dbConfig: ExternalDbConfig = {
      host: tenant.externalDbHost,
      port: tenant.externalDbPort || 3306,
      database: tenant.externalDbName,
      username: tenant.externalDbUsername,
      password: this.encryptionService.decrypt(tenant.externalDbPassword),
    };

    let tableName: string;
    let customMappings: any[] | null;
    const defaultMappings =
      this.fieldMappingService.getDefaultMappings(entityType);

    switch (entityType) {
      case "vendor":
        tableName = tenant.externalDbVendorTable || "vendors";
        customMappings = tenant.externalDbVendorMappings;
        break;
      case "purchaseOrder":
        tableName = tenant.externalDbPoTable || "purchase_orders";
        customMappings = tenant.externalDbPoMappings;
        break;
      case "material":
        tableName = tenant.externalDbMaterialTable || "materials";
        customMappings = tenant.externalDbMaterialMappings;
        break;
    }

    return {
      dbConfig,
      tableName,
      mappings: this.fieldMappingService.mergeMappings(
        customMappings,
        defaultMappings
      ),
      cacheTtl: tenant.externalDbCacheTtl || 300,
    };
  }
}
