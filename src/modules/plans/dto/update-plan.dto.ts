import { ApiProperty } from "@nestjs/swagger";
import {
  IsString,
  IsOptional,
  MaxLength,
  IsNumber,
  IsArray,
  IsEnum,
  IsBoolean,
} from "class-validator";
import { BillingCycle } from "./create-plan.dto";

export class UpdatePlanDto {
  @ApiProperty({
    description: "Plan name",
    example: "Basic Plan",
    required: false,
  })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  name?: string;

  @ApiProperty({
    description: "Plan description",
    example: "Basic features for small businesses",
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: "Plan price", example: 99.99, required: false })
  @IsNumber()
  @IsOptional()
  price?: number;

  @ApiProperty({
    description: "Billing cycle",
    enum: BillingCycle,
    example: "monthly",
    required: false,
  })
  @IsEnum(BillingCycle)
  @IsOptional()
  billingCycle?: BillingCycle;

  @ApiProperty({ description: "Active status", example: true, required: false })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

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
