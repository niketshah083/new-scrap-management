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
import { CameraService } from "./camera.service";
import {
  CreateCameraMasterDto,
  UpdateCameraMasterDto,
  CreateCameraConfigDto,
  UpdateCameraConfigDto,
} from "./dto";
import { RolePermission } from "../../common/decorators/role-permission.decorator";
import { RequestWithUser } from "../../common/middleware/verify-token.middleware";
import { ModuleCode } from "../../common/enums/modules.enum";
import { OperationCode } from "../../common/enums/operations.enum";

@ApiTags("Camera")
@ApiBearerAuth("JWT-auth")
@Controller("camera")
export class CameraController {
  constructor(private readonly cameraService: CameraService) {}

  // CameraMaster endpoints

  @Post("masters")
  @RolePermission(`${ModuleCode.Camera}:${OperationCode.Create}`)
  @ApiOperation({ summary: "Create a new camera master" })
  @ApiResponse({
    status: 201,
    description: "Camera master created successfully",
  })
  @ApiResponse({ status: 400, description: "Bad request" })
  @ApiResponse({
    status: 409,
    description: "Camera with this code already exists",
  })
  async createMaster(
    @Body() createDto: CreateCameraMasterDto,
    @Req() req: RequestWithUser
  ) {
    const data = await this.cameraService.createMaster(
      req.user.tenantId,
      createDto,
      req.user.userId
    );
    return {
      success: true,
      message: "Camera master created successfully",
      data,
    };
  }

  @Get("masters")
  @RolePermission(`${ModuleCode.Camera}:${OperationCode.List}`)
  @ApiOperation({ summary: "Get all camera masters" })
  @ApiResponse({
    status: 200,
    description: "Camera masters retrieved successfully",
  })
  async findAllMasters(@Req() req: RequestWithUser) {
    const data = await this.cameraService.findAllMasters(req.user.tenantId);
    return {
      success: true,
      message: "Camera masters retrieved successfully",
      data,
    };
  }

  @Get("masters/active")
  @RolePermission(`${ModuleCode.Camera}:${OperationCode.List}`)
  @ApiOperation({ summary: "Get all active camera masters" })
  @ApiResponse({
    status: 200,
    description: "Active camera masters retrieved successfully",
  })
  async findActiveMasters(@Req() req: RequestWithUser) {
    const data = await this.cameraService.findActiveMasters(req.user.tenantId);
    return {
      success: true,
      message: "Active camera masters retrieved successfully",
      data,
    };
  }

  @Get("masters/:id")
  @RolePermission(`${ModuleCode.Camera}:${OperationCode.Read}`)
  @ApiOperation({ summary: "Get a camera master by ID" })
  @ApiResponse({
    status: 200,
    description: "Camera master retrieved successfully",
  })
  @ApiResponse({ status: 404, description: "Camera master not found" })
  async findOneMaster(
    @Param("id", ParseIntPipe) id: number,
    @Req() req: RequestWithUser
  ) {
    const data = await this.cameraService.findOneMaster(req.user.tenantId, id);
    return {
      success: true,
      message: "Camera master retrieved successfully",
      data,
    };
  }

  @Put("masters/:id")
  @RolePermission(`${ModuleCode.Camera}:${OperationCode.Update}`)
  @ApiOperation({ summary: "Update a camera master" })
  @ApiResponse({
    status: 200,
    description: "Camera master updated successfully",
  })
  @ApiResponse({ status: 404, description: "Camera master not found" })
  @ApiResponse({
    status: 409,
    description: "Camera with this code already exists",
  })
  async updateMaster(
    @Param("id", ParseIntPipe) id: number,
    @Body() updateDto: UpdateCameraMasterDto,
    @Req() req: RequestWithUser
  ) {
    const data = await this.cameraService.updateMaster(
      req.user.tenantId,
      id,
      updateDto,
      req.user.userId
    );
    return {
      success: true,
      message: "Camera master updated successfully",
      data,
    };
  }

  @Delete("masters/:id")
  @RolePermission(`${ModuleCode.Camera}:${OperationCode.Delete}`)
  @ApiOperation({ summary: "Delete a camera master" })
  @ApiResponse({
    status: 200,
    description: "Camera master deleted successfully",
  })
  @ApiResponse({ status: 404, description: "Camera master not found" })
  async removeMaster(
    @Param("id", ParseIntPipe) id: number,
    @Req() req: RequestWithUser
  ) {
    await this.cameraService.removeMaster(
      req.user.tenantId,
      id,
      req.user.userId
    );
    return {
      success: true,
      message: "Camera master deleted successfully",
      data: null,
    };
  }

  @Patch("masters/:id/toggle-status")
  @RolePermission(`${ModuleCode.Camera}:${OperationCode.Update}`)
  @ApiOperation({ summary: "Toggle camera master active status" })
  @ApiResponse({
    status: 200,
    description: "Camera master status updated successfully",
  })
  @ApiResponse({ status: 404, description: "Camera master not found" })
  async toggleMasterStatus(
    @Param("id", ParseIntPipe) id: number,
    @Req() req: RequestWithUser
  ) {
    const data = await this.cameraService.toggleMasterStatus(
      req.user.tenantId,
      id,
      req.user.userId
    );
    const statusMessage = data.isActive ? "activated" : "deactivated";
    return {
      success: true,
      message: `Camera master ${statusMessage} successfully`,
      data,
    };
  }

