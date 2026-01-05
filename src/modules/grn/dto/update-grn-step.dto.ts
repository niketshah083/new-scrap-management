import { ApiProperty } from "@nestjs/swagger";
import {
  IsString,
  IsOptional,
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
  @ApiProperty({ description: "Field config ID", example: 1, required: false })
  @IsNumber()
  @IsOptional()
  fieldConfigId?: number;

  @ApiProperty({
    description: "Field name",
    example: "gross_weight",
    required: false,
  })
  @IsString()
  @IsOptional()
  fieldName?: string;

  @ApiProperty({ description: "Field value", example: "5000.5" })
  @IsString()
  value: string;
}

/**
 * Step 1 - Gate Entry (Update/Edit)
 * Static fields: purchaseOrderId, vendorId, truckNumber
 * Dynamic fields: any configured for step 1
 */
export class UpdateGRNStep1Dto {
  @ApiProperty({
    description: "Purchase Order ID",
    example: 1,
    required: false,
  })
  @IsNumber()
  @IsOptional()
  purchaseOrderId?: number;

  @ApiProperty({ description: "Vendor ID", example: 1, required: false })
  @IsNumber()
  @IsOptional()
  vendorId?: number;

  @ApiProperty({
    description: "Truck number",
    example: "MH-12-AB-1234",
    required: false,
  })
  @IsString()
  @IsOptional()
  truckNumber?: string;

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

/**
 * Step 2 - Initial Weighing
 * Dynamic fields: gross_weight (required), gross_weight_image (optional, max 3 files)
 */
export class UpdateGRNStep2Dto {
  @ApiProperty({
    description:
      "Dynamic field values for Step 2 (gross_weight, gross_weight_image)",
    type: [FieldValueDto],
    required: true,
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FieldValueDto)
  fieldValues: FieldValueDto[];
}

/**
 * Step 3 - Unloading
 * Dynamic fields: driver_photo, driver_licence_image (max 2), unloading_photos (max 3), unloading_notes, material_count
 */
export class UpdateGRNStep3Dto {
  @ApiProperty({
    description: "Dynamic field values for Step 3",
    type: [FieldValueDto],
    required: true,
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FieldValueDto)
  fieldValues: FieldValueDto[];
}

/**
 * Step 4 - Final Weighing
 * Dynamic fields: tare_weight, tare_weight_image (max 3), net_weight (auto-calculated)
 */
export class UpdateGRNStep4Dto {
  @ApiProperty({
    description:
      "Dynamic field values for Step 4 (tare_weight, tare_weight_image)",
    type: [FieldValueDto],
    required: true,
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FieldValueDto)
  fieldValues: FieldValueDto[];
}

/**
 * Step 5 - Supervisor Review
 * Static fields: verificationStatus, approvalStatus, rejectionReason
 * No dynamic fields as of now
 */
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
    description: "Rejection reason (required if rejected)",
    example: "Weight mismatch",
    required: false,
  })
  @IsString()
  @IsOptional()
  rejectionReason?: string;

  @ApiProperty({
    description: "Dynamic field values (optional for Step 5)",
    type: [FieldValueDto],
    required: false,
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FieldValueDto)
  @IsOptional()
  fieldValues?: FieldValueDto[];
}
