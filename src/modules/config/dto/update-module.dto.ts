import { ApiProperty } from "@nestjs/swagger";
import { IsString, MaxLength, IsOptional, IsBoolean } from "class-validator";

export class UpdateModuleDto {
  @ApiProperty({ description: "Module name", required: false })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  name?: string;

  @ApiProperty({ description: "Module code", required: false })
  @IsString()
  @IsOptional()
  @MaxLength(50)
  code?: string;

  @ApiProperty({ description: "Module description", required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: "Is module active", required: false })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
