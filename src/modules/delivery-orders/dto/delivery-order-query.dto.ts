import {
  IsOptional,
  IsString,
  IsNumber,
  Min,
  IsDateString,
} from "class-validator";
import { Type } from "class-transformer";
import { ApiPropertyOptional } from "@nestjs/swagger";

export class DeliveryOrderQueryDto {
  @ApiPropertyOptional({ description: "Page number (1-based)", default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: "Number of items per page", default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit?: number = 10;

  @ApiPropertyOptional({
    description: "Search term for DO number, vendor name, or vehicle number",
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: "Filter by vendor ID" })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  vendorId?: number;

  @ApiPropertyOptional({
    description:
      "Filter by processing status (not_started, in_progress, completed, cancelled)",
  })
  @IsOptional()
  @IsString()
  processingStatus?: string;

  @ApiPropertyOptional({ description: "Filter by start date (YYYY-MM-DD)" })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: "Filter by end date (YYYY-MM-DD)" })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ description: "Sort field", default: "doDate" })
  @IsOptional()
  @IsString()
  sortField?: string = "doDate";

  @ApiPropertyOptional({
    description: "Sort order (asc or desc)",
    default: "desc",
  })
  @IsOptional()
  @IsString()
  sortOrder?: "asc" | "desc" = "desc";
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
