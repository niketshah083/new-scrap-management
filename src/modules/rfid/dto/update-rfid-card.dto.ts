import { IsString, IsOptional, IsEnum, MaxLength } from "class-validator";
import { ApiPropertyOptional } from "@nestjs/swagger";
import { RFIDCardStatus } from "../../../entities/rfid-card.entity";

export class UpdateRFIDCardDto {
  @ApiPropertyOptional({ description: "Friendly label for the card" })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  label?: string;

  @ApiPropertyOptional({ description: "Card status" })
  @IsOptional()
  @IsEnum(RFIDCardStatus)
  status?: RFIDCardStatus;

  @ApiPropertyOptional({ description: "Additional notes about the card" })
  @IsOptional()
  @IsString()
  notes?: string;
}
