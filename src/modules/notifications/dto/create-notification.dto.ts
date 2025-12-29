import { ApiProperty } from "@nestjs/swagger";
import {
  IsString,
  IsNotEmpty,
  MaxLength,
  IsNumber,
  IsOptional,
  IsObject,
  IsEnum,
} from "class-validator";

export enum NotificationType {
  GRN_STATUS = "grn_status",
  GATE_PASS_EXPIRY = "gate_pass_expiry",
  QC_RESULT = "qc_result",
  SUBSCRIPTION_EXPIRY = "subscription_expiry",
  SYSTEM = "system",
}

export enum NotificationPriority {
  LOW = "low",
  INFO = "info",
  WARNING = "warning",
  HIGH = "high",
  CRITICAL = "critical",
}

export class CreateNotificationDto {
  @ApiProperty({
    description: "User ID (optional, for user-specific notifications)",
    example: 1,
    required: false,
  })
  @IsNumber()
  @IsOptional()
  userId?: number;

  @ApiProperty({
    description: "Notification type",
    enum: NotificationType,
    example: "grn_status",
  })
  @IsEnum(NotificationType)
  @IsNotEmpty()
  type: NotificationType;

  @ApiProperty({ description: "Notification title", example: "GRN Approved" })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  title: string;

  @ApiProperty({
    description: "Notification message",
    example: "GRN #GRN-20241224-00001 has been approved",
  })
  @IsString()
  @IsNotEmpty()
  message: string;

  @ApiProperty({
    description: "Additional metadata",
    example: { entityType: "grn", entityId: 1 },
    required: false,
  })
  @IsObject()
  @IsOptional()
  metadata?: {
    entityType?: string;
    entityId?: number;
    actionUrl?: string;
    [key: string]: any;
  };

  @ApiProperty({
    description: "Priority level",
    enum: NotificationPriority,
    example: "info",
    required: false,
  })
  @IsEnum(NotificationPriority)
  @IsOptional()
  priority?: NotificationPriority;
}
