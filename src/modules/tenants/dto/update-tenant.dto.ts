import { ApiProperty } from "@nestjs/swagger";
import {
  IsString,
  IsEmail,
  IsOptional,
  MaxLength,
  IsBoolean,
} from "class-validator";

export class UpdateTenantDto {
  @ApiProperty({
    description: "Company name",
    example: "Acme Scrap Yard",
    required: false,
  })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  companyName?: string;

  @ApiProperty({
    description: "Company email",
    example: "contact@acmescrap.com",
    required: false,
  })
  @IsEmail()
  @IsOptional()
  @MaxLength(255)
  email?: string;

  @ApiProperty({
    description: "Contact phone number",
    example: "+1234567890",
    required: false,
  })
  @IsString()
  @IsOptional()
  @MaxLength(20)
  phone?: string;

  @ApiProperty({
    description: "Company address",
    example: "123 Industrial Ave, City",
    required: false,
  })
  @IsString()
  @IsOptional()
  address?: string;

  @ApiProperty({ description: "Active status", example: true, required: false })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
