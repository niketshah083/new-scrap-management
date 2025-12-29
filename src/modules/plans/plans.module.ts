import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { PlansController } from "./plans.controller";
import { PlansService } from "./plans.service";
import { Plan } from "../../entities/plan.entity";
import { Module as ModuleEntity } from "../../entities/module.entity";

@Module({
  imports: [TypeOrmModule.forFeature([Plan, ModuleEntity])],
  controllers: [PlansController],
  providers: [PlansService],
  exports: [PlansService],
})
export class PlansModule {}
