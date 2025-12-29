import { ApiProperty } from "@nestjs/swagger";
import { IsString, IsNotEmpty, IsOptional, IsIn } from "class-validator";

export class FieldMappingDto {
  @ApiProperty({
    description: "Internal field name in the application model",
    example: "companyName",
  })
  @IsString()
  @IsNotEmpty()
  internalField: string;

  @ApiProperty({
    description: "External field name in the third-party database",
    example: "company_name",
  })
  @IsString()
  @IsNotEmpty()
  externalField: string;

  @ApiProperty({
    description: "Data type transformation to apply",
    example: "string",
    required: false,
    enum: ["string", "number", "date", "boolean"],
  })
  @IsOptional()
  @IsIn(["string", "number", "date", "boolean"])
  transform?: "string" | "number" | "date" | "boolean";
}
