import { Controller, Get, Query, Req } from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from "@nestjs/swagger";
import { DashboardService } from "./dashboard.service";
import { RolePermission } from "../../common/decorators/role-permission.decorator";
import { RequestWithUser } from "../../common/middleware/verify-token.middleware";
import { ModuleCode, OperationCode } from "../../common/enums";

@ApiTags("Dashboard")
@ApiBearerAuth("JWT-auth")
@Controller("dashboard")
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get("summary")
  @RolePermission(`${ModuleCode.DASHBOARD}:${OperationCode.READ}`)
  @ApiOperation({ summary: "Get dashboard summary" })
  @ApiResponse({
    status: 200,
    description: "Dashboard summary retrieved successfully",
  })
  async getDashboardSummary(@Req() req: RequestWithUser) {
    try {
      const data = await this.dashboardService.getDashboardSummary(
        req.user.tenantId
      );
      return {
        success: true,
        message: "Dashboard summary retrieved successfully",
        data,
      };
    } catch (error) {
      throw error;
    }
  }

  @Get("grn/today")
  @RolePermission(
    `${ModuleCode.DASHBOARD}:${OperationCode.READ}`,
    `${ModuleCode.GRN}:${OperationCode.LIST}`
  )
  @ApiOperation({ summary: "Get today's GRN statistics" })
  @ApiResponse({
    status: 200,
    description: "GRN statistics retrieved successfully",
  })
  async getTodayGRNStats(@Req() req: RequestWithUser) {
    try {
      const data = await this.dashboardService.getTodayGRNStats(
        req.user.tenantId
      );
      return {
        success: true,
        message: "Today's GRN statistics retrieved successfully",
        data,
      };
    } catch (error) {
      throw error;
    }
  }

  @Get("qc/pending-count")
  @RolePermission(
    `${ModuleCode.DASHBOARD}:${OperationCode.READ}`,
    `${ModuleCode.QC}:${OperationCode.LIST}`
  )
  @ApiOperation({ summary: "Get pending QC count" })
  @ApiResponse({
    status: 200,
    description: "Pending QC count retrieved successfully",
  })
  async getPendingQCCount(@Req() req: RequestWithUser) {
    try {
      const count = await this.dashboardService.getPendingQCCount(
        req.user.tenantId
      );
      return {
        success: true,
        message: "Pending QC count retrieved successfully",
        data: { count },
      };
    } catch (error) {
      throw error;
    }
  }

  @Get("gate-pass/active-count")
  @RolePermission(
    `${ModuleCode.DASHBOARD}:${OperationCode.READ}`,
    `${ModuleCode.GATE_PASS}:${OperationCode.LIST}`
  )
  @ApiOperation({ summary: "Get active gate pass count" })
  @ApiResponse({
    status: 200,
    description: "Active gate pass count retrieved successfully",
  })
  async getActiveGatePassCount(@Req() req: RequestWithUser) {
    try {
      const count = await this.dashboardService.getActiveGatePassCount(
        req.user.tenantId
      );
      return {
        success: true,
        message: "Active gate pass count retrieved successfully",
        data: { count },
      };
    } catch (error) {
      throw error;
    }
  }

  @Get("grn/recent")
  @RolePermission(
    `${ModuleCode.DASHBOARD}:${OperationCode.READ}`,
    `${ModuleCode.GRN}:${OperationCode.LIST}`
  )
  @ApiOperation({ summary: "Get recent GRN activity" })
  @ApiQuery({ name: "limit", required: false, type: Number, example: 10 })
  @ApiResponse({
    status: 200,
    description: "Recent GRN activity retrieved successfully",
  })
  async getRecentGRNActivity(
    @Query("limit") limit: number = 10,
    @Req() req: RequestWithUser
  ) {
    try {
      const data = await this.dashboardService.getRecentGRNActivity(
        req.user.tenantId,
        limit
      );
      return {
        success: true,
        message: "Recent GRN activity retrieved successfully",
        data,
      };
    } catch (error) {
      throw error;
    }
  }

  @Get("menu")
  @ApiOperation({
    summary: "Get user's available menu items based on plan and permissions",
  })
  @ApiResponse({
    status: 200,
    description: "Menu items retrieved successfully",
  })
  async getUserMenuItems(@Req() req: RequestWithUser) {
    try {
      const data = await this.dashboardService.getUserMenuItems(
        req.user.tenantId,
        req.user.userId
      );
      return {
        success: true,
        message: "Menu items retrieved successfully",
        data,
      };
    } catch (error) {
      throw error;
    }
  }

  @Get("grn/stats")
  @RolePermission(
    `${ModuleCode.DASHBOARD}:${OperationCode.READ}`,
    `${ModuleCode.GRN}:${OperationCode.LIST}`
  )
  @ApiOperation({ summary: "Get GRN statistics for a date range" })
  @ApiQuery({ name: "startDate", type: String, example: "2024-01-01" })
  @ApiQuery({ name: "endDate", type: String, example: "2024-12-31" })
  @ApiResponse({
    status: 200,
    description: "GRN statistics retrieved successfully",
  })
  async getGRNStatsByDateRange(
    @Query("startDate") startDate: string,
    @Query("endDate") endDate: string,
    @Req() req: RequestWithUser
  ) {
    try {
      const data = await this.dashboardService.getGRNStatsByDateRange(
        req.user.tenantId,
        new Date(startDate),
        new Date(endDate)
      );
      return {
        success: true,
        message: "GRN statistics retrieved successfully",
        data,
      };
    } catch (error) {
      throw error;
    }
  }
}
