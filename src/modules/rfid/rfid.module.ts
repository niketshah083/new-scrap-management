import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { RFIDController } from "./rfid.controller";
import { RFIDService } from "./rfid.service";
import { RFIDCard } from "../../entities/rfid-card.entity";
import { GRN } from "../../entities/grn.entity";

@Module({
  imports: [TypeOrmModule.forFeature([RFIDCard, GRN])],
  controllers: [RFIDController],
  providers: [RFIDService],
  exports: [RFIDService],
})
export class RFIDModule {}
