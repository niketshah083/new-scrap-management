import { ApiProperty } from "@nestjs/swagger";
import { IsArray, IsNumber, ArrayNotEmpty } from "class-validator";

export class AssignModulesDto {
  @ApiProperty({
    description: "Module IDs to assign to this plan",
    example: [1, 2, 3],
  })
  @IsArray()
  @ArrayNotEmpty()
  @IsNumber({}, { each: true })
  moduleIds: number[];
}
