import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Patch,
  Body,
  Param,
  ParseIntPipe,
  Req,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from "@nestjs/swagger";
import { ConfigService } from "./config.service";
import {
  CreateModuleDto,
  UpdateModuleDto,
  CreateOperationDto,
  UpdateOperationDto,
  CreateDefaultRoleDto,
  UpdateDefaultRoleDto,
} from "./dto";
import { SuperAdminOnly } from "../../common/decorators/super-admin.decorator";
import { RequestWithUser } from "../../common/middleware/verify-token.middleware";

@ApiTags("Config")
@ApiBearerAuth("JWT-auth")
@Controller()
export class ConfigController {
  constructor(private readonly configService: ConfigService) {}

  // ==================== MODULES ====================
  @Get("modules")
  @SuperAdminOnly()
  @ApiOperation({ summary: "Get all modules" })
  @ApiResponse({ status: 200, description: "Modules retrieved successfully" })
  async findAllModules() {
    const data = await this.configService.findAllModules();
    return {
      success: true,
      message: "Modules retrieved successfully",
      data,
    };
  }

  @Get("modules/:id")
  @SuperAdminOnly()
  @ApiOperation({ summary: "Get a module by ID" })
  @ApiResponse({ status: 200, description: "Module retrieved successfully" })
  async findOneModule(@Param("id", ParseIntPipe) id: number) {
    const data = await this.configService.findOneModule(id);
    return {
      success: true,
      message: "Module retrieved successfully",
      data,
    };
  }

  @Post("modules")
  @SuperAdminOnly()
  @ApiOperation({ summary: "Create a new module" })
  @ApiResponse({ status: 201, description: "Module created successfully" })
  async createModule(
    @Body() dto: CreateModuleDto,
    @Req() req: RequestWithUser
  ) {
    const data = await this.configService.createModule(dto, req.user.userId);
    return {
      success: true,
      message: "Module created successfully",
      data,
    };
  }

  @Put("modules/:id")
  @SuperAdminOnly()
  @ApiOperation({ summary: "Update a module" })
  @ApiResponse({ status: 200, description: "Module updated successfully" })
  async updateModule(
    @Param("id", ParseIntPipe) id: number,
    @Body() dto: UpdateModuleDto,
    @Req() req: RequestWithUser
  ) {
    const data = await this.configService.updateModule(
      id,
      dto,
      req.user.userId
    );
    return {
      success: true,
      message: "Module updated successfully",
      data,
    };
  }

  @Delete("modules/:id")
  @SuperAdminOnly()
  @ApiOperation({ summary: "Delete a module" })
  @ApiResponse({ status: 200, description: "Module deleted successfully" })
  async deleteModule(
    @Param("id", ParseIntPipe) id: number,
    @Req() req: RequestWithUser
  ) {
    await this.configService.deleteModule(id, req.user.userId);
    return {
      success: true,
      message: "Module deleted successfully",
      data: null,
    };
  }

  @Patch("modules/:id/toggle-status")
  @SuperAdminOnly()
  @ApiOperation({ summary: "Toggle module status" })
  @ApiResponse({
    status: 200,
    description: "Module status toggled successfully",
  })
  async toggleModuleStatus(
    @Param("id", ParseIntPipe) id: number,
    @Req() req: RequestWithUser
  ) {
    const data = await this.configService.toggleModuleStatus(
      id,
      req.user.userId
    );
    return {
      success: true,
      message: `Module ${data.isActive ? "activated" : "deactivated"} successfully`,
      data,
    };
  }

  // ==================== OPERATIONS ====================
  @Get("operations")
  @SuperAdminOnly()
  @ApiOperation({ summary: "Get all operations" })
  @ApiResponse({
    status: 200,
    description: "Operations retrieved successfully",
  })
  async findAllOperations() {
    const data = await this.configService.findAllOperations();
    return {
      success: true,
      message: "Operations retrieved successfully",
      data,
    };
  }

  @Get("operations/:id")
  @SuperAdminOnly()
  @ApiOperation({ summary: "Get an operation by ID" })
  @ApiResponse({ status: 200, description: "Operation retrieved successfully" })
  async findOneOperation(@Param("id", ParseIntPipe) id: number) {
    const data = await this.configService.findOneOperation(id);
    return {
      success: true,
      message: "Operation retrieved successfully",
      data,
    };
  }

  @Post("operations")
  @SuperAdminOnly()
  @ApiOperation({ summary: "Create a new operation" })
  @ApiResponse({ status: 201, description: "Operation created successfully" })
  async createOperation(
    @Body() dto: CreateOperationDto,
    @Req() req: RequestWithUser
  ) {
    const data = await this.configService.createOperation(dto, req.user.userId);
    return {
      success: true,
      message: "Operation created successfully",
      data,
    };
  }

