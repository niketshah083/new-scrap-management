import { ApiProperty } from "@nestjs/swagger";
import {
  IsString,
  IsEmail,
  IsOptional,
  MaxLength,
  IsBoolean,
} from "class-validator";

export class UpdateVendorDto {
  @ApiProperty({
    description: "Company name",
    example: "ABC Metals Ltd",
    required: false,
  })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  companyName?: string;

  @ApiProperty({
    description: "Contact person name",
    example: "John Doe",
    required: false,
  })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  contactPerson?: string;

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
    description: "Contact email",
    example: "john@abcmetals.com",
    required: false,
  })
  @IsEmail()
  @IsOptional()
  @MaxLength(255)
  email?: string;

  @ApiProperty({
    description: "Company address",
    example: "456 Industrial Park, City",
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
