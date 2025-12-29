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
import { GRNFieldConfigService } from "./grn-field-config.service";
import { CreateGRNFieldConfigDto, UpdateGRNFieldConfigDto } from "./dto";
import { RolePermission } from "../../common/decorators/role-permission.decorator";
import { RequestWithUser } from "../../common/middleware/verify-token.middleware";
import { ModuleCode, OperationCode } from "../../common/enums";

@ApiTags("GRN Field Configuration")
@ApiBearerAuth("JWT-auth")
@Controller("grn-field-config")
export class GRNFieldConfigController {
  constructor(private readonly fieldConfigService: GRNFieldConfigService) {}

  @Post("initialize-defaults")
  @RolePermission(`${ModuleCode.GRN_FIELD_CONFIG}:${OperationCode.CREATE}`)
  @ApiOperation({
    summary: "Initialize default GRN field configurations for tenant",
  })
  @ApiResponse({
    status: 201,
    description: "Default field configurations created successfully",
  })
  @ApiResponse({ status: 400, description: "Default fields already exist" })
  async initializeDefaults(@Req() req: RequestWithUser) {
    try {
      // Check if tenant already has field configs
      const existingFields = await this.fieldConfigService.findAll(
        req.user.tenantId
      );
      if (existingFields.length > 0) {
        return {
          success: false,
          message: "Field configurations already exist for this tenant",
          data: existingFields,
        };
      }

      const data = await this.fieldConfigService.createDefaultFieldsForTenant(
        req.user.tenantId,
        req.user.userId
      );
      return {
        success: true,
        message: "Default field configurations created successfully",
        data,
      };
    } catch (error) {
      throw error;
    }
  }

  @Post()
  @RolePermission(`${ModuleCode.GRN_FIELD_CONFIG}:${OperationCode.CREATE}`)
  @ApiOperation({ summary: "Create a new GRN field configuration" })
  @ApiResponse({
    status: 201,
    description: "Field configuration created successfully",
  })
  @ApiResponse({ status: 400, description: "Bad request" })
  @ApiResponse({
    status: 409,
    description: "Field with this name already exists",
  })
  async create(
    @Body() createDto: CreateGRNFieldConfigDto,
    @Req() req: RequestWithUser
  ) {
    try {
      const data = await this.fieldConfigService.create(
        req.user.tenantId,
        createDto,
        req.user.userId
      );
      return {
        success: true,
        message: "Field configuration created successfully",
        data,
      };
    } catch (error) {
      throw error;
    }
  }

  @Get()
  @RolePermission(
    `${ModuleCode.GRN_FIELD_CONFIG}:${OperationCode.LIST}`,
    `${ModuleCode.GRN_FIELD_CONFIG}:${OperationCode.READ}`
  )
  @ApiOperation({ summary: "Get all GRN field configurations" })
  @ApiResponse({
    status: 200,
    description: "Field configurations retrieved successfully",
  })
  async findAll(@Req() req: RequestWithUser) {
    try {
      const data = await this.fieldConfigService.findAll(req.user.tenantId);
      return {
        success: true,
        message: "Field configurations retrieved successfully",
        data,
      };
    } catch (error) {
      throw error;
    }
  }

  @Get("step/:stepNumber")
  @RolePermission(
    `${ModuleCode.GRN_FIELD_CONFIG}:${OperationCode.LIST}`,
    `${ModuleCode.GRN_FIELD_CONFIG}:${OperationCode.READ}`
  )
  @ApiOperation({ summary: "Get GRN field configurations by step number" })
  @ApiResponse({
    status: 200,
    description: "Field configurations retrieved successfully",
  })
  async findByStep(
    @Param("stepNumber", ParseIntPipe) stepNumber: number,
    @Req() req: RequestWithUser
  ) {
    try {
      const data = await this.fieldConfigService.findByStep(
        req.user.tenantId,
        stepNumber
      );
      return {
        success: true,
        message: "Field configurations retrieved successfully",
        data,
      };
    } catch (error) {
      throw error;
    }
  }

