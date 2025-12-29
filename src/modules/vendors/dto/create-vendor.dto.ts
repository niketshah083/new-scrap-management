import { ApiProperty } from "@nestjs/swagger";
import { IsString, IsEmail, IsNotEmpty, MaxLength } from "class-validator";

export class CreateVendorDto {
  @ApiProperty({ description: "Company name", example: "ABC Metals Ltd" })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  companyName: string;

  @ApiProperty({ description: "Contact person name", example: "John Doe" })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  contactPerson: string;

  @ApiProperty({ description: "Contact phone number", example: "+1234567890" })
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  phone: string;

  @ApiProperty({ description: "Contact email", example: "john@abcmetals.com" })
  @IsEmail()
  @IsNotEmpty()
  @MaxLength(255)
  email: string;

  @ApiProperty({
    description: "Company address",
    example: "456 Industrial Park, City",
  })
  @IsString()
  @IsNotEmpty()
  address: string;
}
