import { ApiProperty } from "@nestjs/swagger";
import { IsNumber, IsOptional, IsString } from "class-validator";

export class CompleteProcessingDto {
  @ApiProperty({ description: "Final gross weight (optional verification)" })
  @IsNumber()
  @IsOptional()
  finalGrossWeight?: number;

  @ApiProperty({ description: "Weighbridge ID for final weight" })
  @IsNumber()
  @IsOptional()
  weighbridgeId?: number;

  @ApiProperty({ description: "Final remarks" })
  @IsString()
  @IsOptional()
  remarks?: string;
}
