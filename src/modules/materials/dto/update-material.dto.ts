import { ApiProperty } from "@nestjs/swagger";
import { IsString, IsOptional, MaxLength, IsBoolean } from "class-validator";

export class UpdateMaterialDto {
  @ApiProperty({
    description: "Material name",
    example: "Copper Wire",
    required: false,
  })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  name?: string;

  @ApiProperty({
    description: "Material code",
    example: "CU-WIRE-001",
    required: false,
  })
  @IsString()
  @IsOptional()
  @MaxLength(50)
  code?: string;

  @ApiProperty({
    description: "Unit of measure",
    example: "KG",
    required: false,
  })
  @IsString()
  @IsOptional()
  @MaxLength(50)
  unitOfMeasure?: string;

  @ApiProperty({
    description: "Material category",
    example: "Non-Ferrous Metals",
    required: false,
  })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  category?: string;

  @ApiProperty({ description: "Active status", example: true, required: false })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
