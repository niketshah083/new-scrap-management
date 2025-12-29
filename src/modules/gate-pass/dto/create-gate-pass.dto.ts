import { ApiProperty } from "@nestjs/swagger";
import { IsNumber, IsNotEmpty, IsOptional, IsString } from "class-validator";

export class CreateGatePassDto {
  @ApiProperty({ description: "GRN ID", example: 1 })
  @IsNumber()
  @IsNotEmpty()
  grnId: number;

  @ApiProperty({
    description: "Expiry time in minutes (default: 60)",
    example: 60,
    required: false,
  })
  @IsNumber()
  @IsOptional()
  expiryMinutes?: number;

  @ApiProperty({
    description: "Notes",
    example: "Gate pass for approved GRN",
    required: false,
  })
  @IsString()
  @IsOptional()
  notes?: string;
}
