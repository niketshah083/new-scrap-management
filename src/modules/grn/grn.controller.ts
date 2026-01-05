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
  ApiQuery,
} from "@nestjs/swagger";
import { GRNService } from "./grn.service";
import {
  CreateGRNDto,
  UpdateGRNStep1Dto,
  UpdateGRNStep2Dto,
  UpdateGRNStep3Dto,
  UpdateGRNStep4Dto,
  UpdateGRNStep5Dto,
} from "./dto";
import { RolePermission } from "../../common/decorators/role-permission.decorator";
import { RequestWithUser } from "../../common/middleware/verify-token.middleware";
import { ModuleCode } from "../../common/enums/modules.enum";
import { OperationCode } from "../../common/enums/operations.enum";

@ApiTags("GRN")
@ApiBearerAuth("JWT-auth")
@Controller("grn")
export class GRNController {
  constructor(private readonly grnService: GRNService) {}

  // Step 1 - Gate Entry
  @Post()
  @RolePermission(`${ModuleCode.GRN}:${OperationCode.STEP1_GATE_ENTRY}`)
  @ApiOperation({ summary: "Create a new GRN (Step 1 - Gate Entry)" })
  @ApiResponse({ status: 201, description: "GRN created successfully" })
  @ApiResponse({ status: 400, description: "Bad request" })
  @ApiResponse({
    status: 404,
    description: "Vendor or Purchase Order not found",
  })
  async create(@Body() createDto: CreateGRNDto, @Req() req: RequestWithUser) {
    try {
      const data = await this.grnService.create(
        req.user.tenantId,
        createDto,
        req.user.userId
      );
      return {
        success: true,
        message: "GRN created successfully",
        data,
      };
    } catch (error) {
      throw error;
    }
  }

  @Get()
  @RolePermission(`${ModuleCode.GRN}:${OperationCode.List}`)
  @ApiOperation({ summary: "Get all GRNs" })
  @ApiResponse({ status: 200, description: "GRNs retrieved successfully" })
  async findAll(@Req() req: RequestWithUser) {
    try {
      const data = await this.grnService.findAll(req.user.tenantId);
      return {
        success: true,
        message: "GRNs retrieved successfully",
        data,
      };
    } catch (error) {
      throw error;
    }
  }

  @Get("stats/today")
  @RolePermission(`${ModuleCode.GRN}:${OperationCode.Read}`)
  @ApiOperation({ summary: "Get today's GRN statistics" })
  @ApiResponse({
    status: 200,
    description: "Statistics retrieved successfully",
  })
  async getTodayStats(@Req() req: RequestWithUser) {
    try {
      const data = await this.grnService.getTodayStats(req.user.tenantId);
      return {
        success: true,
        message: "Statistics retrieved successfully",
        data,
      };
    } catch (error) {
      throw error;
    }
  }

  @Get("status/:status")
  @RolePermission(`${ModuleCode.GRN}:${OperationCode.List}`)
  @ApiOperation({ summary: "Get GRNs by status" })
  @ApiQuery({ name: "status", enum: ["in_progress", "completed", "rejected"] })
  @ApiResponse({ status: 200, description: "GRNs retrieved successfully" })
  async findByStatus(
    @Param("status") status: string,
    @Req() req: RequestWithUser
  ) {
    try {
      const data = await this.grnService.findByStatus(
        req.user.tenantId,
        status
      );
      return {
        success: true,
        message: "GRNs retrieved successfully",
        data,
      };
    } catch (error) {
      throw error;
    }
  }

  @Get("step/:step")
  @RolePermission(`${ModuleCode.GRN}:${OperationCode.List}`)
  @ApiOperation({ summary: "Get GRNs by current step" })
  @ApiResponse({ status: 200, description: "GRNs retrieved successfully" })
  async findByStep(
    @Param("step", ParseIntPipe) step: number,
    @Req() req: RequestWithUser
  ) {
    try {
      const data = await this.grnService.findByStep(req.user.tenantId, step);
      return {
        success: true,
        message: "GRNs retrieved successfully",
        data,
      };
    } catch (error) {
      throw error;
    }
  }

  @Get("pending-approval")
  @RolePermission(`${ModuleCode.GRN}:${OperationCode.STEP5_SUPERVISOR_REVIEW}`)
  @ApiOperation({ summary: "Get GRNs pending approval" })
  @ApiResponse({ status: 200, description: "GRNs retrieved successfully" })
  async findPendingApproval(@Req() req: RequestWithUser) {
    try {
      const data = await this.grnService.findPendingApproval(req.user.tenantId);
      return {
        success: true,
        message: "Pending approval GRNs retrieved successfully",
        data,
      };
    } catch (error) {
      throw error;
    }
  }

  @Get("approved")
  @RolePermission(`${ModuleCode.GRN}:${OperationCode.STEP7_GATE_PASS}`)
  @ApiOperation({ summary: "Get approved GRNs (for gate pass)" })
  @ApiResponse({ status: 200, description: "GRNs retrieved successfully" })
  async findApproved(@Req() req: RequestWithUser) {
    try {
      const data = await this.grnService.findApproved(req.user.tenantId);
      return {
        success: true,
        message: "Approved GRNs retrieved successfully",
        data,
      };
    } catch (error) {
      throw error;
    }
  }

  @Get(":id")
  @RolePermission(`${ModuleCode.GRN}:${OperationCode.Read}`)
  @ApiOperation({ summary: "Get a GRN by ID" })
  @ApiResponse({ status: 200, description: "GRN retrieved successfully" })
  @ApiResponse({ status: 404, description: "GRN not found" })
  async findOne(
    @Param("id", ParseIntPipe) id: number,
    @Req() req: RequestWithUser
  ) {
    try {
      const data = await this.grnService.findOne(req.user.tenantId, id);
      return {
        success: true,
        message: "GRN retrieved successfully",
        data,
      };
    } catch (error) {
      throw error;
    }
  }

