import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { GRNController } from "./grn.controller";
import { GRNService } from "./grn.service";
import { GRN } from "../../entities/grn.entity";
import { GRNFieldValue } from "../../entities/grn-field-value.entity";
import { GRNFieldConfig } from "../../entities/grn-field-config.entity";
import { Vendor } from "../../entities/vendor.entity";
import { PurchaseOrder } from "../../entities/purchase-order.entity";
import { RFIDCard } from "../../entities/rfid-card.entity";
import { UploadsModule } from "../uploads/uploads.module";
import { DataSourceModule } from "../data-source/data-source.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      GRN,
      GRNFieldValue,
      GRNFieldConfig,
      Vendor,
      PurchaseOrder,
      RFIDCard,
    ]),
    UploadsModule,
    DataSourceModule,
  ],
  controllers: [GRNController],
  providers: [GRNService],
  exports: [GRNService],
})
export class GRNModule {}
