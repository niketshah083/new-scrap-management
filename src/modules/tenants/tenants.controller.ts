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
import { TenantsService } from "./tenants.service";
import {
  CreateTenantDto,
  UpdateTenantDto,
  UpdateExternalDbConfigDto,
} from "./dto";
import { RolePermission } from "../../common/decorators/role-permission.decorator";
import { RequestWithUser } from "../../common/middleware/verify-token.middleware";
import { ModuleCode, OperationCode } from "../../common/enums";

@ApiTags("Tenants")
@ApiBearerAuth("JWT-auth")
@Controller("tenants")
export class TenantsController {
  constructor(private readonly tenantsService: TenantsService) {}

  @Post()
  @RolePermission(`${ModuleCode.TENANT}:${OperationCode.CREATE}`)
  @ApiOperation({ summary: "Create a new tenant" })
  @ApiResponse({ status: 201, description: "Tenant created successfully" })
  @ApiResponse({ status: 400, description: "Bad request" })
  @ApiResponse({
    status: 409,
    description: "Tenant with this email already exists",
  })
  async create(
    @Body() createTenantDto: CreateTenantDto,
    @Req() req: RequestWithUser
  ) {
    try {
      const data = await this.tenantsService.create(
        createTenantDto,
        req.user.userId
      );
      return {
        success: true,
        message: "Tenant created successfully",
        data,
      };
    } catch (error) {
      throw error;
    }
  }

  @Get()
  @RolePermission(
    `${ModuleCode.TENANT}:${OperationCode.LIST}`,
    `${ModuleCode.TENANT}:${OperationCode.READ}`
  )
  @ApiOperation({ summary: "Get all tenants" })
  @ApiResponse({ status: 200, description: "Tenants retrieved successfully" })
  async findAll() {
    try {
      const data = await this.tenantsService.findAll();
      return {
        success: true,
        message: "Tenants retrieved successfully",
        data,
      };
    } catch (error) {
      throw error;
    }
  }

  @Get(":id")
  @RolePermission(`${ModuleCode.TENANT}:${OperationCode.READ}`)
  @ApiOperation({ summary: "Get a tenant by ID" })
  @ApiResponse({ status: 200, description: "Tenant retrieved successfully" })
  @ApiResponse({ status: 404, description: "Tenant not found" })
  async findOne(@Param("id", ParseIntPipe) id: number) {
    try {
      const data = await this.tenantsService.findOne(id);
      return {
        success: true,
        message: "Tenant retrieved successfully",
        data,
      };
    } catch (error) {
      throw error;
    }
  }

  @Put(":id")
  @RolePermission(
    `${ModuleCode.TENANT}:${OperationCode.UPDATE}`,
    `${ModuleCode.TENANT}:${OperationCode.EDIT}`
  )
  @ApiOperation({ summary: "Update a tenant" })
  @ApiResponse({ status: 200, description: "Tenant updated successfully" })
  @ApiResponse({ status: 404, description: "Tenant not found" })
  @ApiResponse({
    status: 409,
    description: "Tenant with this email already exists",
  })
  async update(
    @Param("id", ParseIntPipe) id: number,
    @Body() updateTenantDto: UpdateTenantDto,
    @Req() req: RequestWithUser
  ) {
    try {
      const data = await this.tenantsService.update(
        id,
        updateTenantDto,
        req.user.userId
      );
      return {
        success: true,
        message: "Tenant updated successfully",
        data,
      };
    } catch (error) {
      throw error;
    }
  }

  @Delete(":id")
  @RolePermission(`${ModuleCode.TENANT}:${OperationCode.DELETE}`)
  @ApiOperation({ summary: "Delete a tenant" })
  @ApiResponse({ status: 200, description: "Tenant deleted successfully" })
  @ApiResponse({ status: 404, description: "Tenant not found" })
  async remove(
    @Param("id", ParseIntPipe) id: number,
    @Req() req: RequestWithUser
  ) {
    try {
      await this.tenantsService.remove(id, req.user.userId);
      return {
        success: true,
        message: "Tenant deleted successfully",
        data: null,
      };
    } catch (error) {
      throw error;
    }
  }

  @Patch(":id/toggle-status")
  @RolePermission(
    `${ModuleCode.TENANT}:${OperationCode.UPDATE}`,
    `${ModuleCode.TENANT}:${OperationCode.EDIT}`
  )
  @ApiOperation({ summary: "Toggle tenant active status" })
  @ApiResponse({
    status: 200,
    description: "Tenant status updated successfully",
  })
  @ApiResponse({ status: 404, description: "Tenant not found" })
  async toggleStatus(
    @Param("id", ParseIntPipe) id: number,
    @Req() req: RequestWithUser
  ) {
    try {
      const data = await this.tenantsService.toggleStatus(id, req.user.userId);
      const statusMessage = data.isActive ? "activated" : "deactivated";
      return {
        success: true,
        message: `Tenant ${statusMessage} successfully`,
        data,
      };
    } catch (error) {
      throw error;
    }
  }

  // External Database Configuration Endpoints

  @Get(":id/external-db-config")
  @RolePermission(
    `${ModuleCode.EXTERNAL_DB_CONFIG}:${OperationCode.READ}`,
    `${ModuleCode.TENANT}:${OperationCode.UPDATE}`
  )
  @ApiOperation({ summary: "Get external database configuration for a tenant" })
  @ApiResponse({
    status: 200,
    description: "External DB config retrieved successfully",
  })
  @ApiResponse({ status: 404, description: "Tenant not found" })
  async getExternalDbConfig(@Param("id", ParseIntPipe) id: number) {
    try {
      const data = await this.tenantsService.getExternalDbConfig(id);
      return {
        success: true,
        message: "External database configuration retrieved successfully",
        data,
      };
    } catch (error) {
      throw error;
    }
  }

  @Put(":id/external-db-config")
  @RolePermission(
    `${ModuleCode.EXTERNAL_DB_CONFIG}:${OperationCode.UPDATE}`,
    `${ModuleCode.TENANT}:${OperationCode.UPDATE}`
  )
  @ApiOperation({
    summary: "Update external database configuration for a tenant",
  })
  @ApiResponse({
    status: 200,
    description: "External DB config updated successfully",
  })
  @ApiResponse({ status: 404, description: "Tenant not found" })
  @ApiResponse({ status: 400, description: "Invalid configuration" })
  async updateExternalDbConfig(
    @Param("id", ParseIntPipe) id: number,
    @Body() updateDto: UpdateExternalDbConfigDto,
    @Req() req: RequestWithUser
  ) {
    try {
      const data = await this.tenantsService.updateExternalDbConfig(
        id,
        updateDto,
        req.user.userId
      );
      return {
        success: true,
        message: "External database configuration updated successfully",
        data,
      };
    } catch (error) {
      throw error;
    }
  }

  @Post(":id/external-db-config/test")
  @RolePermission(
    `${ModuleCode.EXTERNAL_DB_CONFIG}:${OperationCode.READ}`,
    `${ModuleCode.TENANT}:${OperationCode.UPDATE}`
  )
  @ApiOperation({ summary: "Test external database connection for a tenant" })
  @ApiResponse({
    status: 200,
    description: "Connection test result",
  })
  @ApiResponse({ status: 404, description: "Tenant not found" })
  @ApiResponse({ status: 400, description: "Connection test failed" })
  async testExternalDbConnection(@Param("id", ParseIntPipe) id: number) {
    try {
      const result = await this.tenantsService.testExternalDbConnection(id);
      return {
        success: result.success,
        message: result.message,
        data: { connected: result.success },
      };
    } catch (error) {
      throw error;
    }
  }
}
