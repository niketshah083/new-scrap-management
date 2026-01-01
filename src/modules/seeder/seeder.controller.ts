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

  @Post("migrate-permissions")
  @Public()
  @ApiOperation({
    summary:
      "Migrate permissions from old UPPERCASE format to new PascalCase format",
  })
  @ApiResponse({
    status: 200,
    description: "Permission migration completed successfully",
  })
  async migratePermissions() {
    const result = await this.seederService.migratePermissions();
    return {
      success: true,
      message: result.message,
      data: result.details,
    };
  }
}
