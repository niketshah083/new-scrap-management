import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
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
import { RolesService } from "./roles.service";
import { CreateRoleDto, UpdateRoleDto, AssignPermissionsDto } from "./dto";
import { RolePermission } from "../../common/decorators/role-permission.decorator";
import { RequestWithUser } from "../../common/middleware/verify-token.middleware";
import { ModuleCode } from "../../common/enums/modules.enum";
import { OperationCode } from "../../common/enums/operations.enum";

@ApiTags("Roles")
@ApiBearerAuth("JWT-auth")
@Controller("roles")
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Post()
  @RolePermission(`${ModuleCode.Role}:${OperationCode.Create}`)
  @ApiOperation({ summary: "Create a new role" })
  @ApiResponse({ status: 201, description: "Role created successfully" })
  @ApiResponse({ status: 400, description: "Bad request" })
  async create(@Body() createDto: CreateRoleDto, @Req() req: RequestWithUser) {
    try {
      const data = await this.rolesService.create(
        req.user.tenantId,
        createDto,
        req.user.userId
      );
      return {
        success: true,
        message: "Role created successfully",
        data,
      };
    } catch (error) {
      throw error;
    }
  }

  @Get()
  @RolePermission(`${ModuleCode.Role}:${OperationCode.List}`)
  @ApiOperation({ summary: "Get all roles" })
  @ApiResponse({ status: 200, description: "Roles retrieved successfully" })
  async findAll(@Req() req: RequestWithUser) {
    try {
      const data = await this.rolesService.findAll(req.user.tenantId);
      return {
        success: true,
        message: "Roles retrieved successfully",
        data,
      };
    } catch (error) {
      throw error;
    }
  }

  @Get("available-permissions")
  @RolePermission(`${ModuleCode.Role}:${OperationCode.Read}`)
  @ApiOperation({ summary: "Get available permissions based on tenant plan" })
  @ApiResponse({
    status: 200,
    description: "Permissions retrieved successfully",
  })
  async getAvailablePermissions(@Req() req: RequestWithUser) {
    try {
      const data = await this.rolesService.getAvailablePermissions(
        req.user.tenantId
      );
      return {
        success: true,
        message: "Available permissions retrieved successfully",
        data,
      };
    } catch (error) {
      throw error;
    }
  }

  @Get(":id")
  @RolePermission(`${ModuleCode.Role}:${OperationCode.Read}`)
  @ApiOperation({ summary: "Get a role by ID" })
  @ApiResponse({ status: 200, description: "Role retrieved successfully" })
  @ApiResponse({ status: 404, description: "Role not found" })
  async findOne(
    @Param("id", ParseIntPipe) id: number,
    @Req() req: RequestWithUser
  ) {
    try {
      const data = await this.rolesService.findOne(req.user.tenantId, id);
      return {
        success: true,
        message: "Role retrieved successfully",
        data,
      };
    } catch (error) {
      throw error;
    }
  }

  @Put(":id")
  @RolePermission(`${ModuleCode.Role}:${OperationCode.Update}`)
  @ApiOperation({ summary: "Update a role" })
  @ApiResponse({ status: 200, description: "Role updated successfully" })
  @ApiResponse({ status: 404, description: "Role not found" })
  async update(
    @Param("id", ParseIntPipe) id: number,
    @Body() updateDto: UpdateRoleDto,
    @Req() req: RequestWithUser
  ) {
    try {
      const data = await this.rolesService.update(
        req.user.tenantId,
        id,
        updateDto,
        req.user.userId
      );
      return {
        success: true,
        message: "Role updated successfully",
        data,
      };
    } catch (error) {
      throw error;
    }
  }

  @Put(":id/permissions")
  @RolePermission(`${ModuleCode.Role}:${OperationCode.Update}`)
  @ApiOperation({ summary: "Assign permissions to a role" })
  @ApiResponse({
    status: 200,
    description: "Permissions assigned successfully",
  })
  @ApiResponse({
    status: 400,
    description: "Some permissions not available in plan",
  })
  @ApiResponse({ status: 404, description: "Role not found" })
  async assignPermissions(
    @Param("id", ParseIntPipe) id: number,
    @Body() assignDto: AssignPermissionsDto,
    @Req() req: RequestWithUser
  ) {
    try {
      const data = await this.rolesService.assignPermissions(
        req.user.tenantId,
        id,
        assignDto,
        req.user.userId
      );
      return {
        success: true,
        message: "Permissions assigned successfully",
        data,
      };
    } catch (error) {
      throw error;
    }
  }

  @Delete(":id")
  @RolePermission(`${ModuleCode.Role}:${OperationCode.Delete}`)
  @ApiOperation({ summary: "Delete a role" })
  @ApiResponse({ status: 200, description: "Role deleted successfully" })
  @ApiResponse({ status: 404, description: "Role not found" })
  async remove(
    @Param("id", ParseIntPipe) id: number,
    @Req() req: RequestWithUser
  ) {
    try {
      await this.rolesService.remove(req.user.tenantId, id, req.user.userId);
      return {
        success: true,
        message: "Role deleted successfully",
        data: null,
      };
    } catch (error) {
      throw error;
    }
  }
}