  @Put("operations/:id")
  @SuperAdminOnly()
  @ApiOperation({ summary: "Update an operation" })
  @ApiResponse({ status: 200, description: "Operation updated successfully" })
  async updateOperation(
    @Param("id", ParseIntPipe) id: number,
    @Body() dto: UpdateOperationDto,
    @Req() req: RequestWithUser
  ) {
    const data = await this.configService.updateOperation(
      id,
      dto,
      req.user.userId
    );
    return {
      success: true,
      message: "Operation updated successfully",
      data,
    };
  }

  @Delete("operations/:id")
  @SuperAdminOnly()
  @ApiOperation({ summary: "Delete an operation" })
  @ApiResponse({ status: 200, description: "Operation deleted successfully" })
  async deleteOperation(
    @Param("id", ParseIntPipe) id: number,
    @Req() req: RequestWithUser
  ) {
    await this.configService.deleteOperation(id, req.user.userId);
    return {
      success: true,
      message: "Operation deleted successfully",
      data: null,
    };
  }

  // ==================== PERMISSIONS ====================
  @Get("permissions")
  @SuperAdminOnly()
  @ApiOperation({ summary: "Get all permissions" })
  @ApiResponse({
    status: 200,
    description: "Permissions retrieved successfully",
  })
  async findAllPermissions() {
    const data = await this.configService.findAllPermissions();
    return {
      success: true,
      message: "Permissions retrieved successfully",
      data,
    };
  }

  // ==================== DEFAULT ROLES ====================
  @Get("default-roles")
  @SuperAdminOnly()
  @ApiOperation({ summary: "Get all default roles" })
  @ApiResponse({
    status: 200,
    description: "Default roles retrieved successfully",
  })
  async findAllDefaultRoles() {
    const data = await this.configService.findAllDefaultRoles();
    return {
      success: true,
      message: "Default roles retrieved successfully",
      data,
    };
  }

  @Get("default-roles/:id")
  @SuperAdminOnly()
  @ApiOperation({ summary: "Get a default role by ID" })
  @ApiResponse({
    status: 200,
    description: "Default role retrieved successfully",
  })
  async findOneDefaultRole(@Param("id", ParseIntPipe) id: number) {
    const data = await this.configService.findOneDefaultRole(id);
    return {
      success: true,
      message: "Default role retrieved successfully",
      data,
    };
  }

  @Post("default-roles")
  @SuperAdminOnly()
  @ApiOperation({ summary: "Create a new default role" })
  @ApiResponse({
    status: 201,
    description: "Default role created successfully",
  })
  async createDefaultRole(
    @Body() dto: CreateDefaultRoleDto,
    @Req() req: RequestWithUser
  ) {
    const data = await this.configService.createDefaultRole(
      dto,
      req.user.userId
    );
    return {
      success: true,
      message: "Default role created successfully",
      data,
    };
  }

  @Put("default-roles/:id")
  @SuperAdminOnly()
  @ApiOperation({ summary: "Update a default role" })
  @ApiResponse({
    status: 200,
    description: "Default role updated successfully",
  })
  async updateDefaultRole(
    @Param("id", ParseIntPipe) id: number,
    @Body() dto: UpdateDefaultRoleDto,
    @Req() req: RequestWithUser
  ) {
    const data = await this.configService.updateDefaultRole(
      id,
      dto,
      req.user.userId
    );
    return {
      success: true,
      message: "Default role updated successfully",
      data,
    };
  }

  @Delete("default-roles/:id")
  @SuperAdminOnly()
  @ApiOperation({ summary: "Delete a default role" })
  @ApiResponse({
    status: 200,
    description: "Default role deleted successfully",
  })
  async deleteDefaultRole(
    @Param("id", ParseIntPipe) id: number,
    @Req() req: RequestWithUser
  ) {
    await this.configService.deleteDefaultRole(id, req.user.userId);
    return {
      success: true,
      message: "Default role deleted successfully",
      data: null,
    };
  }

  @Patch("default-roles/:id/toggle-status")
  @SuperAdminOnly()
  @ApiOperation({ summary: "Toggle default role status" })
  @ApiResponse({
    status: 200,
    description: "Default role status toggled successfully",
  })
  async toggleDefaultRoleStatus(
    @Param("id", ParseIntPipe) id: number,
    @Req() req: RequestWithUser
  ) {
    const data = await this.configService.toggleDefaultRoleStatus(
      id,
      req.user.userId
    );
    return {
      success: true,
      message: `Default role ${data.isActive ? "activated" : "deactivated"} successfully`,
      data,
    };
  }
}
