import { ApiProperty } from "@nestjs/swagger";
import { IsNumber, IsOptional, IsString } from "class-validator";

export class InitialWeighingDto {
  @ApiProperty({
    description: "Initial tare weight from weighbridge-1 in kg",
    example: 5000,
  })
  @IsNumber()
  initialTareWeight: number;

  @ApiProperty({ description: "Weighbridge-1 ID used", example: 1 })
  @IsNumber()
  @IsOptional()
  weighbridgeId?: number;

  @ApiProperty({ description: "Driver photo file path" })
  @IsString()
  @IsOptional()
  driverPhotoPath?: string;

  @ApiProperty({ description: "License photo file path" })
  @IsString()
  @IsOptional()
  licensePhotoPath?: string;

  @ApiProperty({ description: "Truck photo file path" })
  @IsString()
  @IsOptional()
  truckPhotoPath?: string;
}
