import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { VendorsController } from "./vendors.controller";
import { VendorsService } from "./vendors.service";
import { Vendor } from "../../entities/vendor.entity";
import { DataSourceModule } from "../data-source/data-source.module";

@Module({
  imports: [TypeOrmModule.forFeature([Vendor]), DataSourceModule],
  controllers: [VendorsController],
  providers: [VendorsService],
  exports: [VendorsService],
})
export class VendorsModule {}
