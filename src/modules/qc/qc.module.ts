import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { QCController } from "./qc.controller";
import { QCService } from "./qc.service";
import { QCInspection } from "../../entities/qc-inspection.entity";
import { GRN } from "../../entities/grn.entity";
import { GatePass } from "../../entities/gate-pass.entity";
import { GRNFieldValue } from "../../entities/grn-field-value.entity";

@Module({
  imports: [
    TypeOrmModule.forFeature([QCInspection, GRN, GatePass, GRNFieldValue]),
  ],
  controllers: [QCController],
  providers: [QCService],
  exports: [QCService],
})
export class QCModule {}
