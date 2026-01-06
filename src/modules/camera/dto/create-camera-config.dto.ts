import { ApiProperty } from "@nestjs/swagger";
import {
  IsString,
  IsNotEmpty,
  MaxLength,
  IsOptional,
  IsBoolean,
  IsNumber,
  IsEnum,
  Min,
  Max,
} from "class-validator";
import { CameraTransport } from "../../../entities/camera-config.entity";

export class CreateCameraConfigDto {
  @ApiProperty({ description: "Camera Master ID", example: 1 })
  @IsNumber()
  @IsNotEmpty()
  cameraMasterId: number;

  @ApiProperty({
    description: "RTSP URL",
    example: "rtsp://192.168.1.100:554/stream",
    required: false,
  })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  rtspUrl?: string;

  @ApiProperty({
    description: "Stream URL for live preview",
    example: "http://192.168.1.100:8080/stream",
    required: false,
  })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  streamUrl?: string;

  @ApiProperty({
    description: "Camera username",
    example: "admin",
    required: false,
  })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  username?: string;

  @ApiProperty({
    description: "Camera password",
    example: "password123",
    required: false,
  })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  password?: string;

  @ApiProperty({
    description: "Snapshot width",
    example: 1280,
    required: false,
  })
  @IsNumber()
  @IsOptional()
  @Min(320)
  @Max(4096)
  snapshotWidth?: number;

  @ApiProperty({
    description: "Snapshot height",
    example: 720,
    required: false,
  })
  @IsNumber()
  @IsOptional()
  @Min(240)
  @Max(2160)
  snapshotHeight?: number;

  @ApiProperty({
    description: "Snapshot quality (1-100)",
    example: 80,
    required: false,
  })
  @IsNumber()
  @IsOptional()
  @Min(1)
  @Max(100)
  snapshotQuality?: number;

  @ApiProperty({
    description: "Transport protocol",
    enum: CameraTransport,
    example: CameraTransport.TCP,
    required: false,
  })
  @IsEnum(CameraTransport)
  @IsOptional()
  transport?: CameraTransport;

  @ApiProperty({
    description: "Connection timeout in ms",
    example: 10000,
    required: false,
  })
  @IsNumber()
  @IsOptional()
  timeout?: number;

  @ApiProperty({ description: "Active status", example: true, required: false })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
