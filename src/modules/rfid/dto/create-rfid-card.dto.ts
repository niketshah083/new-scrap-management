import { IsString, IsOptional, MaxLength } from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class CreateRFIDCardDto {
  @ApiProperty({ description: "Unique card number/ID from the RFID card" })
  @IsString()
  @MaxLength(50)
  cardNumber: string;

  @ApiPropertyOptional({ description: "Friendly label for the card" })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  label?: string;

  @ApiPropertyOptional({ description: "Additional notes about the card" })
  @IsOptional()
  @IsString()
  notes?: string;
}
