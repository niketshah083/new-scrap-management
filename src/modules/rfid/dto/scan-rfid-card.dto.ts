import { IsString } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class ScanRFIDCardDto {
  @ApiProperty({ description: "Card number scanned from RFID reader" })
  @IsString()
  cardNumber: string;
}
