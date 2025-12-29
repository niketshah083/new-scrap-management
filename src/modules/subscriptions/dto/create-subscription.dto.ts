import { ApiProperty } from "@nestjs/swagger";
import {
  IsNumber,
  IsNotEmpty,
  IsDateString,
  IsOptional,
  IsEnum,
} from "class-validator";

export enum SubscriptionStatus {
  ACTIVE = "active",
  EXPIRED = "expired",
  CANCELLED = "cancelled",
}

export class CreateSubscriptionDto {
  @ApiProperty({ description: "Tenant ID", example: 1 })
  @IsNumber()
  @IsNotEmpty()
  tenantId: number;

  @ApiProperty({ description: "Plan ID", example: 1 })
  @IsNumber()
  @IsNotEmpty()
  planId: number;

  @ApiProperty({
    description: "Subscription start date",
    example: "2024-01-01",
  })
  @IsDateString()
  @IsNotEmpty()
  startDate: string;

  @ApiProperty({ description: "Subscription end date", example: "2024-12-31" })
  @IsDateString()
  @IsNotEmpty()
  endDate: string;

  @ApiProperty({
    description: "Subscription status",
    enum: SubscriptionStatus,
    example: "active",
    required: false,
  })
  @IsEnum(SubscriptionStatus)
  @IsOptional()
  status?: SubscriptionStatus;
}
