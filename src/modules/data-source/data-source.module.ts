import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Tenant } from "../../entities/tenant.entity";
import { Vendor } from "../../entities/vendor.entity";
import { PurchaseOrder } from "../../entities/purchase-order.entity";
import { Material } from "../../entities/material.entity";
import { DeliveryOrder } from "../../entities/delivery-order.entity";
import { Transporter } from "../../entities/transporter.entity";
import { DataSourceFactoryService } from "./data-source-factory.service";
import { FieldMappingService } from "./services/field-mapping.service";
import { CacheService } from "./services/cache.service";
import { InternalVendorDataSource } from "./internal/internal-vendor.data-source";
import { InternalPurchaseOrderDataSource } from "./internal/internal-purchase-order.data-source";
import { InternalMaterialDataSource } from "./internal/internal-material.data-source";
import { InternalDeliveryOrderDataSource } from "./internal/internal-delivery-order.data-source";
import { InternalTransporterDataSource } from "./internal/internal-transporter.data-source";
import { ExternalVendorDataSource } from "./external/external-vendor.data-source";
import { ExternalPurchaseOrderDataSource } from "./external/external-purchase-order.data-source";
import { ExternalMaterialDataSource } from "./external/external-material.data-source";
import { ExternalDeliveryOrderDataSource } from "./external/external-delivery-order.data-source";
import { ExternalTransporterDataSource } from "./external/external-transporter.data-source";

/**
 * Data Source Module
 * Provides data source factory and related services for fetching data
 * from internal or external databases based on tenant configuration
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([
      Tenant,
      Vendor,
      PurchaseOrder,
      Material,
      DeliveryOrder,
      Transporter,
    ]),
  ],
  providers: [
    DataSourceFactoryService,
    FieldMappingService,
    CacheService,
    InternalVendorDataSource,
    InternalPurchaseOrderDataSource,
    InternalMaterialDataSource,
    InternalDeliveryOrderDataSource,
    InternalTransporterDataSource,
    ExternalVendorDataSource,
    ExternalPurchaseOrderDataSource,
    ExternalMaterialDataSource,
    ExternalDeliveryOrderDataSource,
    ExternalTransporterDataSource,
  ],
  exports: [DataSourceFactoryService, FieldMappingService, CacheService],
})
export class DataSourceModule {}
