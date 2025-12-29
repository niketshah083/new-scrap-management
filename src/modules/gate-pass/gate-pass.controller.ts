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
import { GatePassService } from "./gate-pass.service";
import {
  CreateGatePassDto,
  VerifyGatePassDto,
  MarkGatePassUsedDto,
} from "./dto";
import { RolePermission } from "../../common/decorators/role-permission.decorator";
import { RequestWithUser } from "../../common/middleware/verify-token.middleware";
import { ModuleCode } from "../../common/enums/modules.enum";
import { OperationCode } from "../../common/enums/operations.enum";

@ApiTags("Gate Pass")
@ApiBearerAuth("JWT-auth")
@Controller("gate-pass")
export class GatePassController {
  constructor(private readonly gatePassService: GatePassService) {}

  @Post()
  @RolePermission(
    `${ModuleCode.GATE_PASS}:${OperationCode.CREATE}`,
    `${ModuleCode.GRN}:${OperationCode.STEP7_GATE_PASS}`
  )
  @ApiOperation({ summary: "Generate a new gate pass for approved GRN" })
  @ApiResponse({ status: 201, description: "Gate pass created successfully" })
  @ApiResponse({ status: 400, description: "Bad request" })
  @ApiResponse({ status: 404, description: "GRN not found" })
  async create(
    @Body() createDto: CreateGatePassDto,
    @Req() req: RequestWithUser
  ) {
    try {
      const data = await this.gatePassService.create(
        req.user.tenantId,
        createDto,
        req.user.userId
      );
      return {
        success: true,
        message: "Gate pass generated successfully",
        data,
      };
    } catch (error) {
      throw error;
    }
  }

  @Get()
  @RolePermission(`${ModuleCode.GATE_PASS}:${OperationCode.LIST}`)
  @ApiOperation({ summary: "Get all gate passes" })
  @ApiResponse({
    status: 200,
    description: "Gate passes retrieved successfully",
  })
  async findAll(@Req() req: RequestWithUser) {
    try {
      const data = await this.gatePassService.findAll(req.user.tenantId);
      return {
        success: true,
        message: "Gate passes retrieved successfully",
        data,
      };
    } catch (error) {
      throw error;
    }
  }

  @Get("active")
  @RolePermission(`${ModuleCode.GATE_PASS}:${OperationCode.LIST}`)
  @ApiOperation({ summary: "Get all active gate passes" })
  @ApiResponse({
    status: 200,
    description: "Active gate passes retrieved successfully",
  })
  async findActive(@Req() req: RequestWithUser) {
    try {
      const data = await this.gatePassService.findActive(req.user.tenantId);
      return {
        success: true,
        message: "Active gate passes retrieved successfully",
        data,
      };
    } catch (error) {
      throw error;
    }
  }

  @Get("expired")
  @RolePermission(`${ModuleCode.GATE_PASS}:${OperationCode.LIST}`)
  @ApiOperation({ summary: "Get all expired gate passes" })
  @ApiResponse({
    status: 200,
    description: "Expired gate passes retrieved successfully",
  })
  async findExpired(@Req() req: RequestWithUser) {
    try {
      const data = await this.gatePassService.findExpired(req.user.tenantId);
      return {
        success: true,
        message: "Expired gate passes retrieved successfully",
        data,
      };
    } catch (error) {
      throw error;
    }
  }

