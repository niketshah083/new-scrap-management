import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { TransporterController } from "./transporter.controller";
import { TransporterService } from "./transporter.service";
import { Transporter } from "../../entities/transporter.entity";
import { DataSourceModule } from "../data-source";

@Module({
  imports: [TypeOrmModule.forFeature([Transporter]), DataSourceModule],
  controllers: [TransporterController],
  providers: [TransporterService],
  exports: [TransporterService],
})
export class TransporterModule {}
