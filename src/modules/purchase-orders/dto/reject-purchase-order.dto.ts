import { IsNotEmpty, IsString } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class RejectPurchaseOrderDto {
  @ApiProperty({
    description: "Reason for rejecting the purchase order",
    example: "Budget exceeded for this quarter",
  })
  @IsNotEmpty({ message: "Rejection reason is required" })
  @IsString()
  rejectionReason: string;
}
