import { Controller, Post } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse } from "@nestjs/swagger";
import { SeederService } from "./seeder.service";
import { Public } from "../../common/decorators/public.decorator";

@ApiTags("Seeder")
@Controller("seeder")
export class SeederController {
  constructor(private readonly seederService: SeederService) {}

  @Post("seed")
  @Public()
  @ApiOperation({
    summary:
      "Seed initial data (super admin, modules, operations, permissions, default roles)",
  })
  @ApiResponse({ status: 200, description: "Seeding completed successfully" })
  async seed() {
    const result = await this.seederService.seedAll();
    return {
      success: true,
      message: result.message,
      data: result.details,
    };
  }
}
