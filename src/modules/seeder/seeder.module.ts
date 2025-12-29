import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { SeederController } from "./seeder.controller";
import { SeederService } from "./seeder.service";
import { User } from "../../entities/user.entity";
import { Module as ModuleEntity } from "../../entities/module.entity";
import { Operation } from "../../entities/operation.entity";
import { Permission } from "../../entities/permission.entity";
import { Role } from "../../entities/role.entity";

@Module({
  imports: [
    TypeOrmModule.forFeature([User, ModuleEntity, Operation, Permission, Role]),
  ],
  controllers: [SeederController],
  providers: [SeederService],
  exports: [SeederService],
})
export class SeederModule {}
