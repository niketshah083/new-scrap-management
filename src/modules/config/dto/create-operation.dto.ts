import { ApiProperty } from "@nestjs/swagger";
import { IsString, IsNotEmpty, MaxLength } from "class-validator";

export class CreateOperationDto {
  @ApiProperty({ description: "Operation name", example: "Create" })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  name: string;

  @ApiProperty({ description: "Operation code", example: "CREATE" })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  code: string;
}
