import { ApiProperty } from "@nestjs/swagger";
import { IsNumber, IsOptional, IsString } from "class-validator";

export class RecordItemWeightDto {
  @ApiProperty({ description: "Item ID to record weight for" })
  @IsNumber()
  itemId: number;

  @ApiProperty({
    description: "Weight after loading this item (gross weight)",
    example: 15000,
  })
  @IsNumber()
  weightAfterLoading: number;

  @ApiProperty({ description: "Weighbridge ID used", example: 1 })
  @IsNumber()
  @IsOptional()
  weighbridgeId?: number;

  @ApiProperty({ description: "Remarks for this item" })
  @IsString()
  @IsOptional()
  itemRemarks?: string;
}
