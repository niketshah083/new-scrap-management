import { IsNumber, IsString, IsOptional, IsEnum } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export enum AssignmentType {
  GRN = "grn",
  DO_PROCESSING = "do_processing",
}

export class AssignRFIDCardDto {
  @ApiProperty({ description: "Card number to assign" })
  @IsString()
  cardNumber: string;

  @ApiProperty({ description: "GRN ID to assign the card to", required: false })
  @IsNumber()
  @IsOptional()
  grnId?: number;

  @ApiProperty({
    description: "DO Processing ID to assign the card to",
    required: false,
  })
  @IsNumber()
  @IsOptional()
  doProcessingId?: number;

  @ApiProperty({
    description: "Type of assignment",
    enum: AssignmentType,
    required: false,
  })
  @IsEnum(AssignmentType)
  @IsOptional()
  assignmentType?: AssignmentType;
}
