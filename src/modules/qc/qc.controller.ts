import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
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
import { QCService } from "./qc.service";
import {
  CreateQCInspectionDto,
  UpdateQCInspectionDto,
  CompleteQCInspectionDto,
} from "./dto";
import { RolePermission } from "../../common/decorators/role-permission.decorator";
import { RequestWithUser } from "../../common/middleware/verify-token.middleware";
import { ModuleCode } from "../../common/enums/modules.enum";
import { OperationCode } from "../../common/enums/operations.enum";

@ApiTags("QC Inspection")
@ApiBearerAuth("JWT-auth")
@Controller("qc")
export class QCController {
  constructor(private readonly qcService: QCService) {}

  @Post()
  @RolePermission(`${ModuleCode.QC}:${OperationCode.CREATE}`)
  @ApiOperation({ summary: "Create a new QC inspection" })
  @ApiResponse({
    status: 201,
    description: "QC inspection created successfully",
  })
  @ApiResponse({ status: 400, description: "Bad request" })
  @ApiResponse({ status: 404, description: "GRN not found" })
  async create(
    @Body() createDto: CreateQCInspectionDto,
    @Req() req: RequestWithUser
  ) {
    try {
      const data = await this.qcService.create(
        req.user.tenantId,
        createDto,
        req.user.userId
      );
      return {
        success: true,
        message: "QC inspection created successfully",
        data,
      };
    } catch (error) {
      throw error;
    }
  }

  @Get()
  @RolePermission(`${ModuleCode.QC}:${OperationCode.LIST}`)
  @ApiOperation({ summary: "Get all QC inspections" })
  @ApiResponse({
    status: 200,
    description: "QC inspections retrieved successfully",
  })
  async findAll(@Req() req: RequestWithUser) {
    try {
      const data = await this.qcService.findAll(req.user.tenantId);
      return {
        success: true,
        message: "QC inspections retrieved successfully",
        data,
      };
    } catch (error) {
      throw error;
    }
  }

  @Get("pending")
  @RolePermission(`${ModuleCode.QC}:${OperationCode.LIST}`)
  @ApiOperation({ summary: "Get pending QC inspections" })
  @ApiResponse({
    status: 200,
    description: "Pending QC inspections retrieved successfully",
  })
  async findPending(@Req() req: RequestWithUser) {
    try {
      const data = await this.qcService.findPending(req.user.tenantId);
      return {
        success: true,
        message: "Pending QC inspections retrieved successfully",
        data,
      };
    } catch (error) {
      throw error;
    }
  }

  @Get("count/pending")
  @RolePermission(`${ModuleCode.QC}:${OperationCode.READ}`)
  @ApiOperation({ summary: "Get count of pending QC inspections" })
  @ApiResponse({ status: 200, description: "Count retrieved successfully" })
  async getPendingCount(@Req() req: RequestWithUser) {
    try {
      const count = await this.qcService.getPendingCount(req.user.tenantId);
      return {
        success: true,
        message: "Pending QC count retrieved successfully",
        data: { count },
      };
    } catch (error) {
      throw error;
    }
  }

  @Get("stats")
  @RolePermission(`${ModuleCode.QC}:${OperationCode.READ}`)
  @ApiOperation({ summary: "Get QC inspection statistics" })
  @ApiResponse({
    status: 200,
    description: "Statistics retrieved successfully",
  })
  async getStats(@Req() req: RequestWithUser) {
    try {
      const data = await this.qcService.getStats(req.user.tenantId);
      return {
        success: true,
        message: "QC statistics retrieved successfully",
        data,
      };
    } catch (error) {
      throw error;
    }
  }

  @Get("status/:status")
  @RolePermission(`${ModuleCode.QC}:${OperationCode.LIST}`)
  @ApiOperation({ summary: "Get QC inspections by status" })
  @ApiQuery({
    name: "status",
    enum: ["pending", "in_progress", "pass", "fail"],
  })
  @ApiResponse({
    status: 200,
    description: "QC inspections retrieved successfully",
  })
  async findByStatus(
    @Param("status") status: string,
    @Req() req: RequestWithUser
  ) {
    try {
      const data = await this.qcService.findByStatus(req.user.tenantId, status);
      return {
        success: true,
        message: "QC inspections retrieved successfully",
        data,
      };
    } catch (error) {
      throw error;
    }
  }

  @Get("material/:materialId")
  @RolePermission(`${ModuleCode.QC}:${OperationCode.LIST}`)
  @ApiOperation({ summary: "Get QC inspections by material" })
  @ApiResponse({
    status: 200,
    description: "QC inspections retrieved successfully",
  })
  async findByMaterial(
    @Param("materialId", ParseIntPipe) materialId: number,
    @Req() req: RequestWithUser
  ) {
    try {
      const data = await this.qcService.findByMaterial(
        req.user.tenantId,
        materialId
      );
      return {
        success: true,
        message: "QC inspections retrieved successfully",
        data,
      };
    } catch (error) {
      throw error;
    }
  }

