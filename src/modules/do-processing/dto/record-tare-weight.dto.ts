import { ApiProperty } from "@nestjs/swagger";
import { IsNumber, IsOptional, IsString, MaxLength } from "class-validator";

export class RecordTareWeightDto {
  @ApiProperty({ description: "Tare weight in kg", example: 5000 })
  @IsNumber()
  tareWeight: number;

  @ApiProperty({ description: "Weighbridge ID used", example: 1 })
  @IsNumber()
  @IsOptional()
  weighbridgeId?: number;

  @ApiProperty({ description: "Vehicle number (can update)" })
  @IsString()
  @IsOptional()
  @MaxLength(50)
  vehicleNo?: string;

  @ApiProperty({ description: "Driver name" })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  driverName?: string;

  @ApiProperty({ description: "Driver phone" })
  @IsString()
  @IsOptional()
  @MaxLength(20)
  driverPhone?: string;
}
