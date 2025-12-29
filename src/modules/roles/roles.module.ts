import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { RolesController } from "./roles.controller";
import { RolesService } from "./roles.service";
import { Role } from "../../entities/role.entity";
import { Permission } from "../../entities/permission.entity";
import { Subscription } from "../../entities/subscription.entity";

@Module({
  imports: [TypeOrmModule.forFeature([Role, Permission, Subscription])],
  controllers: [RolesController],
  providers: [RolesService],
  exports: [RolesService],
})
export class RolesModule {}
