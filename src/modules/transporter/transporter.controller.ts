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
import { TransporterService } from "./transporter.service";
import { CreateTransporterDto, UpdateTransporterDto } from "./dto";
import { RolePermission } from "../../common/decorators/role-permission.decorator";
import { RequestWithUser } from "../../common/middleware/verify-token.middleware";
import { ModuleCode } from "../../common/enums/modules.enum";
import { OperationCode } from "../../common/enums/operations.enum";

@ApiTags("Transporter")
@ApiBearerAuth("JWT-auth")
@Controller("transporters")
export class TransporterController {
  constructor(private readonly transporterService: TransporterService) {}

  @Post()
  @RolePermission(`${ModuleCode.Transporter}:${OperationCode.Create}`)
  @ApiOperation({ summary: "Create a new transporter" })
  @ApiResponse({ status: 201, description: "Transporter created successfully" })
  @ApiResponse({ status: 400, description: "Bad request" })
  @ApiResponse({
    status: 409,
    description: "Transporter with this GSTIN already exists",
  })
  async create(
    @Body() createDto: CreateTransporterDto,
    @Req() req: RequestWithUser
  ) {
    const data = await this.transporterService.create(
      req.user.tenantId,
      createDto,
      req.user.userId
    );
    return {
      success: true,
      message: "Transporter created successfully",
      data,
    };
  }

  @Get()
  @RolePermission(`${ModuleCode.Transporter}:${OperationCode.List}`)
  @ApiOperation({ summary: "Get all transporters" })
  @ApiResponse({
    status: 200,
    description: "Transporters retrieved successfully",
  })
  async findAll(@Req() req: RequestWithUser) {
    const data = await this.transporterService.findAll(req.user.tenantId);
    return {
      success: true,
      message: "Transporters retrieved successfully",
      data,
    };
  }

  @Get("active")
  @RolePermission(`${ModuleCode.Transporter}:${OperationCode.List}`)
  @ApiOperation({ summary: "Get all active transporters" })
  @ApiResponse({
    status: 200,
    description: "Active transporters retrieved successfully",
  })
  async findActive(@Req() req: RequestWithUser) {
    const data = await this.transporterService.findActive(req.user.tenantId);
    return {
      success: true,
      message: "Active transporters retrieved successfully",
      data,
    };
  }

  @Get(":id")
  @RolePermission(`${ModuleCode.Transporter}:${OperationCode.Read}`)
  @ApiOperation({ summary: "Get a transporter by ID" })
  @ApiResponse({
    status: 200,
    description: "Transporter retrieved successfully",
  })
  @ApiResponse({ status: 404, description: "Transporter not found" })
  async findOne(
    @Param("id", ParseIntPipe) id: number,
    @Req() req: RequestWithUser
  ) {
    const data = await this.transporterService.findOne(req.user.tenantId, id);
    return {
      success: true,
      message: "Transporter retrieved successfully",
      data,
    };
  }

  @Put(":id")
  @RolePermission(`${ModuleCode.Transporter}:${OperationCode.Update}`)
  @ApiOperation({ summary: "Update a transporter" })
  @ApiResponse({ status: 200, description: "Transporter updated successfully" })
  @ApiResponse({ status: 404, description: "Transporter not found" })
  @ApiResponse({
    status: 409,
    description: "Transporter with this GSTIN already exists",
  })
  async update(
    @Param("id", ParseIntPipe) id: number,
    @Body() updateDto: UpdateTransporterDto,
    @Req() req: RequestWithUser
  ) {
    const data = await this.transporterService.update(
      req.user.tenantId,
      id,
      updateDto,
      req.user.userId
    );
    return {
      success: true,
      message: "Transporter updated successfully",
      data,
    };
  }

  @Delete(":id")
  @RolePermission(`${ModuleCode.Transporter}:${OperationCode.Delete}`)
  @ApiOperation({ summary: "Delete a transporter" })
  @ApiResponse({ status: 200, description: "Transporter deleted successfully" })
  @ApiResponse({ status: 404, description: "Transporter not found" })
  async remove(
    @Param("id", ParseIntPipe) id: number,
    @Req() req: RequestWithUser
  ) {
    await this.transporterService.remove(
      req.user.tenantId,
      id,
      req.user.userId
    );
    return {
      success: true,
      message: "Transporter deleted successfully",
      data: null,
    };
  }

  @Patch(":id/toggle-status")
  @RolePermission(`${ModuleCode.Transporter}:${OperationCode.Update}`)
  @ApiOperation({ summary: "Toggle transporter active status" })
  @ApiResponse({
    status: 200,
    description: "Transporter status updated successfully",
  })
  @ApiResponse({ status: 404, description: "Transporter not found" })
  async toggleStatus(
    @Param("id", ParseIntPipe) id: number,
    @Req() req: RequestWithUser
  ) {
    const data = await this.transporterService.toggleStatus(
      req.user.tenantId,
      id,
      req.user.userId
    );
    const statusMessage = data.isActive ? "activated" : "deactivated";
    return {
      success: true,
      message: `Transporter ${statusMessage} successfully`,
      data,
    };
  }
}
