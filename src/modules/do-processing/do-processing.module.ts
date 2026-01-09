import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { DoProcessing } from "../../entities/do-processing.entity";
import { DoProcessingItem } from "../../entities/do-processing-item.entity";
import { RFIDCard } from "../../entities/rfid-card.entity";
import { DoProcessingService } from "./do-processing.service";
import { DoProcessingController } from "./do-processing.controller";
import { DeviceBridgeModule } from "../device-bridge/device-bridge.module";
import { TransporterModule } from "../transporter/transporter.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([DoProcessing, DoProcessingItem, RFIDCard]),
    DeviceBridgeModule,
    TransporterModule,
  ],
  controllers: [DoProcessingController],
  providers: [DoProcessingService],
  exports: [DoProcessingService],
})
export class DoProcessingModule {}
