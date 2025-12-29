import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { SubscriptionsController } from "./subscriptions.controller";
import { SubscriptionsService } from "./subscriptions.service";
import { Subscription } from "../../entities/subscription.entity";
import { Tenant } from "../../entities/tenant.entity";
import { Plan } from "../../entities/plan.entity";

@Module({
  imports: [TypeOrmModule.forFeature([Subscription, Tenant, Plan])],
  controllers: [SubscriptionsController],
  providers: [SubscriptionsService],
  exports: [SubscriptionsService],
})
export class SubscriptionsModule {}