  // Step 1 - Gate Entry (Update/Edit)
  @Put(":id/step1")
  @RolePermission(`${ModuleCode.GRN}:${OperationCode.STEP1_GATE_ENTRY}`)
  @ApiOperation({ summary: "Update GRN Step 1 - Gate Entry (Edit)" })
  @ApiResponse({ status: 200, description: "GRN updated successfully" })
  @ApiResponse({ status: 400, description: "Bad request" })
  @ApiResponse({ status: 404, description: "GRN not found" })
  async updateStep1(
    @Param("id", ParseIntPipe) id: number,
    @Body() updateDto: UpdateGRNStep1Dto,
    @Req() req: RequestWithUser
  ) {
    try {
      const data = await this.grnService.updateStep1(
        req.user.tenantId,
        id,
        updateDto,
        req.user.userId
      );
      return {
        success: true,
        message: "Gate entry data updated successfully",
        data,
      };
    } catch (error) {
      throw error;
    }
  }

  // Step 2 - Initial Weighing
  @Put(":id/step2")
  @RolePermission(`${ModuleCode.GRN}:${OperationCode.STEP2_INITIAL_WEIGHING}`)
  @ApiOperation({ summary: "Update GRN Step 2 - Initial Weighing" })
  @ApiResponse({ status: 200, description: "GRN updated successfully" })
  @ApiResponse({ status: 400, description: "Bad request" })
  @ApiResponse({ status: 404, description: "GRN not found" })
  async updateStep2(
    @Param("id", ParseIntPipe) id: number,
    @Body() updateDto: UpdateGRNStep2Dto,
    @Req() req: RequestWithUser
  ) {
    try {
      const data = await this.grnService.updateStep2(
        req.user.tenantId,
        id,
        updateDto,
        req.user.userId
      );
      return {
        success: true,
        message: "Initial weighing recorded successfully",
        data,
      };
    } catch (error) {
      throw error;
    }
  }

  // Step 3 - Unloading
  @Put(":id/step3")
  @RolePermission(`${ModuleCode.GRN}:${OperationCode.STEP3_UNLOADING}`)
  @ApiOperation({ summary: "Update GRN Step 3 - Unloading" })
  @ApiResponse({ status: 200, description: "GRN updated successfully" })
  @ApiResponse({
    status: 400,
    description: "Bad request - minimum 3 photos required",
  })
  @ApiResponse({ status: 404, description: "GRN not found" })
  async updateStep3(
    @Param("id", ParseIntPipe) id: number,
    @Body() updateDto: UpdateGRNStep3Dto,
    @Req() req: RequestWithUser
  ) {
    try {
      const data = await this.grnService.updateStep3(
        req.user.tenantId,
        id,
        updateDto,
        req.user.userId
      );
      return {
        success: true,
        message: "Unloading data recorded successfully",
        data,
      };
    } catch (error) {
      throw error;
    }
  }

  // Step 4 - Final Weighing
  @Put(":id/step4")
  @RolePermission(`${ModuleCode.GRN}:${OperationCode.STEP4_FINAL_WEIGHING}`)
  @ApiOperation({ summary: "Update GRN Step 4 - Final Weighing" })
  @ApiResponse({ status: 200, description: "GRN updated successfully" })
  @ApiResponse({ status: 400, description: "Bad request" })
  @ApiResponse({ status: 404, description: "GRN not found" })
  async updateStep4(
    @Param("id", ParseIntPipe) id: number,
    @Body() updateDto: UpdateGRNStep4Dto,
    @Req() req: RequestWithUser
  ) {
    try {
      const data = await this.grnService.updateStep4(
        req.user.tenantId,
        id,
        updateDto,
        req.user.userId
      );
      return {
        success: true,
        message: "Final weighing recorded successfully. Net weight calculated.",
        data,
      };
    } catch (error) {
      throw error;
    }
  }

  // Step 5 - Supervisor Review
  @Put(":id/step5")
  @RolePermission(`${ModuleCode.GRN}:${OperationCode.STEP5_SUPERVISOR_REVIEW}`)
  @ApiOperation({ summary: "Update GRN Step 5 - Supervisor Review" })
  @ApiResponse({ status: 200, description: "GRN reviewed successfully" })
  @ApiResponse({
    status: 400,
    description: "Bad request - rejection reason required",
  })
  @ApiResponse({ status: 404, description: "GRN not found" })
  async updateStep5(
    @Param("id", ParseIntPipe) id: number,
    @Body() updateDto: UpdateGRNStep5Dto,
    @Req() req: RequestWithUser
  ) {
    try {
      const data = await this.grnService.updateStep5(
        req.user.tenantId,
        id,
        updateDto,
        req.user.userId
      );
      const message =
        data.approvalStatus === "approved"
          ? "GRN approved successfully"
          : "GRN rejected";
      return {
        success: true,
        message,
        data,
      };
    } catch (error) {
      throw error;
    }
  }

  @Delete(":id")
  @RolePermission(`${ModuleCode.GRN}:${OperationCode.Delete}`)
  @ApiOperation({ summary: "Delete a GRN" })
  @ApiResponse({ status: 200, description: "GRN deleted successfully" })
  @ApiResponse({ status: 404, description: "GRN not found" })
  async remove(
    @Param("id", ParseIntPipe) id: number,
    @Req() req: RequestWithUser
  ) {
    try {
      await this.grnService.remove(req.user.tenantId, id, req.user.userId);
      return {
        success: true,
        message: "GRN deleted successfully",
        data: null,
      };
    } catch (error) {
      throw error;
    }
  }
}
