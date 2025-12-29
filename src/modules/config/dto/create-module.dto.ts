import { ApiProperty } from "@nestjs/swagger";
import {
  IsString,
  IsNotEmpty,
  MaxLength,
  IsOptional,
  IsBoolean,
} from "class-validator";

export class CreateModuleDto {
  @ApiProperty({ description: "Module name", example: "Vendors" })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @ApiProperty({ description: "Module code", example: "VENDORS" })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  code: string;

  @ApiProperty({ description: "Module description", required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: "Is module active", default: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
