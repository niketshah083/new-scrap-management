import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { DeliveryOrder } from "../../entities/delivery-order.entity";
import { DeliveryOrderItem } from "../../entities/delivery-order-item.entity";
import { Vendor } from "../../entities/vendor.entity";
import { Material } from "../../entities/material.entity";
import { DeliveryOrdersController } from "./delivery-orders.controller";
import { DeliveryOrdersService } from "./delivery-orders.service";
import { DataSourceModule } from "../data-source/data-source.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      DeliveryOrder,
      DeliveryOrderItem,
      Vendor,
      Material,
    ]),
    DataSourceModule,
  ],
  controllers: [DeliveryOrdersController],
  providers: [DeliveryOrdersService],
  exports: [DeliveryOrdersService],
})
export class DeliveryOrdersModule {}
