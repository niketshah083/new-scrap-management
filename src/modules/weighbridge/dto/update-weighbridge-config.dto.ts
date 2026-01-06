import { ApiProperty } from "@nestjs/swagger";
import {
  IsString,
  IsOptional,
  MaxLength,
  IsBoolean,
  IsNumber,
  Min,
  Max,
} from "class-validator";

export class UpdateWeighbridgeConfigDto {
  @ApiProperty({ description: "Serial port", example: "COM1", required: false })
  @IsString()
  @IsOptional()
  @MaxLength(50)
  serialPort?: string;

  @ApiProperty({ description: "Baud rate", example: 9600, required: false })
  @IsNumber()
  @IsOptional()
  baudRate?: number;

  @ApiProperty({ description: "Data bits", example: 8, required: false })
  @IsNumber()
  @IsOptional()
  @Min(5)
  @Max(8)
  dataBits?: number;

  @ApiProperty({ description: "Stop bits", example: 1, required: false })
  @IsNumber()
  @IsOptional()
  @Min(1)
  @Max(2)
  stopBits?: number;

  @ApiProperty({ description: "Parity", example: "none", required: false })
  @IsString()
  @IsOptional()
  @MaxLength(10)
  parity?: string;

  @ApiProperty({
    description: "Weight regex pattern",
    example: "\\d+\\.?\\d*",
    required: false,
  })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  weightRegex?: string;

  @ApiProperty({
    description: "Weight start marker",
    example: "ST",
    required: false,
  })
  @IsString()
  @IsOptional()
  @MaxLength(50)
  weightStartMarker?: string;

  @ApiProperty({
    description: "Weight end marker",
    example: "kg",
    required: false,
  })
  @IsString()
  @IsOptional()
  @MaxLength(50)
  weightEndMarker?: string;

  @ApiProperty({
    description: "Weight multiplier",
    example: 1,
    required: false,
  })
  @IsNumber()
  @IsOptional()
  weightMultiplier?: number;

  @ApiProperty({ description: "Weight unit", example: "kg", required: false })
  @IsString()
  @IsOptional()
  @MaxLength(20)
  weightUnit?: string;

  @ApiProperty({
    description: "Polling interval in ms",
    example: 1000,
    required: false,
  })
  @IsNumber()
  @IsOptional()
  pollingInterval?: number;

  @ApiProperty({
    description: "Number of stable readings required",
    example: 3,
    required: false,
  })
  @IsNumber()
  @IsOptional()
  stableReadings?: number;

  @ApiProperty({
    description: "Stability threshold",
    example: 0.5,
    required: false,
  })
  @IsNumber()
  @IsOptional()
  stabilityThreshold?: number;

  @ApiProperty({ description: "Active status", example: true, required: false })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
