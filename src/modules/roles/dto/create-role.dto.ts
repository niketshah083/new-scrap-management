import { ApiProperty } from "@nestjs/swagger";
import {
  IsString,
  IsNotEmpty,
  MaxLength,
  IsArray,
  IsNumber,
  IsOptional,
} from "class-validator";

export class CreateRoleDto {
  @ApiProperty({ description: "Role name", example: "Manager" })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @ApiProperty({
    description: "Role description",
    example: "Manager role with full access",
    required: false,
  })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  description?: string;

  @ApiProperty({
    description: "Permission IDs to assign",
    example: [1, 2, 3],
    required: false,
  })
  @IsArray()
  @IsNumber({}, { each: true })
  @IsOptional()
  permissionIds?: number[];
}

export class UpdateRoleDto {
  @ApiProperty({
    description: "Role name",
    example: "Manager",
    required: false,
  })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  name?: string;

  @ApiProperty({
    description: "Role description",
    example: "Manager role with full access",
    required: false,
  })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  description?: string;
}

export class AssignPermissionsDto {
  @ApiProperty({
    description: "Permission IDs to assign",
    example: [1, 2, 3],
  })
  @IsArray()
  @IsNumber({}, { each: true })
  @IsNotEmpty()
  permissionIds: number[];
}
