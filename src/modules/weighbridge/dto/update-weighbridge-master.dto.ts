import { ApiProperty } from "@nestjs/swagger";
import { IsString, IsOptional, MaxLength, IsBoolean } from "class-validator";

export class UpdateWeighbridgeMasterDto {
  @ApiProperty({
    description: "Weighbridge name",
    example: "Main Weighbridge",
    required: false,
  })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  name?: string;

  @ApiProperty({
    description: "Weighbridge code",
    example: "WB-001",
    required: false,
  })
  @IsString()
  @IsOptional()
  @MaxLength(50)
  code?: string;

  @ApiProperty({
    description: "Weighbridge location",
    example: "Gate 1",
    required: false,
  })
  @IsString()
  @IsOptional()
  @MaxLength(200)
  location?: string;

  @ApiProperty({
    description: "Weighbridge description",
    example: "Main entry weighbridge",
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: "Active status", example: true, required: false })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