  @Get("vendor/:vendorId")
  @RolePermission(`${ModuleCode.QC}:${OperationCode.LIST}`)
  @ApiOperation({ summary: "Get QC inspections by vendor" })
  @ApiResponse({
    status: 200,
    description: "QC inspections retrieved successfully",
  })
  async findByVendor(
    @Param("vendorId", ParseIntPipe) vendorId: number,
    @Req() req: RequestWithUser
  ) {
    try {
      const data = await this.qcService.findByVendor(
        req.user.tenantId,
        vendorId
      );
      return {
        success: true,
        message: "QC inspections retrieved successfully",
        data,
      };
    } catch (error) {
      throw error;
    }
  }

  @Get("date-range")
  @RolePermission(`${ModuleCode.QC}:${OperationCode.LIST}`)
  @ApiOperation({ summary: "Get QC inspections by date range" })
  @ApiQuery({ name: "startDate", type: String, example: "2024-01-01" })
  @ApiQuery({ name: "endDate", type: String, example: "2024-12-31" })
  @ApiResponse({
    status: 200,
    description: "QC inspections retrieved successfully",
  })
  async findByDateRange(
    @Query("startDate") startDate: string,
    @Query("endDate") endDate: string,
    @Req() req: RequestWithUser
  ) {
    try {
      const data = await this.qcService.findByDateRange(
        req.user.tenantId,
        new Date(startDate),
        new Date(endDate)
      );
      return {
        success: true,
        message: "QC inspections retrieved successfully",
        data,
      };
    } catch (error) {
      throw error;
    }
  }

  @Get(":id/report")
  @RolePermission(`${ModuleCode.QC}:${OperationCode.EXPORT}`)
  @ApiOperation({
    summary: "Generate inspection report for a completed QC inspection",
  })
  @ApiResponse({
    status: 200,
    description: "Inspection report generated successfully",
  })
  @ApiResponse({ status: 400, description: "Inspection not completed" })
  @ApiResponse({ status: 404, description: "QC inspection not found" })
  async generateReport(
    @Param("id", ParseIntPipe) id: number,
    @Req() req: RequestWithUser
  ) {
    try {
      const data = await this.qcService.generateReport(req.user.tenantId, id);
      return {
        success: true,
        message: "Inspection report generated successfully",
        data,
      };
    } catch (error) {
      throw error;
    }
  }

  @Get(":id")
  @RolePermission(`${ModuleCode.QC}:${OperationCode.READ}`)
  @ApiOperation({ summary: "Get a QC inspection by ID" })
  @ApiResponse({
    status: 200,
    description: "QC inspection retrieved successfully",
  })
  @ApiResponse({ status: 404, description: "QC inspection not found" })
  async findOne(
    @Param("id", ParseIntPipe) id: number,
    @Req() req: RequestWithUser
  ) {
    try {
      const data = await this.qcService.findOne(req.user.tenantId, id);
      return {
        success: true,
        message: "QC inspection retrieved successfully",
        data,
      };
    } catch (error) {
      throw error;
    }
  }

  @Put(":id")
  @RolePermission(`${ModuleCode.QC}:${OperationCode.UPDATE}`)
  @ApiOperation({ summary: "Update a QC inspection" })
  @ApiResponse({
    status: 200,
    description: "QC inspection updated successfully",
  })
  @ApiResponse({
    status: 400,
    description: "Cannot update completed inspection",
  })
  @ApiResponse({ status: 404, description: "QC inspection not found" })
  async update(
    @Param("id", ParseIntPipe) id: number,
    @Body() updateDto: UpdateQCInspectionDto,
    @Req() req: RequestWithUser
  ) {
    try {
      const data = await this.qcService.update(
        req.user.tenantId,
        id,
        updateDto,
        req.user.userId
      );
      return {
        success: true,
        message: "QC inspection updated successfully",
        data,
      };
    } catch (error) {
      throw error;
    }
  }

  @Put(":id/complete")
  @RolePermission(`${ModuleCode.QC}:${OperationCode.APPROVE}`)
  @ApiOperation({ summary: "Complete a QC inspection with pass/fail result" })
  @ApiResponse({
    status: 200,
    description: "QC inspection completed successfully",
  })
  @ApiResponse({ status: 400, description: "Bad request" })
  @ApiResponse({ status: 404, description: "QC inspection not found" })
  async complete(
    @Param("id", ParseIntPipe) id: number,
    @Body() completeDto: CompleteQCInspectionDto,
    @Req() req: RequestWithUser
  ) {
    try {
      const data = await this.qcService.complete(
        req.user.tenantId,
        id,
        completeDto,
        req.user.userId
      );
      const message =
        data.status === "pass"
          ? "QC inspection passed"
          : "QC inspection failed";
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
  @RolePermission(`${ModuleCode.QC}:${OperationCode.DELETE}`)
  @ApiOperation({ summary: "Delete a QC inspection" })
  @ApiResponse({
    status: 200,
    description: "QC inspection deleted successfully",
  })
  @ApiResponse({ status: 404, description: "QC inspection not found" })
  async remove(
    @Param("id", ParseIntPipe) id: number,
    @Req() req: RequestWithUser
  ) {
    try {
      await this.qcService.remove(req.user.tenantId, id, req.user.userId);
      return {
        success: true,
        message: "QC inspection deleted successfully",
        data: null,
      };
    } catch (error) {
      throw error;
    }
  }
}
