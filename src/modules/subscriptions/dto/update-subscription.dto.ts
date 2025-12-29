import { ApiProperty } from "@nestjs/swagger";
import { IsNumber, IsOptional, IsDateString, IsEnum } from "class-validator";
import { SubscriptionStatus } from "./create-subscription.dto";

export class UpdateSubscriptionDto {
  @ApiProperty({ description: "Plan ID", example: 1, required: false })
  @IsNumber()
  @IsOptional()
  planId?: number;

  @ApiProperty({
    description: "Subscription start date",
    example: "2024-01-01",
    required: false,
  })
  @IsDateString()
  @IsOptional()
  startDate?: string;

  @ApiProperty({
    description: "Subscription end date",
    example: "2024-12-31",
    required: false,
  })
  @IsDateString()
  @IsOptional()
  endDate?: string;

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
