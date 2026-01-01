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
import { UsersService } from "./users.service";
import {
  CreateSuperAdminDto,
  CreateTenantUserDto,
  UpdateUserDto,
  UpdateUserRoleDto,
  ChangePasswordDto,
  ResetPasswordDto,
} from "./dto";
import { RolePermission } from "../../common/decorators/role-permission.decorator";
import { RequestWithUser } from "../../common/middleware/verify-token.middleware";
import { ModuleCode, OperationCode } from "../../common/enums";

@ApiTags("Users")
@ApiBearerAuth("JWT-auth")
@Controller("users")
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // Super Admin Management Endpoints
  @Post("super-admin")
  @RolePermission(`${ModuleCode.SuperAdmin}:${OperationCode.Create}`)
  @ApiOperation({ summary: "Create a new super admin" })
  @ApiResponse({ status: 201, description: "Super admin created successfully" })
  @ApiResponse({ status: 409, description: "Email already exists" })
  async createSuperAdmin(
    @Body() createDto: CreateSuperAdminDto,
    @Req() req: RequestWithUser
  ) {
    try {
      const data = await this.usersService.createSuperAdmin(
        createDto,
        req.user.userId
      );
      return {
        success: true,
        message: "Super admin created successfully",
        data,
      };
    } catch (error) {
      throw error;
    }
  }

  @Get("super-admin")
  @RolePermission(
    `${ModuleCode.SuperAdmin}:${OperationCode.List}`,
    `${ModuleCode.SuperAdmin}:${OperationCode.Read}`
  )
  @ApiOperation({ summary: "Get all super admins" })
  @ApiResponse({
    status: 200,
    description: "Super admins retrieved successfully",
  })
  async findAllSuperAdmins() {
    try {
      const data = await this.usersService.findAllSuperAdmins();
      return {
        success: true,
        message: "Super admins retrieved successfully",
        data,
      };
    } catch (error) {
      throw error;
    }
  }

  @Get("super-admin/:id")
  @RolePermission(`${ModuleCode.SuperAdmin}:${OperationCode.Read}`)
  @ApiOperation({ summary: "Get a super admin by ID" })
  @ApiResponse({
    status: 200,
    description: "Super admin retrieved successfully",
  })
  @ApiResponse({ status: 404, description: "Super admin not found" })
  async findSuperAdminById(@Param("id", ParseIntPipe) id: number) {
    try {
      const data = await this.usersService.findSuperAdminById(id);
      return {
        success: true,
        message: "Super admin retrieved successfully",
        data,
      };
    } catch (error) {
      throw error;
    }
  }

  @Put("super-admin/:id")
  @RolePermission(`${ModuleCode.SuperAdmin}:${OperationCode.Update}`)
  @ApiOperation({ summary: "Update a super admin" })
  @ApiResponse({ status: 200, description: "Super admin updated successfully" })
  @ApiResponse({ status: 404, description: "Super admin not found" })
  @ApiResponse({ status: 409, description: "Email already exists" })
  async updateSuperAdmin(
    @Param("id", ParseIntPipe) id: number,
    @Body() updateDto: UpdateUserDto,
    @Req() req: RequestWithUser
  ) {
    try {
      const data = await this.usersService.updateSuperAdmin(
        id,
        updateDto,
        req.user.userId
      );
      return {
        success: true,
        message: "Super admin updated successfully",
        data,
      };
    } catch (error) {
      throw error;
    }
  }

  @Delete("super-admin/:id")
  @RolePermission(`${ModuleCode.SuperAdmin}:${OperationCode.Delete}`)
  @ApiOperation({ summary: "Delete a super admin" })
  @ApiResponse({ status: 200, description: "Super admin deleted successfully" })
  @ApiResponse({ status: 404, description: "Super admin not found" })
  async removeSuperAdmin(
    @Param("id", ParseIntPipe) id: number,
    @Req() req: RequestWithUser
  ) {
    try {
      await this.usersService.removeSuperAdmin(id, req.user.userId);
      return {
        success: true,
        message: "Super admin deleted successfully",
        data: null,
      };
    } catch (error) {
      throw error;
    }
  }

  @Put("super-admin/:id/reset-password")
  @RolePermission(`${ModuleCode.SuperAdmin}:${OperationCode.Update}`)
  @ApiOperation({ summary: "Reset super admin password" })
  @ApiResponse({ status: 200, description: "Password reset successfully" })
  @ApiResponse({ status: 404, description: "Super admin not found" })
  async resetSuperAdminPassword(
    @Param("id", ParseIntPipe) id: number,
    @Body() resetDto: ResetPasswordDto,
    @Req() req: RequestWithUser
  ) {
    try {
      await this.usersService.resetPassword(
        null,
        id,
        resetDto,
        req.user.userId
      );
      return {
        success: true,
        message: "Password reset successfully",
        data: null,
      };
    } catch (error) {
      throw error;
    }
  }

  // Tenant User Management Endpoints
  @Post()
  @RolePermission(`${ModuleCode.User}:${OperationCode.Create}`)
  @ApiOperation({ summary: "Create a new tenant user" })
  @ApiResponse({ status: 201, description: "User created successfully" })
  @ApiResponse({ status: 409, description: "Email already exists" })
  @ApiResponse({ status: 404, description: "Role not found" })
  async createTenantUser(
    @Body() createDto: CreateTenantUserDto,
    @Req() req: RequestWithUser
  ) {
    try {
      const data = await this.usersService.createTenantUser(
        req.user.tenantId,
        createDto,
        req.user.userId
      );
      return {
        success: true,
        message: "User created successfully",
        data,
      };
    } catch (error) {
      throw error;
    }
  }

  @Get()
  @RolePermission(
    `${ModuleCode.User}:${OperationCode.List}`,
    `${ModuleCode.User}:${OperationCode.Read}`
  )
  @ApiOperation({ summary: "Get all tenant users" })
  @ApiResponse({ status: 200, description: "Users retrieved successfully" })
  async findAllTenantUsers(@Req() req: RequestWithUser) {
    try {
      const data = await this.usersService.findAllTenantUsers(
        req.user.tenantId
      );
      return {
        success: true,
        message: "Users retrieved successfully",
        data,
      };
    } catch (error) {
      throw error;
    }
  }

  @Get(":id")
  @RolePermission(`${ModuleCode.User}:${OperationCode.Read}`)
  @ApiOperation({ summary: "Get a tenant user by ID" })
  @ApiResponse({ status: 200, description: "User retrieved successfully" })
  @ApiResponse({ status: 404, description: "User not found" })
  async findTenantUserById(
    @Param("id", ParseIntPipe) id: number,
    @Req() req: RequestWithUser
  ) {
    try {
      const data = await this.usersService.findTenantUserById(
        req.user.tenantId,
        id
      );
      return {
        success: true,
        message: "User retrieved successfully",
        data,
      };
    } catch (error) {
      throw error;
    }
  }

  @Put(":id")
  @RolePermission(`${ModuleCode.User}:${OperationCode.Update}`)
  @ApiOperation({ summary: "Update a tenant user" })
  @ApiResponse({ status: 200, description: "User updated successfully" })
  @ApiResponse({ status: 404, description: "User not found" })
  @ApiResponse({ status: 409, description: "Email already exists" })
  async updateTenantUser(
    @Param("id", ParseIntPipe) id: number,
    @Body() updateDto: UpdateUserDto,
    @Req() req: RequestWithUser
  ) {
    try {
      const data = await this.usersService.updateTenantUser(
        req.user.tenantId,
        id,
        updateDto,
        req.user.userId
      );
      return {
        success: true,
        message: "User updated successfully",
        data,
      };
    } catch (error) {
      throw error;
    }
  }

  @Put(":id/role")
  @RolePermission(`${ModuleCode.User}:${OperationCode.Update}`)
  @ApiOperation({ summary: "Update user role" })
  @ApiResponse({ status: 200, description: "User role updated successfully" })
  @ApiResponse({ status: 404, description: "User or role not found" })
  async updateUserRole(
    @Param("id", ParseIntPipe) id: number,
    @Body() updateDto: UpdateUserRoleDto,
    @Req() req: RequestWithUser
  ) {
    try {
      const data = await this.usersService.updateUserRole(
        req.user.tenantId,
        id,
        updateDto,
        req.user.userId
      );
      return {
        success: true,
        message: "User role updated successfully",
        data,
      };
    } catch (error) {
      throw error;
    }
  }

  @Delete(":id")
  @RolePermission(`${ModuleCode.User}:${OperationCode.Delete}`)
  @ApiOperation({ summary: "Delete a tenant user" })
  @ApiResponse({ status: 200, description: "User deleted successfully" })
  @ApiResponse({ status: 404, description: "User not found" })
  async removeTenantUser(
    @Param("id", ParseIntPipe) id: number,
    @Req() req: RequestWithUser
  ) {
    try {
      await this.usersService.removeTenantUser(
        req.user.tenantId,
        id,
        req.user.userId
      );
      return {
        success: true,
        message: "User deleted successfully",
        data: null,
      };
    } catch (error) {
      throw error;
    }
  }

  @Put(":id/reset-password")
  @RolePermission(`${ModuleCode.User}:${OperationCode.Update}`)
  @ApiOperation({ summary: "Reset user password" })
  @ApiResponse({ status: 200, description: "Password reset successfully" })
  @ApiResponse({ status: 404, description: "User not found" })
  async resetUserPassword(
    @Param("id", ParseIntPipe) id: number,
    @Body() resetDto: ResetPasswordDto,
    @Req() req: RequestWithUser
  ) {
    try {
      await this.usersService.resetPassword(
        req.user.tenantId,
        id,
        resetDto,
        req.user.userId
      );
      return {
        success: true,
        message: "Password reset successfully",
        data: null,
      };
    } catch (error) {
      throw error;
    }
  }

  // Self-service password change
  @Put("me/change-password")
  @ApiOperation({ summary: "Change own password" })
  @ApiResponse({ status: 200, description: "Password changed successfully" })
  @ApiResponse({ status: 400, description: "Current password is incorrect" })
  async changePassword(
    @Body() changeDto: ChangePasswordDto,
    @Req() req: RequestWithUser
  ) {
    try {
      await this.usersService.changePassword(req.user.userId, changeDto);
      return {
        success: true,
        message: "Password changed successfully",
        data: null,
      };
    } catch (error) {
      throw error;
    }
  }
}
