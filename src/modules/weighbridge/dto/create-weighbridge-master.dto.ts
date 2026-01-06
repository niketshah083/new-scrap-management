import { ApiProperty } from "@nestjs/swagger";
import {
  IsString,
  IsNotEmpty,
  MaxLength,
  IsOptional,
  IsBoolean,
} from "class-validator";

export class CreateWeighbridgeMasterDto {
  @ApiProperty({ description: "Weighbridge name", example: "Main Weighbridge" })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @ApiProperty({ description: "Weighbridge code", example: "WB-001" })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  code: string;

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
