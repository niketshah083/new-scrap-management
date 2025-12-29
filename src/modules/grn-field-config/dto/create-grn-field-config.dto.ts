import { ApiProperty } from "@nestjs/swagger";
import {
  IsString,
  IsNotEmpty,
  MaxLength,
  IsNumber,
  IsBoolean,
  IsOptional,
  IsArray,
  Min,
  Max,
  IsEnum,
} from "class-validator";

export enum FieldType {
  TEXT = "text",
  NUMBER = "number",
  DATE = "date",
  FILE = "file",
  PHOTO = "photo",
  DROPDOWN = "dropdown",
}

export class CreateGRNFieldConfigDto {
  @ApiProperty({ description: "Step number (1-7)", example: 1 })
  @IsNumber()
  @Min(1)
  @Max(7)
  stepNumber: number;

  @ApiProperty({
    description: "Field name (internal identifier)",
    example: "truck_number",
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  fieldName: string;

  @ApiProperty({
    description: "Field label (display name)",
    example: "Truck Number",
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  fieldLabel: string;

  @ApiProperty({ description: "Field type", enum: FieldType, example: "text" })
  @IsEnum(FieldType)
  @IsNotEmpty()
  fieldType: FieldType;

  @ApiProperty({ description: "Is field required", example: true })
  @IsBoolean()
  @IsOptional()
  isRequired?: boolean;

  @ApiProperty({ description: "Display order", example: 1 })
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
}
