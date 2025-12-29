import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsNotEmpty, IsString, MinLength } from "class-validator";

export class LoginDto {
  @ApiProperty({
    description: "User email address",
    example: "user@example.com",
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    description: "User password",
    example: "password123",
    minLength: 6,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password: string;
}

export class LoginResponseDto {
  @ApiProperty({
    description: "JWT access token",
  })
  accessToken: string;

  @ApiProperty({
    description: "User information",
  })
  user: {
    id: number;
    name: string;
    email: string;
    tenantId: number | null;
    roleId: number | null;
    isSuperAdmin: boolean;
    permissions: string[];
  };
}
