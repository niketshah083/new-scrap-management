import { ApiProperty } from "@nestjs/swagger";
import { IsString, IsOptional, MaxLength, IsNumber } from "class-validator";
import { Transform } from "class-transformer";

export class GateEntryDto {
  @ApiProperty({ description: "Vehicle number", example: "GJ01AB1234" })
  @IsString()
  @MaxLength(50)
  vehicleNo: string;

  @ApiProperty({ description: "Driver name" })
  @IsString()
  @MaxLength(100)
  driverName: string;

  @ApiProperty({ description: "Driver phone" })
  @IsString()
  @IsOptional()
  @MaxLength(20)
  driverPhone?: string;

  @ApiProperty({ description: "Driver license number" })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  driverLicense?: string;

  @ApiProperty({
    description: "Transporter ID (can be number or string for external DB)",
  })
  @IsOptional()
  @Transform(({ value }) =>
    value !== undefined && value !== null && value !== "" ? value : undefined
  )
  transporterId?: number | string;

  @ApiProperty({ description: "Remarks" })
  @IsString()
  @IsOptional()
  remarks?: string;
}