  @Get("count/active")
  @RolePermission(`${ModuleCode.GATE_PASS}:${OperationCode.READ}`)
  @ApiOperation({ summary: "Get count of active gate passes" })
  @ApiResponse({ status: 200, description: "Count retrieved successfully" })
  async getActiveCount(@Req() req: RequestWithUser) {
    try {
      const count = await this.gatePassService.getActiveCount(
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

  @Post("verify")
  @RolePermission(`${ModuleCode.GATE_PASS}:${OperationCode.READ}`)
  @ApiOperation({ summary: "Verify a gate pass by pass number" })
  @ApiResponse({ status: 200, description: "Gate pass verification result" })
  @ApiResponse({ status: 404, description: "Gate pass not found" })
  async verify(
    @Body() verifyDto: VerifyGatePassDto,
    @Req() req: RequestWithUser
  ) {
    try {
      const result = await this.gatePassService.verify(
        req.user.tenantId,
        verifyDto.passNumber
      );
      return {
        success: true,
        message: result.message,
        data: result,
      };
    } catch (error) {
      throw error;
    }
  }

  @Get("by-grn/:grnId")
  @RolePermission(`${ModuleCode.GATE_PASS}:${OperationCode.READ}`)
  @ApiOperation({ summary: "Get a gate pass by GRN ID" })
  @ApiResponse({ status: 200, description: "Gate pass retrieved successfully" })
  async findByGrnId(
    @Param("grnId", ParseIntPipe) grnId: number,
    @Req() req: RequestWithUser
  ) {
    try {
      const data = await this.gatePassService.findByGrnId(
        req.user.tenantId,
        grnId
      );
      return {
        success: true,
        message: data
          ? "Gate pass retrieved successfully"
          : "No gate pass found for this GRN",
        data,
      };
    } catch (error) {
      throw error;
    }
  }

  @Get(":id")
  @RolePermission(`${ModuleCode.GATE_PASS}:${OperationCode.READ}`)
  @ApiOperation({ summary: "Get a gate pass by ID" })
  @ApiResponse({ status: 200, description: "Gate pass retrieved successfully" })
  @ApiResponse({ status: 404, description: "Gate pass not found" })
  async findOne(
    @Param("id", ParseIntPipe) id: number,
    @Req() req: RequestWithUser
  ) {
    try {
      const data = await this.gatePassService.findOne(req.user.tenantId, id);
      return {
        success: true,
        message: "Gate pass retrieved successfully",
        data,
      };
    } catch (error) {
      throw error;
    }
  }

  @Put(":id/use")
  @RolePermission(`${ModuleCode.GATE_PASS}:${OperationCode.UPDATE}`)
  @ApiOperation({ summary: "Mark a gate pass as used" })
  @ApiResponse({ status: 200, description: "Gate pass marked as used" })
  @ApiResponse({
    status: 400,
    description: "Gate pass already used or expired",
  })
  @ApiResponse({ status: 404, description: "Gate pass not found" })
  async markAsUsed(
    @Param("id", ParseIntPipe) id: number,
    @Body() markUsedDto: MarkGatePassUsedDto,
    @Req() req: RequestWithUser
  ) {
    try {
      const data = await this.gatePassService.markAsUsed(
        req.user.tenantId,
        id,
        req.user.userId,
        markUsedDto.notes
      );
      return {
        success: true,
        message: "Gate pass marked as used successfully",
        data,
      };
    } catch (error) {
      throw error;
    }
  }

  @Post("update-expired")
  @RolePermission(`${ModuleCode.GATE_PASS}:${OperationCode.UPDATE}`)
  @ApiOperation({ summary: "Update all expired gate passes status" })
  @ApiResponse({ status: 200, description: "Expired passes updated" })
  async updateExpiredPasses(@Req() req: RequestWithUser) {
    try {
      const count = await this.gatePassService.updateExpiredPasses(
        req.user.tenantId
      );
      return {
        success: true,
        message: `${count} gate passes marked as expired`,
        data: { updatedCount: count },
      };
    } catch (error) {
      throw error;
    }
  }

  @Delete(":id")
  @RolePermission(`${ModuleCode.GATE_PASS}:${OperationCode.DELETE}`)
  @ApiOperation({ summary: "Delete a gate pass" })
  @ApiResponse({ status: 200, description: "Gate pass deleted successfully" })
  @ApiResponse({ status: 404, description: "Gate pass not found" })
  async remove(
    @Param("id", ParseIntPipe) id: number,
    @Req() req: RequestWithUser
  ) {
    try {
      await this.gatePassService.remove(req.user.tenantId, id, req.user.userId);
      return {
        success: true,
        message: "Gate pass deleted successfully",
        data: null,
      };
    } catch (error) {
      throw error;
    }
  }
}
