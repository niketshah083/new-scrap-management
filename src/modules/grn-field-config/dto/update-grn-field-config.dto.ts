import { ApiProperty } from "@nestjs/swagger";
import {
  IsString,
  IsOptional,
  MaxLength,
  IsNumber,
  IsBoolean,
  IsArray,
  Min,
  Max,
  IsEnum,
} from "class-validator";
import { FieldType } from "./create-grn-field-config.dto";

export class UpdateGRNFieldConfigDto {
  @ApiProperty({
    description: "Step number (1-7)",
    example: 1,
    required: false,
  })
  @IsNumber()
  @Min(1)
  @Max(7)
  @IsOptional()
  stepNumber?: number;

  @ApiProperty({
    description: "Field name (internal identifier)",
    example: "truck_number",
    required: false,
  })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  fieldName?: string;

  @ApiProperty({
    description: "Field label (display name)",
    example: "Truck Number",
    required: false,
  })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  fieldLabel?: string;

  @ApiProperty({
    description: "Field type",
    enum: FieldType,
    example: "text",
    required: false,
  })
  @IsEnum(FieldType)
  @IsOptional()
  fieldType?: FieldType;

  @ApiProperty({
    description: "Is field required",
    example: true,
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  isRequired?: boolean;

  @ApiProperty({ description: "Display order", example: 1, required: false })
  @IsNumber()
  @IsOptional()
  displayOrder?: number;

  @ApiProperty({
    description: "Options for dropdown type",
    example: ["Option 1", "Option 2"],
    required: false,
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  options?: string[];

  @ApiProperty({
    description: "Allow multiple files (for file/photo type)",
    example: false,
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  allowMultiple?: boolean;

  @ApiProperty({
    description: "Maximum number of files when allowMultiple is true",
    example: 5,
    required: false,
  })
  @IsNumber()
  @Min(1)
  @Max(20)
  @IsOptional()
  maxFiles?: number;

  @ApiProperty({
    description: "Is field active",
    example: true,
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
