import { ApiProperty } from "@nestjs/swagger";
import {
  IsString,
  IsNotEmpty,
  IsEmail,
  MinLength,
  MaxLength,
  IsNumber,
  IsOptional,
  IsBoolean,
} from "class-validator";

export class CreateSuperAdminDto {
  @ApiProperty({ description: "User name", example: "John Doe" })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @ApiProperty({ description: "Email address", example: "admin@example.com" })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ description: "Password", example: "SecurePass123!" })
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  password: string;
}

export class CreateTenantUserDto {
  @ApiProperty({ description: "User name", example: "Jane Smith" })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @ApiProperty({ description: "Email address", example: "user@tenant.com" })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ description: "Password", example: "SecurePass123!" })
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  password: string;

  @ApiProperty({ description: "Role ID", example: 1 })
  @IsNumber()
  @IsNotEmpty()
  roleId: number;
}

export class UpdateUserDto {
  @ApiProperty({
    description: "User name",
    example: "John Doe",
    required: false,
  })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  name?: string;

  @ApiProperty({
    description: "Email address",
    example: "admin@example.com",
    required: false,
  })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiProperty({ description: "Is active", example: true, required: false })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class UpdateUserRoleDto {
  @ApiProperty({ description: "Role ID", example: 1 })
  @IsNumber()
  @IsNotEmpty()
  roleId: number;
}

export class ChangePasswordDto {
  @ApiProperty({ description: "Current password", example: "OldPass123!" })
  @IsString()
  @IsNotEmpty()
  currentPassword: string;

  @ApiProperty({ description: "New password", example: "NewPass123!" })
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  newPassword: string;
}

export class ResetPasswordDto {
  @ApiProperty({ description: "New password", example: "NewPass123!" })
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  newPassword: string;
}
