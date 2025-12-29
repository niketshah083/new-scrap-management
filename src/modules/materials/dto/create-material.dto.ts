import { ApiProperty } from "@nestjs/swagger";
import { IsString, IsNotEmpty, MaxLength } from "class-validator";

export class CreateMaterialDto {
  @ApiProperty({ description: "Material name", example: "Copper Wire" })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @ApiProperty({ description: "Material code", example: "CU-WIRE-001" })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  code: string;

  @ApiProperty({ description: "Unit of measure", example: "KG" })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  unitOfMeasure: string;

  @ApiProperty({
    description: "Material category",
    example: "Non-Ferrous Metals",
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  category: string;
}
