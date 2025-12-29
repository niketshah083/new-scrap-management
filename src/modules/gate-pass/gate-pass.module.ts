import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { GatePassController } from "./gate-pass.controller";
import { GatePassService } from "./gate-pass.service";
import { GatePass } from "../../entities/gate-pass.entity";
import { GRN } from "../../entities/grn.entity";

@Module({
  imports: [TypeOrmModule.forFeature([GatePass, GRN])],
  controllers: [GatePassController],
  providers: [GatePassService],
  exports: [GatePassService],
})
export class GatePassModule {}
