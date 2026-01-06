import { Module, forwardRef } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { WeighbridgeController } from "./weighbridge.controller";
import { WeighbridgeService } from "./weighbridge.service";
import { WeighbridgeMaster, WeighbridgeConfig } from "../../entities";
import { DeviceBridgeModule } from "../device-bridge/device-bridge.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([WeighbridgeMaster, WeighbridgeConfig]),
    forwardRef(() => DeviceBridgeModule),
  ],
  controllers: [WeighbridgeController],
  providers: [WeighbridgeService],
  exports: [WeighbridgeService],
})
export class WeighbridgeModule {}
