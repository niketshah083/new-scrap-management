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
import { WeighbridgeService } from "./weighbridge.service";
import {
  CreateWeighbridgeMasterDto,
  UpdateWeighbridgeMasterDto,
  CreateWeighbridgeConfigDto,
  UpdateWeighbridgeConfigDto,
} from "./dto";
import { RolePermission } from "../../common/decorators/role-permission.decorator";
import { RequestWithUser } from "../../common/middleware/verify-token.middleware";
import { ModuleCode } from "../../common/enums/modules.enum";
import { OperationCode } from "../../common/enums/operations.enum";

@ApiTags("Weighbridge")
@ApiBearerAuth("JWT-auth")
@Controller("weighbridge")
export class WeighbridgeController {
  constructor(private readonly weighbridgeService: WeighbridgeService) {}

  // WeighbridgeMaster endpoints

  @Post("masters")
  @RolePermission(`${ModuleCode.Weighbridge}:${OperationCode.Create}`)
  @ApiOperation({ summary: "Create a new weighbridge master" })
  @ApiResponse({
    status: 201,
    description: "Weighbridge master created successfully",
  })
  @ApiResponse({ status: 400, description: "Bad request" })
  @ApiResponse({
    status: 409,
    description: "Weighbridge with this code already exists",
  })
  async createMaster(
    @Body() createDto: CreateWeighbridgeMasterDto,
    @Req() req: RequestWithUser
  ) {
    const data = await this.weighbridgeService.createMaster(
      req.user.tenantId,
      createDto,
      req.user.userId
    );
    return {
      success: true,
      message: "Weighbridge master created successfully",
      data,
    };
  }

  @Get("masters")
  @RolePermission(`${ModuleCode.Weighbridge}:${OperationCode.List}`)
  @ApiOperation({ summary: "Get all weighbridge masters" })
  @ApiResponse({
    status: 200,
    description: "Weighbridge masters retrieved successfully",
  })
  async findAllMasters(@Req() req: RequestWithUser) {
    const data = await this.weighbridgeService.findAllMasters(
      req.user.tenantId
    );
    return {
      success: true,
      message: "Weighbridge masters retrieved successfully",
      data,
    };
  }

  @Get("masters/active")
  @RolePermission(`${ModuleCode.Weighbridge}:${OperationCode.List}`)
  @ApiOperation({ summary: "Get all active weighbridge masters" })
  @ApiResponse({
    status: 200,
    description: "Active weighbridge masters retrieved successfully",
  })
  async findActiveMasters(@Req() req: RequestWithUser) {
    const data = await this.weighbridgeService.findActiveMasters(
      req.user.tenantId
    );
    return {
      success: true,
      message: "Active weighbridge masters retrieved successfully",
      data,
    };
  }

  @Get("masters/:id")
  @RolePermission(`${ModuleCode.Weighbridge}:${OperationCode.Read}`)
  @ApiOperation({ summary: "Get a weighbridge master by ID" })
  @ApiResponse({
    status: 200,
    description: "Weighbridge master retrieved successfully",
  })
  @ApiResponse({ status: 404, description: "Weighbridge master not found" })
  async findOneMaster(
    @Param("id", ParseIntPipe) id: number,
    @Req() req: RequestWithUser
  ) {
    const data = await this.weighbridgeService.findOneMaster(
      req.user.tenantId,
      id
    );
    return {
      success: true,
      message: "Weighbridge master retrieved successfully",
      data,
    };
  }

  @Put("masters/:id")
  @RolePermission(`${ModuleCode.Weighbridge}:${OperationCode.Update}`)
  @ApiOperation({ summary: "Update a weighbridge master" })
  @ApiResponse({
    status: 200,
    description: "Weighbridge master updated successfully",
  })
  @ApiResponse({ status: 404, description: "Weighbridge master not found" })
  @ApiResponse({
    status: 409,
    description: "Weighbridge with this code already exists",
  })
  async updateMaster(
    @Param("id", ParseIntPipe) id: number,
    @Body() updateDto: UpdateWeighbridgeMasterDto,
    @Req() req: RequestWithUser
  ) {
    const data = await this.weighbridgeService.updateMaster(
      req.user.tenantId,
      id,
      updateDto,
      req.user.userId
    );
    return {
      success: true,
      message: "Weighbridge master updated successfully",
      data,
    };
  }

  @Delete("masters/:id")
  @RolePermission(`${ModuleCode.Weighbridge}:${OperationCode.Delete}`)
  @ApiOperation({ summary: "Delete a weighbridge master" })
  @ApiResponse({
    status: 200,
    description: "Weighbridge master deleted successfully",
  })
  @ApiResponse({ status: 404, description: "Weighbridge master not found" })
  async removeMaster(
    @Param("id", ParseIntPipe) id: number,
    @Req() req: RequestWithUser
  ) {
    await this.weighbridgeService.removeMaster(
      req.user.tenantId,
      id,
      req.user.userId
    );
    return {
      success: true,
      message: "Weighbridge master deleted successfully",
      data: null,
    };
  }

