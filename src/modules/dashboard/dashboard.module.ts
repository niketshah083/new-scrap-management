import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { DashboardController } from "./dashboard.controller";
import { DashboardService } from "./dashboard.service";
import { GRN } from "../../entities/grn.entity";
import { GatePass } from "../../entities/gate-pass.entity";
import { QCInspection } from "../../entities/qc-inspection.entity";
import { Subscription } from "../../entities/subscription.entity";
import { User } from "../../entities/user.entity";
import { Vendor } from "../../entities/vendor.entity";
import { Material } from "../../entities/material.entity";
import { PurchaseOrder } from "../../entities/purchase-order.entity";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      GRN,
      GatePass,
      QCInspection,
      Subscription,
      User,
      Vendor,
      Material,
      PurchaseOrder,
    ]),
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
  exports: [DashboardService],
})
export class DashboardModule {}
