import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ConfigController } from "./config.controller";
import { ConfigService } from "./config.service";
import { Module as ModuleEntity } from "../../entities/module.entity";
import { Operation } from "../../entities/operation.entity";
import { Permission } from "../../entities/permission.entity";
import { Role } from "../../entities/role.entity";

@Module({
  imports: [
    TypeOrmModule.forFeature([ModuleEntity, Operation, Permission, Role]),
  ],
  controllers: [ConfigController],
  providers: [ConfigService],
  exports: [ConfigService],
})
export class ConfigModule {}
