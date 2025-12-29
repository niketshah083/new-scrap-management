import { ApiProperty } from "@nestjs/swagger";
import {
  IsNumber,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsArray,
  ValidateNested,
} from "class-validator";
import { Type } from "class-transformer";

export class TestParameterDto {
  @ApiProperty({ description: "Parameter name", example: "Moisture Content" })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: "Expected value", example: "< 5%" })
  @IsString()
  @IsNotEmpty()
  expectedValue: string;

  @ApiProperty({ description: "Actual value", example: "4.2%" })
  @IsString()
  @IsNotEmpty()
  actualValue: string;

  @ApiProperty({ description: "Unit", example: "%" })
  @IsString()
  @IsOptional()
  unit?: string;

  @ApiProperty({ description: "Whether test passed", example: true })
  passed: boolean;
}

export class CreateQCInspectionDto {
  @ApiProperty({ description: "GRN ID", example: 1 })
  @IsNumber()
  @IsNotEmpty()
  grnId: number;

  @ApiProperty({ description: "Material ID", example: 1, required: false })
  @IsNumber()
  @IsOptional()
  materialId?: number;
}

export class UpdateQCInspectionDto {
  @ApiProperty({
    description: "Test parameters",
    type: [TestParameterDto],
    required: false,
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TestParameterDto)
  @IsOptional()
  testParameters?: TestParameterDto[];

  @ApiProperty({
    description: "Moisture content percentage",
    example: 4.5,
    required: false,
  })
  @IsNumber()
  @IsOptional()
  moistureContent?: number;

  @ApiProperty({
    description: "Impurity percentage",
    example: 2.3,
    required: false,
  })
  @IsNumber()
  @IsOptional()
  impurityPercentage?: number;

  @ApiProperty({
    description: "Quality grade (1-10)",
    example: 8.5,
    required: false,
  })
  @IsNumber()
  @IsOptional()
  qualityGrade?: number;

  @ApiProperty({
    description: "Remarks",
    example: "Good quality material",
    required: false,
  })
  @IsString()
  @IsOptional()
  remarks?: string;

  @ApiProperty({
    description: "Sample photos URLs",
    example: ["url1", "url2"],
    required: false,
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  samplePhotos?: string[];
}

export class CompleteQCInspectionDto extends UpdateQCInspectionDto {
  @ApiProperty({
    description: "QC result status",
    enum: ["pass", "fail"],
    example: "pass",
  })
  @IsString()
  @IsNotEmpty()
  result: "pass" | "fail";

  @ApiProperty({
    description: "Failure reason (required if result is fail)",
    example: "High moisture content",
    required: false,
  })
  @IsString()
  @IsOptional()
  failureReason?: string;
}
