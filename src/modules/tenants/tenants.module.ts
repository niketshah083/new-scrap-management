import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { TenantsController } from "./tenants.controller";
import { TenantsService } from "./tenants.service";
import { Tenant } from "../../entities/tenant.entity";
import { User } from "../../entities/user.entity";
import { Role } from "../../entities/role.entity";
import { GRNFieldConfigModule } from "../grn-field-config/grn-field-config.module";
import { DataSourceModule } from "../data-source/data-source.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([Tenant, User, Role]),
    GRNFieldConfigModule,
    DataSourceModule,
  ],
  controllers: [TenantsController],
  providers: [TenantsService],
  exports: [TenantsService],
})
export class TenantsModule {}