  @Patch("masters/:id/toggle-status")
  @RolePermission(`${ModuleCode.Weighbridge}:${OperationCode.Update}`)
  @ApiOperation({ summary: "Toggle weighbridge master active status" })
  @ApiResponse({
    status: 200,
    description: "Weighbridge master status updated successfully",
  })
  @ApiResponse({ status: 404, description: "Weighbridge master not found" })
  async toggleMasterStatus(
    @Param("id", ParseIntPipe) id: number,
    @Req() req: RequestWithUser
  ) {
    const data = await this.weighbridgeService.toggleMasterStatus(
      req.user.tenantId,
      id,
      req.user.userId
    );
    const statusMessage = data.isActive ? "activated" : "deactivated";
    return {
      success: true,
      message: `Weighbridge master ${statusMessage} successfully`,
      data,
    };
  }

  // WeighbridgeConfig endpoints

  @Post("configs")
  @RolePermission(`${ModuleCode.Weighbridge}:${OperationCode.Create}`)
  @ApiOperation({ summary: "Create a new weighbridge config" })
  @ApiResponse({
    status: 201,
    description: "Weighbridge config created successfully",
  })
  @ApiResponse({ status: 400, description: "Bad request" })
  async createConfig(
    @Body() createDto: CreateWeighbridgeConfigDto,
    @Req() req: RequestWithUser
  ) {
    const data = await this.weighbridgeService.createConfig(
      req.user.tenantId,
      createDto,
      req.user.userId
    );
    return {
      success: true,
      message: "Weighbridge config created successfully",
      data,
    };
  }

  @Get("configs")
  @RolePermission(`${ModuleCode.Weighbridge}:${OperationCode.List}`)
  @ApiOperation({ summary: "Get all weighbridge configs" })
  @ApiResponse({
    status: 200,
    description: "Weighbridge configs retrieved successfully",
  })
  async findAllConfigs(@Req() req: RequestWithUser) {
    const data = await this.weighbridgeService.findAllConfigs(
      req.user.tenantId
    );
    return {
      success: true,
      message: "Weighbridge configs retrieved successfully",
      data,
    };
  }

  @Get("configs/:id")
  @RolePermission(`${ModuleCode.Weighbridge}:${OperationCode.Read}`)
  @ApiOperation({ summary: "Get a weighbridge config by ID" })
  @ApiResponse({
    status: 200,
    description: "Weighbridge config retrieved successfully",
  })
  @ApiResponse({ status: 404, description: "Weighbridge config not found" })
  async findOneConfig(
    @Param("id", ParseIntPipe) id: number,
    @Req() req: RequestWithUser
  ) {
    const data = await this.weighbridgeService.findOneConfig(
      req.user.tenantId,
      id
    );
    return {
      success: true,
      message: "Weighbridge config retrieved successfully",
      data,
    };
  }

  @Get("configs/master/:masterId")
  @RolePermission(`${ModuleCode.Weighbridge}:${OperationCode.Read}`)
  @ApiOperation({ summary: "Get weighbridge config by master ID" })
  @ApiResponse({
    status: 200,
    description: "Weighbridge config retrieved successfully",
  })
  async findConfigByMasterId(
    @Param("masterId", ParseIntPipe) masterId: number,
    @Req() req: RequestWithUser
  ) {
    const data = await this.weighbridgeService.findConfigByMasterId(
      req.user.tenantId,
      masterId
    );
    return {
      success: true,
      message: "Weighbridge config retrieved successfully",
      data,
    };
  }

  @Put("configs/:id")
  @RolePermission(`${ModuleCode.Weighbridge}:${OperationCode.Update}`)
  @ApiOperation({ summary: "Update a weighbridge config" })
  @ApiResponse({
    status: 200,
    description: "Weighbridge config updated successfully",
  })
  @ApiResponse({ status: 404, description: "Weighbridge config not found" })
  async updateConfig(
    @Param("id", ParseIntPipe) id: number,
    @Body() updateDto: UpdateWeighbridgeConfigDto,
    @Req() req: RequestWithUser
  ) {
    const data = await this.weighbridgeService.updateConfig(
      req.user.tenantId,
      id,
      updateDto,
      req.user.userId
    );
    return {
      success: true,
      message: "Weighbridge config updated successfully",
      data,
    };
  }

  @Delete("configs/:id")
  @RolePermission(`${ModuleCode.Weighbridge}:${OperationCode.Delete}`)
  @ApiOperation({ summary: "Delete a weighbridge config" })
  @ApiResponse({
    status: 200,
    description: "Weighbridge config deleted successfully",
  })
  @ApiResponse({ status: 404, description: "Weighbridge config not found" })
  async removeConfig(
    @Param("id", ParseIntPipe) id: number,
    @Req() req: RequestWithUser
  ) {
    await this.weighbridgeService.removeConfig(
      req.user.tenantId,
      id,
      req.user.userId
    );
    return {
      success: true,
      message: "Weighbridge config deleted successfully",
      data: null,
    };
  }

  @Patch("configs/:id/toggle-status")
  @RolePermission(`${ModuleCode.Weighbridge}:${OperationCode.Update}`)
  @ApiOperation({ summary: "Toggle weighbridge config active status" })
  @ApiResponse({
    status: 200,
    description: "Weighbridge config status updated successfully",
  })
  @ApiResponse({ status: 404, description: "Weighbridge config not found" })
  async toggleConfigStatus(
    @Param("id", ParseIntPipe) id: number,
    @Req() req: RequestWithUser
  ) {
    const data = await this.weighbridgeService.toggleConfigStatus(
      req.user.tenantId,
      id,
      req.user.userId
    );
    const statusMessage = data.isActive ? "activated" : "deactivated";
    return {
      success: true,
      message: `Weighbridge config ${statusMessage} successfully`,
      data,
    };
  }
}
