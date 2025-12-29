import { ApiProperty } from "@nestjs/swagger";
import {
  IsString,
  IsEmail,
  IsNotEmpty,
  MaxLength,
  IsOptional,
  MinLength,
} from "class-validator";

export class CreateTenantDto {
  @ApiProperty({ description: "Company name", example: "Acme Scrap Yard" })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  companyName: string;

  @ApiProperty({
    description: "Company email",
    example: "contact@acmescrap.com",
  })
  @IsEmail()
  @IsNotEmpty()
  @MaxLength(255)
  email: string;

  @ApiProperty({ description: "Contact phone number", example: "+1234567890" })
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  phone: string;

  @ApiProperty({
    description: "Company address",
    example: "123 Industrial Ave, City",
    required: false,
  })
  @IsString()
  @IsOptional()
  address?: string;

  // Admin user details
  @ApiProperty({ description: "Admin user name", example: "John Doe" })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  adminName: string;

  @ApiProperty({
    description: "Admin user email",
    example: "admin@acmescrap.com",
  })
  @IsEmail()
  @IsNotEmpty()
  @MaxLength(255)
  adminEmail: string;

  @ApiProperty({ description: "Admin user password", example: "Admin@123" })
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  @MaxLength(100)
  adminPassword: string;
}
