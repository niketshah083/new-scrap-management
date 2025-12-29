import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { MaterialsController } from "./materials.controller";
import { MaterialsService } from "./materials.service";
import { Material } from "../../entities/material.entity";
import { DataSourceModule } from "../data-source/data-source.module";

@Module({
  imports: [TypeOrmModule.forFeature([Material]), DataSourceModule],
  controllers: [MaterialsController],
  providers: [MaterialsService],
  exports: [MaterialsService],
})
export class MaterialsModule {}
