import { Module, forwardRef } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { CameraController } from "./camera.controller";
import { CameraService } from "./camera.service";
import { CameraMaster, CameraConfig } from "../../entities";
import { DeviceBridgeModule } from "../device-bridge/device-bridge.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([CameraMaster, CameraConfig]),
    forwardRef(() => DeviceBridgeModule),
  ],
  controllers: [CameraController],
  providers: [CameraService],
  exports: [CameraService],
})
export class CameraModule {}
