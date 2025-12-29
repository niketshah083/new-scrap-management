import { ApiProperty } from "@nestjs/swagger";
import {
  IsString,
  IsNotEmpty,
  MaxLength,
  IsOptional,
  IsNumber,
  IsArray,
  IsEnum,
} from "class-validator";

export enum BillingCycle {
  MONTHLY = "monthly",
  YEARLY = "yearly",
}

export class CreatePlanDto {
  @ApiProperty({ description: "Plan name", example: "Basic Plan" })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @ApiProperty({
    description: "Plan description",
    example: "Basic features for small businesses",
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: "Plan price", example: 99.99 })
  @IsNumber()
  @IsNotEmpty()
  price: number;

  @ApiProperty({
    description: "Billing cycle",
    enum: BillingCycle,
    example: "monthly",
  })
  @IsEnum(BillingCycle)
  @IsNotEmpty()
  billingCycle: BillingCycle;

  @ApiProperty({
    description: "Module IDs to assign to this plan",
    example: [1, 2, 3],
    required: false,
  })
  @IsArray()
  @IsNumber({}, { each: true })
  @IsOptional()
  moduleIds?: number[];
}