  @Get(":id")
  @RolePermission(`${ModuleCode.GRN_FIELD_CONFIG}:${OperationCode.READ}`)
  @ApiOperation({ summary: "Get a GRN field configuration by ID" })
  @ApiResponse({
    status: 200,
    description: "Field configuration retrieved successfully",
  })
  @ApiResponse({ status: 404, description: "Field configuration not found" })
  async findOne(
    @Param("id", ParseIntPipe) id: number,
    @Req() req: RequestWithUser
  ) {
    try {
      const data = await this.fieldConfigService.findOne(req.user.tenantId, id);
      return {
        success: true,
        message: "Field configuration retrieved successfully",
        data,
      };
    } catch (error) {
      throw error;
    }
  }

  @Put(":id")
  @RolePermission(`${ModuleCode.GRN_FIELD_CONFIG}:${OperationCode.UPDATE}`)
  @ApiOperation({ summary: "Update a GRN field configuration" })
  @ApiResponse({
    status: 200,
    description: "Field configuration updated successfully",
  })
  @ApiResponse({ status: 404, description: "Field configuration not found" })
  @ApiResponse({
    status: 409,
    description: "Field with this name already exists",
  })
  async update(
    @Param("id", ParseIntPipe) id: number,
    @Body() updateDto: UpdateGRNFieldConfigDto,
    @Req() req: RequestWithUser
  ) {
    try {
      const data = await this.fieldConfigService.update(
        req.user.tenantId,
        id,
        updateDto,
        req.user.userId
      );
      return {
        success: true,
        message: "Field configuration updated successfully",
        data,
      };
    } catch (error) {
      throw error;
    }
  }

  @Delete(":id")
  @RolePermission(`${ModuleCode.GRN_FIELD_CONFIG}:${OperationCode.DELETE}`)
  @ApiOperation({ summary: "Delete a GRN field configuration" })
  @ApiResponse({
    status: 200,
    description: "Field configuration deleted successfully",
  })
  @ApiResponse({ status: 404, description: "Field configuration not found" })
  async remove(
    @Param("id", ParseIntPipe) id: number,
    @Req() req: RequestWithUser
  ) {
    try {
      await this.fieldConfigService.remove(
        req.user.tenantId,
        id,
        req.user.userId
      );
      return {
        success: true,
        message: "Field configuration deleted successfully",
        data: null,
      };
    } catch (error) {
      throw error;
    }
  }

  @Patch(":id/toggle-status")
  @RolePermission(`${ModuleCode.GRN_FIELD_CONFIG}:${OperationCode.UPDATE}`)
  @ApiOperation({ summary: "Toggle field configuration active status" })
  @ApiResponse({
    status: 200,
    description: "Field configuration status updated successfully",
  })
  @ApiResponse({ status: 404, description: "Field configuration not found" })
  async toggleStatus(
    @Param("id", ParseIntPipe) id: number,
    @Req() req: RequestWithUser
  ) {
    try {
      const data = await this.fieldConfigService.toggleStatus(
        req.user.tenantId,
        id,
        req.user.userId
      );
      const statusMessage = data.isActive ? "activated" : "deactivated";
      return {
        success: true,
        message: `Field configuration ${statusMessage} successfully`,
        data,
      };
    } catch (error) {
      throw error;
    }
  }

  @Post("step/:stepNumber/reorder")
  @RolePermission(`${ModuleCode.GRN_FIELD_CONFIG}:${OperationCode.UPDATE}`)
  @ApiOperation({ summary: "Reorder fields for a step" })
  @ApiResponse({ status: 200, description: "Fields reordered successfully" })
  async reorderFields(
    @Param("stepNumber", ParseIntPipe) stepNumber: number,
    @Body() fieldOrders: { id: number; displayOrder: number }[],
    @Req() req: RequestWithUser
  ) {
    try {
      const data = await this.fieldConfigService.reorderFields(
        req.user.tenantId,
        stepNumber,
        fieldOrders,
        req.user.userId
      );
      return {
        success: true,
        message: "Fields reordered successfully",
        data,
      };
    } catch (error) {
      throw error;
    }
  }
}
