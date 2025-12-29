import { ApiProperty } from "@nestjs/swagger";
import {
  IsString,
  IsNotEmpty,
  MaxLength,
  IsNumber,
  IsOptional,
  IsArray,
  ValidateNested,
} from "class-validator";
import { Type } from "class-transformer";

class FieldValueDto {
  @ApiProperty({ description: "Field config ID", example: 1 })
  @IsNumber()
  fieldConfigId: number;

  @ApiProperty({ description: "Field value", example: "some value" })
  @IsString()
  value: string;
}

export class CreateGRNDto {
  @ApiProperty({
    description: "Purchase Order ID (optional)",
    example: 1,
    required: false,
  })
  @IsNumber()
  @IsOptional()
  purchaseOrderId?: number;

  @ApiProperty({ description: "Vendor ID", example: 1 })
  @IsNumber()
  @IsNotEmpty()
  vendorId: number;

  @ApiProperty({ description: "Truck number", example: "MH12AB1234" })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  truckNumber: string;

  @ApiProperty({
    description: "Dynamic field values for Step 1",
    type: [FieldValueDto],
    required: false,
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FieldValueDto)
  @IsOptional()
  fieldValues?: FieldValueDto[];
}
