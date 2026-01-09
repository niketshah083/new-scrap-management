import { ApiProperty } from "@nestjs/swagger";
import {
  IsString,
  IsOptional,
  IsBoolean,
  MaxLength,
  IsNotEmpty,
} from "class-validator";

export class CreateTransporterDto {
  @ApiProperty({ description: "Transporter name", example: "ABC Transport" })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  transporterName: string;

  @ApiProperty({ description: "GSTIN number", example: "27AABCU9603R1ZM" })
  @IsString()
  @IsOptional()
  @MaxLength(20)
  gstin?: string;

  @ApiProperty({ description: "Mobile number", example: "9876543210" })
  @IsString()
  @IsOptional()
  @MaxLength(20)
  mobileNo?: string;

  @ApiProperty({ description: "GST State", example: "Maharashtra" })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  gstState?: string;

  @ApiProperty({ description: "Is active", default: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