  // CameraConfig endpoints

  @Post("configs")
  @RolePermission(`${ModuleCode.Camera}:${OperationCode.Create}`)
  @ApiOperation({ summary: "Create a new camera config" })
  @ApiResponse({
    status: 201,
    description: "Camera config created successfully",
  })
  @ApiResponse({ status: 400, description: "Bad request" })
  async createConfig(
    @Body() createDto: CreateCameraConfigDto,
    @Req() req: RequestWithUser
  ) {
    const data = await this.cameraService.createConfig(
      req.user.tenantId,
      createDto,
      req.user.userId
    );
    return {
      success: true,
      message: "Camera config created successfully",
      data,
    };
  }

  @Get("configs")
  @RolePermission(`${ModuleCode.Camera}:${OperationCode.List}`)
  @ApiOperation({ summary: "Get all camera configs" })
  @ApiResponse({
    status: 200,
    description: "Camera configs retrieved successfully",
  })
  async findAllConfigs(@Req() req: RequestWithUser) {
    const data = await this.cameraService.findAllConfigs(req.user.tenantId);
    return {
      success: true,
      message: "Camera configs retrieved successfully",
      data,
    };
  }

  @Get("configs/:id")
  @RolePermission(`${ModuleCode.Camera}:${OperationCode.Read}`)
  @ApiOperation({ summary: "Get a camera config by ID" })
  @ApiResponse({
    status: 200,
    description: "Camera config retrieved successfully",
  })
  @ApiResponse({ status: 404, description: "Camera config not found" })
  async findOneConfig(
    @Param("id", ParseIntPipe) id: number,
    @Req() req: RequestWithUser
  ) {
    const data = await this.cameraService.findOneConfig(req.user.tenantId, id);
    return {
      success: true,
      message: "Camera config retrieved successfully",
      data,
    };
  }

  @Get("configs/master/:masterId")
  @RolePermission(`${ModuleCode.Camera}:${OperationCode.Read}`)
  @ApiOperation({ summary: "Get camera config by master ID" })
  @ApiResponse({
    status: 200,
    description: "Camera config retrieved successfully",
  })
  async findConfigByMasterId(
    @Param("masterId", ParseIntPipe) masterId: number,
    @Req() req: RequestWithUser
  ) {
    const data = await this.cameraService.findConfigByMasterId(
      req.user.tenantId,
      masterId
    );
    return {
      success: true,
      message: "Camera config retrieved successfully",
      data,
    };
  }

  @Put("configs/:id")
  @RolePermission(`${ModuleCode.Camera}:${OperationCode.Update}`)
  @ApiOperation({ summary: "Update a camera config" })
  @ApiResponse({
    status: 200,
    description: "Camera config updated successfully",
  })
  @ApiResponse({ status: 404, description: "Camera config not found" })
  async updateConfig(
    @Param("id", ParseIntPipe) id: number,
    @Body() updateDto: UpdateCameraConfigDto,
    @Req() req: RequestWithUser
  ) {
    const data = await this.cameraService.updateConfig(
      req.user.tenantId,
      id,
      updateDto,
      req.user.userId
    );
    return {
      success: true,
      message: "Camera config updated successfully",
      data,
    };
  }

  @Delete("configs/:id")
  @RolePermission(`${ModuleCode.Camera}:${OperationCode.Delete}`)
  @ApiOperation({ summary: "Delete a camera config" })
  @ApiResponse({
    status: 200,
    description: "Camera config deleted successfully",
  })
  @ApiResponse({ status: 404, description: "Camera config not found" })
  async removeConfig(
    @Param("id", ParseIntPipe) id: number,
    @Req() req: RequestWithUser
  ) {
    await this.cameraService.removeConfig(
      req.user.tenantId,
      id,
      req.user.userId
    );
    return {
      success: true,
      message: "Camera config deleted successfully",
      data: null,
    };
  }

  @Patch("configs/:id/toggle-status")
  @RolePermission(`${ModuleCode.Camera}:${OperationCode.Update}`)
  @ApiOperation({ summary: "Toggle camera config active status" })
  @ApiResponse({
    status: 200,
    description: "Camera config status updated successfully",
  })
  @ApiResponse({ status: 404, description: "Camera config not found" })
  async toggleConfigStatus(
    @Param("id", ParseIntPipe) id: number,
    @Req() req: RequestWithUser
  ) {
    const data = await this.cameraService.toggleConfigStatus(
      req.user.tenantId,
      id,
      req.user.userId
    );
    const statusMessage = data.isActive ? "activated" : "deactivated";
    return {
      success: true,
      message: `Camera config ${statusMessage} successfully`,
      data,
    };
  }
}
