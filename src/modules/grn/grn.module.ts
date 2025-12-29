import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { GRNController } from "./grn.controller";
import { GRNService } from "./grn.service";
import { GRN } from "../../entities/grn.entity";
import { GRNFieldValue } from "../../entities/grn-field-value.entity";
import { Vendor } from "../../entities/vendor.entity";
import { PurchaseOrder } from "../../entities/purchase-order.entity";
import { UploadsModule } from "../uploads/uploads.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([GRN, GRNFieldValue, Vendor, PurchaseOrder]),
    UploadsModule,
  ],
  controllers: [GRNController],
  providers: [GRNService],
  exports: [GRNService],
})
export class GRNModule {}
