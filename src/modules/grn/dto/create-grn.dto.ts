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
    description: "Purchase Order ID (internal, optional)",
    example: 1,
    required: false,
  })
  @IsNumber()
  @IsOptional()
  purchaseOrderId?: number;

  @ApiProperty({
    description: "External Purchase Order ID (when using external DB)",
    example: "PO-2024-001",
    required: false,
  })
  @IsString()
  @IsOptional()
  externalPoId?: string;

  @ApiProperty({
    description: "Vendor ID (internal, optional if using external DB)",
    example: 1,
    required: false,
  })
  @IsNumber()
  @IsOptional()
  vendorId?: number;

  @ApiProperty({
    description: "External Vendor ID (when using external DB)",
    example: "V001",
    required: false,
  })
  @IsString()
  @IsOptional()
  externalVendorId?: string;

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
