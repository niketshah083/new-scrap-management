import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { GRNFieldConfigController } from "./grn-field-config.controller";
import { GRNFieldConfigService } from "./grn-field-config.service";
import { GRNFieldConfig } from "../../entities/grn-field-config.entity";

@Module({
  imports: [TypeOrmModule.forFeature([GRNFieldConfig])],
  controllers: [GRNFieldConfigController],
  providers: [GRNFieldConfigService],
  exports: [GRNFieldConfigService],
})
export class GRNFieldConfigModule {}
