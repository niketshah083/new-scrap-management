import { ApiProperty } from "@nestjs/swagger";
import { IsString, MaxLength, IsOptional } from "class-validator";

export class UpdateOperationDto {
  @ApiProperty({ description: "Operation name", required: false })
  @IsString()
  @IsOptional()
  @MaxLength(50)
  name?: string;

  @ApiProperty({ description: "Operation code", required: false })
  @IsString()
  @IsOptional()
  @MaxLength(50)
  code?: string;
}
