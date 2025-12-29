import { ApiProperty } from "@nestjs/swagger";
import { IsString, IsNotEmpty, IsOptional } from "class-validator";

export class VerifyGatePassDto {
  @ApiProperty({
    description: "Gate pass number",
    example: "GP-20241224-00001",
  })
  @IsString()
  @IsNotEmpty()
  passNumber: string;
}

export class MarkGatePassUsedDto {
  @ApiProperty({
    description: "Notes when marking as used",
    example: "Vehicle exited at 10:30 AM",
    required: false,
  })
  @IsString()
  @IsOptional()
  notes?: string;
}
