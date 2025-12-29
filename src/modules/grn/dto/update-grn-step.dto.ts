import { ApiProperty } from "@nestjs/swagger";
import {
  IsString,
  IsOptional,
  MaxLength,
  IsNumber,
  IsArray,
  IsEnum,
  ValidateNested,
} from "class-validator";
import { Type } from "class-transformer";

export enum VerificationStatus {
  VERIFIED = "verified",
  NOT_VERIFIED = "not_verified",
}

export enum ApprovalStatus {
  APPROVED = "approved",
  REJECTED = "rejected",
}

// Field value DTO for dynamic fields
export class FieldValueDto {
  @ApiProperty({ description: "Field config ID", example: 1 })
  @IsNumber()
  fieldConfigId: number;

  @ApiProperty({ description: "Field value", example: "some value" })
  @IsString()
  value: string;
}

// Step 2 - Initial Weighing
export class UpdateGRNStep2Dto {
  @ApiProperty({ description: "Gross weight in KG", example: 5000.5 })
  @IsNumber()
  grossWeight: number;

  @ApiProperty({
    description: "Gross weight image URL",
    example: "https://s3.../image.jpg",
    required: false,
  })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  grossWeightImage?: string;

  @ApiProperty({
    description: "Dynamic field values",
    type: [FieldValueDto],
    required: false,
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FieldValueDto)
  @IsOptional()
  fieldValues?: FieldValueDto[];
}

// Step 3 - Unloading
export class UpdateGRNStep3Dto {
  @ApiProperty({
    description: "Driver photo URL",
    example: "https://s3.../photo.jpg",
    required: false,
  })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  driverPhoto?: string;

  @ApiProperty({
    description: "Driver licence image URL",
    example: "https://s3.../licence.jpg",
    required: false,
  })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  driverLicenceImage?: string;

  @ApiProperty({
    description: "Unloading photos (minimum 3)",
    example: ["url1", "url2", "url3"],
  })
  @IsArray()
  @IsString({ each: true })
  unloadingPhotos: string[];

  @ApiProperty({
    description: "Unloading notes",
    example: "Material unloaded successfully",
    required: false,
  })
  @IsString()
  @IsOptional()
  unloadingNotes?: string;

  @ApiProperty({
    description: "Dynamic field values",
    type: [FieldValueDto],
    required: false,
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FieldValueDto)
  @IsOptional()
  fieldValues?: FieldValueDto[];
}

// Step 4 - Final Weighing
export class UpdateGRNStep4Dto {
  @ApiProperty({ description: "Tare weight in KG", example: 2000.0 })
  @IsNumber()
  tareWeight: number;

  @ApiProperty({
    description: "Tare weight image URL",
    example: "https://s3.../image.jpg",
    required: false,
  })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  tareWeightImage?: string;

  @ApiProperty({ description: "Material count", example: 100, required: false })
  @IsNumber()
  @IsOptional()
  materialCount?: number;

  @ApiProperty({
    description: "Dynamic field values",
    type: [FieldValueDto],
    required: false,
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FieldValueDto)
  @IsOptional()
  fieldValues?: FieldValueDto[];
}

// Step 5 - Supervisor Review
export class UpdateGRNStep5Dto {
  @ApiProperty({
    description: "Verification status",
    enum: VerificationStatus,
    example: "verified",
  })
  @IsEnum(VerificationStatus)
  verificationStatus: VerificationStatus;

  @ApiProperty({
    description: "Approval status",
    enum: ApprovalStatus,
    example: "approved",
  })
  @IsEnum(ApprovalStatus)
  approvalStatus: ApprovalStatus;

  @ApiProperty({
    description: "Review notes",
    example: "All documents verified",
    required: false,
  })
  @IsString()
  @IsOptional()
  reviewNotes?: string;

  @ApiProperty({
    description: "Rejection reason (required if rejected)",
    example: "Weight mismatch",
    required: false,
  })
  @IsString()
  @IsOptional()
  rejectionReason?: string;

  @ApiProperty({
    description: "Dynamic field values",
    type: [FieldValueDto],
    required: false,
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FieldValueDto)
  @IsOptional()
  fieldValues?: FieldValueDto[];
}
