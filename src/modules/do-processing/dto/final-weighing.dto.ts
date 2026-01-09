import { ApiProperty } from "@nestjs/swagger";
import { IsNumber, IsOptional, IsString } from "class-validator";

export class FinalWeighingDto {
  @ApiProperty({
    description: "Final gross weight from weighbridge-1 in kg",
    example: 15000,
  })
  @IsNumber()
  finalGrossWeight: number;

  @ApiProperty({ description: "Weighbridge-1 ID used", example: 1 })
  @IsNumber()
  @IsOptional()
  weighbridgeId?: number;

  @ApiProperty({ description: "Final remarks" })
  @IsString()
  @IsOptional()
  remarks?: string;
}
