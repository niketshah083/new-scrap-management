import { IsNumber, IsString } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class AssignRFIDCardDto {
  @ApiProperty({ description: "Card number to assign" })
  @IsString()
  cardNumber: string;

  @ApiProperty({ description: "GRN ID to assign the card to" })
  @IsNumber()
  grnId: number;
}
