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
import { RFIDService } from "./rfid.service";
import {
  CreateRFIDCardDto,
  UpdateRFIDCardDto,
  AssignRFIDCardDto,
  ScanRFIDCardDto,
} from "./dto";
import { RolePermission } from "../../common/decorators/role-permission.decorator";
import { RequestWithUser } from "../../common/middleware/verify-token.middleware";
import { ModuleCode } from "../../common/enums/modules.enum";
import { OperationCode } from "../../common/enums/operations.enum";

@ApiTags("RFID")
@ApiBearerAuth("JWT-auth")
@Controller("rfid")
export class RFIDController {
  constructor(private readonly rfidService: RFIDService) {}

  @Post()
  @RolePermission(`${ModuleCode.RFID}:${OperationCode.Create}`)
  @ApiOperation({ summary: "Create a new RFID card" })
  @ApiResponse({ status: 201, description: "RFID card created successfully" })
  async create(
    @Body() createDto: CreateRFIDCardDto,
    @Req() req: RequestWithUser
  ) {
    const data = await this.rfidService.create(
      req.user.tenantId,
      createDto,
      req.user.userId
    );
    return {
      success: true,
      message: "RFID card created successfully",
      data,
    };
  }

  @Get()
  @RolePermission(`${ModuleCode.RFID}:${OperationCode.List}`)
  @ApiOperation({ summary: "Get all RFID cards" })
  @ApiResponse({
    status: 200,
    description: "RFID cards retrieved successfully",
  })
  async findAll(@Req() req: RequestWithUser) {
    const data = await this.rfidService.findAll(req.user.tenantId);
    return {
      success: true,
      message: "RFID cards retrieved successfully",
      data,
    };
  }

  @Get("available")
  @RolePermission(
    `${ModuleCode.RFID}:${OperationCode.List}`,
    `${ModuleCode.RFID}:${OperationCode.Assign}`
  )
  @ApiOperation({ summary: "Get all available RFID cards for assignment" })
  @ApiResponse({
    status: 200,
    description: "Available RFID cards retrieved successfully",
  })
  async findAvailable(@Req() req: RequestWithUser) {
    const data = await this.rfidService.findAvailable(req.user.tenantId);
    return {
      success: true,
      message: "Available RFID cards retrieved successfully",
      data,
    };
  }

  @Get(":id")
  @RolePermission(`${ModuleCode.RFID}:${OperationCode.Read}`)
  @ApiOperation({ summary: "Get an RFID card by ID" })
  @ApiResponse({ status: 200, description: "RFID card retrieved successfully" })
  @ApiResponse({ status: 404, description: "RFID card not found" })
  async findOne(
    @Param("id", ParseIntPipe) id: number,
    @Req() req: RequestWithUser
  ) {
    const data = await this.rfidService.findOne(req.user.tenantId, id);
    return {
      success: true,
      message: "RFID card retrieved successfully",
      data,
    };
  }

  @Put(":id")
  @RolePermission(`${ModuleCode.RFID}:${OperationCode.Update}`)
  @ApiOperation({ summary: "Update an RFID card" })
  @ApiResponse({ status: 200, description: "RFID card updated successfully" })
  @ApiResponse({ status: 404, description: "RFID card not found" })
  async update(
    @Param("id", ParseIntPipe) id: number,
    @Body() updateDto: UpdateRFIDCardDto,
    @Req() req: RequestWithUser
  ) {
    const data = await this.rfidService.update(
      req.user.tenantId,
      id,
      updateDto,
      req.user.userId
    );
    return {
      success: true,
      message: "RFID card updated successfully",
      data,
    };
  }

  @Delete(":id")
  @RolePermission(`${ModuleCode.RFID}:${OperationCode.Delete}`)
  @ApiOperation({ summary: "Delete an RFID card" })
  @ApiResponse({ status: 200, description: "RFID card deleted successfully" })
  @ApiResponse({ status: 404, description: "RFID card not found" })
  async remove(
    @Param("id", ParseIntPipe) id: number,
    @Req() req: RequestWithUser
  ) {
    await this.rfidService.remove(req.user.tenantId, id, req.user.userId);
    return {
      success: true,
      message: "RFID card deleted successfully",
      data: null,
    };
  }

  @Post("assign")
  @RolePermission(`${ModuleCode.RFID}:${OperationCode.Assign}`)
  @ApiOperation({ summary: "Assign an RFID card to a GRN or DO Processing" })
  @ApiResponse({ status: 200, description: "RFID card assigned successfully" })
  async assign(
    @Body() assignDto: AssignRFIDCardDto,
    @Req() req: RequestWithUser
  ) {
    const data = await this.rfidService.assign(
      req.user.tenantId,
      assignDto,
      req.user.userId
    );
    const assignedTo = data.grn
      ? `GRN ${data.grn.grnNumber}`
      : data.doProcessing
        ? `DO Processing ${data.doProcessing.doNumber}`
        : "unknown";
    return {
      success: true,
      message: `RFID card assigned to ${assignedTo} successfully`,
      data,
    };
  }

  @Post("unassign/:cardNumber")
  @RolePermission(`${ModuleCode.RFID}:${OperationCode.Assign}`)
  @ApiOperation({
    summary: "Unassign an RFID card from its GRN or DO Processing",
  })
  @ApiResponse({
    status: 200,
    description: "RFID card unassigned successfully",
  })
  async unassign(
    @Param("cardNumber") cardNumber: string,
    @Req() req: RequestWithUser
  ) {
    const data = await this.rfidService.unassign(
      req.user.tenantId,
      cardNumber,
      req.user.userId
    );
    return {
      success: true,
      message: "RFID card unassigned successfully",
      data,
    };
  }

  @Post("scan")
  @RolePermission(`${ModuleCode.RFID}:${OperationCode.Scan}`)
  @ApiOperation({
    summary: "Scan an RFID card and get linked GRN or DO Processing",
  })
  @ApiResponse({ status: 200, description: "RFID card scanned successfully" })
  async scan(@Body() scanDto: ScanRFIDCardDto, @Req() req: RequestWithUser) {
    const data = await this.rfidService.scan(
      req.user.tenantId,
      scanDto,
      req.user.userId
    );
    let message = "RFID card scanned - Not assigned";
    if (data.grn) {
      message = `RFID card scanned - GRN ${data.grn.grnNumber} found`;
    } else if (data.doProcessing) {
      message = `RFID card scanned - DO Processing ${data.doProcessing.doNumber} found`;
    }
    return {
      success: true,
      message,
      data,
    };
  }
}
