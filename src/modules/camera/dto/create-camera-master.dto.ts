import { ApiProperty } from "@nestjs/swagger";
import {
  IsString,
  IsNotEmpty,
  MaxLength,
  IsOptional,
  IsBoolean,
  IsEnum,
} from "class-validator";
import { CameraType } from "../../../entities/camera-master.entity";

export class CreateCameraMasterDto {
  @ApiProperty({ description: "Camera name", example: "Entry Camera" })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @ApiProperty({ description: "Camera code", example: "CAM-001" })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  code: string;

  @ApiProperty({
    description: "Camera location",
    example: "Gate 1",
    required: false,
  })
  @IsString()
  @IsOptional()
  @MaxLength(200)
  location?: string;

  @ApiProperty({
    description: "Camera description",
    example: "Entry gate camera",
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: "Camera type",
    enum: CameraType,
    example: CameraType.RTSP,
    required: false,
  })
  @IsEnum(CameraType)
  @IsOptional()
  cameraType?: CameraType;

  @ApiProperty({ description: "Active status", example: true, required: false })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
