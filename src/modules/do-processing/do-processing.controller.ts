import {
  Controller,
  Get,
  Post,
  Put,
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
import { DoProcessingService } from "./do-processing.service";
import {
  StartDoProcessingDto,
  GateEntryDto,
  InitialWeighingDto,
  ItemTareWeightDto,
  ItemGrossWeightDto,
  RecordItemWeightDto,
  FinalWeighingDto,
} from "./dto";
import { RolePermission } from "../../common/decorators/role-permission.decorator";
import { RequestWithUser } from "../../common/middleware/verify-token.middleware";
import { ModuleCode } from "../../common/enums/modules.enum";
import { OperationCode } from "../../common/enums/operations.enum";
import { DoProcessingStatus } from "../../entities/do-processing.entity";
import { DeviceBridgeGateway } from "../device-bridge/device-bridge.gateway";

@ApiTags("DO Processing")
@ApiBearerAuth("JWT-auth")
@Controller("do-processing")
export class DoProcessingController {
  constructor(
    private readonly doProcessingService: DoProcessingService,
    private readonly deviceBridgeGateway: DeviceBridgeGateway
  ) {}

  @Post("start")
  @RolePermission(`${ModuleCode.DoProcessing}:${OperationCode.Create}`)
  @ApiOperation({ summary: "Start processing a delivery order" })
  @ApiResponse({ status: 201, description: "Processing started successfully" })
  async startProcessing(
    @Body() dto: StartDoProcessingDto,
    @Req() req: RequestWithUser
  ) {
    const data = await this.doProcessingService.startProcessing(
      req.user.tenantId,
      dto,
      req.user.userId
    );
    return {
      success: true,
      message: "DO processing started successfully",
      data,
    };
  }

  @Put(":id/gate-entry")
  @RolePermission(`${ModuleCode.DoProcessing}:${OperationCode.Update}`)
  @ApiOperation({ summary: "Step 1: Record gate entry details and issue RFID" })
  @ApiResponse({ status: 200, description: "Gate entry recorded successfully" })
  async recordGateEntry(
    @Param("id", ParseIntPipe) id: number,
    @Body() dto: GateEntryDto,
    @Req() req: RequestWithUser
  ) {
    const data = await this.doProcessingService.recordGateEntry(
      req.user.tenantId,
      id,
      dto,
      req.user.userId
    );
    return {
      success: true,
      message: "Gate entry recorded successfully",
      data,
    };
  }

  @Put(":id/initial-weighing")
  @RolePermission(`${ModuleCode.DoProcessing}:${OperationCode.Update}`)
  @ApiOperation({
    summary: "Step 2: Record initial tare weight at weighbridge-1",
  })
  @ApiResponse({
    status: 200,
    description: "Initial weighing recorded successfully",
  })
  async recordInitialWeighing(
    @Param("id", ParseIntPipe) id: number,
    @Body() dto: InitialWeighingDto,
    @Req() req: RequestWithUser
  ) {
    const data = await this.doProcessingService.recordInitialWeighing(
      req.user.tenantId,
      id,
      dto,
      req.user.userId
    );
    return {
      success: true,
      message: "Initial weighing recorded successfully",
      data,
    };
  }

  @Put(":id/item-tare-weight")
  @RolePermission(`${ModuleCode.DoProcessing}:${OperationCode.Update}`)
  @ApiOperation({ summary: "Step 4: Record item tare weight at weighbridge-2" })
  @ApiResponse({
    status: 200,
    description: "Item tare weight recorded successfully",
  })
  async recordItemTareWeight(
    @Param("id", ParseIntPipe) id: number,
    @Body() dto: ItemTareWeightDto,
    @Req() req: RequestWithUser
  ) {
    const data = await this.doProcessingService.recordItemTareWeight(
      req.user.tenantId,
      id,
      dto,
      req.user.userId
    );
    return {
      success: true,
      message: "Item tare weight recorded successfully",
      data,
    };
  }

  @Put(":id/item-gross-weight")
  @RolePermission(`${ModuleCode.DoProcessing}:${OperationCode.Update}`)
  @ApiOperation({
    summary: "Step 5/6: Record item gross weight at weighbridge-2",
  })
  @ApiResponse({
    status: 200,
    description: "Item gross weight recorded successfully",
  })
  async recordItemGrossWeight(
    @Param("id", ParseIntPipe) id: number,
    @Body() dto: ItemGrossWeightDto,
    @Req() req: RequestWithUser
  ) {
    const data = await this.doProcessingService.recordItemGrossWeight(
      req.user.tenantId,
      id,
      dto,
      req.user.userId
    );
    return {
      success: true,
      message: "Item gross weight recorded successfully",
      data,
    };
  }

  @Put(":id/mark-item-loaded/:itemId")
  @RolePermission(`${ModuleCode.DoProcessing}:${OperationCode.Update}`)
  @ApiOperation({ summary: "Mark item as loaded (ready for weighing)" })
  @ApiResponse({
    status: 200,
    description: "Item marked as loaded successfully",
  })
  async markItemAsLoaded(
    @Param("id", ParseIntPipe) id: number,
    @Param("itemId", ParseIntPipe) itemId: number,
    @Req() req: RequestWithUser
  ) {
    const data = await this.doProcessingService.markItemAsLoaded(
      req.user.tenantId,
      id,
      itemId,
      req.user.userId
    );
    return {
      success: true,
      message: "Item marked as loaded successfully",
      data,
    };
  }

  @Put(":id/record-item-weight")
  @RolePermission(`${ModuleCode.DoProcessing}:${OperationCode.Update}`)
  @ApiOperation({ summary: "Record item weight (combined tare and gross)" })
  @ApiResponse({
    status: 200,
    description: "Item weight recorded successfully",
  })
  async recordItemWeight(
    @Param("id", ParseIntPipe) id: number,
    @Body() dto: RecordItemWeightDto,
    @Req() req: RequestWithUser
  ) {
    const data = await this.doProcessingService.recordItemWeight(
      req.user.tenantId,
      id,
      dto,
      req.user.userId
    );
    return {
      success: true,
      message: "Item weight recorded successfully",
      data,
    };
  }

  @Put(":id/skip-item/:itemId")
  @RolePermission(`${ModuleCode.DoProcessing}:${OperationCode.Update}`)
  @ApiOperation({ summary: "Skip an item (won't be loaded)" })
  @ApiResponse({ status: 200, description: "Item skipped successfully" })
  async skipItem(
    @Param("id", ParseIntPipe) id: number,
    @Param("itemId", ParseIntPipe) itemId: number,
    @Body("remarks") remarks: string,
    @Req() req: RequestWithUser
  ) {
    const data = await this.doProcessingService.skipItem(
      req.user.tenantId,
      id,
      itemId,
      remarks,
      req.user.userId
    );
    return {
      success: true,
      message: "Item skipped successfully",
      data,
    };
  }

  @Put(":id/final-weighing")
  @RolePermission(`${ModuleCode.DoProcessing}:${OperationCode.Update}`)
  @ApiOperation({
    summary: "Step 8: Record final gross weight at weighbridge-1",
  })
  @ApiResponse({
    status: 200,
    description: "Final weighing recorded successfully",
  })
  async recordFinalWeighing(
    @Param("id", ParseIntPipe) id: number,
    @Body() dto: FinalWeighingDto,
    @Req() req: RequestWithUser
  ) {
    const data = await this.doProcessingService.recordFinalWeighing(
      req.user.tenantId,
      id,
      dto,
      req.user.userId
    );
    return {
      success: true,
      message: "Final weighing recorded successfully",
      data,
    };
  }

  @Put(":id/cancel")
  @RolePermission(`${ModuleCode.DoProcessing}:${OperationCode.Update}`)
  @ApiOperation({ summary: "Cancel DO processing" })
  @ApiResponse({
    status: 200,
    description: "Processing cancelled successfully",
  })
  async cancelProcessing(
    @Param("id", ParseIntPipe) id: number,
    @Body("remarks") remarks: string,
    @Req() req: RequestWithUser
  ) {
    const data = await this.doProcessingService.cancelProcessing(
      req.user.tenantId,
      id,
      remarks,
      req.user.userId
    );
    return {
      success: true,
      message: "DO processing cancelled successfully",
      data,
    };
  }

  @Get()
  @RolePermission(`${ModuleCode.DoProcessing}:${OperationCode.List}`)
  @ApiOperation({ summary: "Get all DO processing records" })
  @ApiQuery({ name: "status", required: false, enum: DoProcessingStatus })
  @ApiResponse({
    status: 200,
    description: "DO processing records retrieved successfully",
  })
  async findAll(
    @Query("status") status: DoProcessingStatus,
    @Req() req: RequestWithUser
  ) {
    const data = await this.doProcessingService.findAll(
      req.user.tenantId,
      status
    );
    return {
      success: true,
      message: "DO processing records retrieved successfully",
      data,
    };
  }

  @Get("in-progress")
  @RolePermission(`${ModuleCode.DoProcessing}:${OperationCode.List}`)
  @ApiOperation({ summary: "Get in-progress DO processing records" })
  @ApiResponse({
    status: 200,
    description: "In-progress records retrieved successfully",
  })
  async findInProgress(@Req() req: RequestWithUser) {
    const data = await this.doProcessingService.findInProgress(
      req.user.tenantId
    );
    return {
      success: true,
      message: "In-progress records retrieved successfully",
      data,
    };
  }

  @Get("stats")
  @RolePermission(`${ModuleCode.DoProcessing}:${OperationCode.List}`)
  @ApiOperation({ summary: "Get DO processing statistics" })
  @ApiResponse({ status: 200, description: "Stats retrieved successfully" })
  async getStats(@Req() req: RequestWithUser) {
    const data = await this.doProcessingService.getStats(req.user.tenantId);
    return {
      success: true,
      message: "Stats retrieved successfully",
      data,
    };
  }

  @Get(":id")
  @RolePermission(`${ModuleCode.DoProcessing}:${OperationCode.Read}`)
  @ApiOperation({ summary: "Get a DO processing record by ID" })
  @ApiResponse({
    status: 200,
    description: "DO processing record retrieved successfully",
  })
  async findOne(
    @Param("id", ParseIntPipe) id: number,
    @Req() req: RequestWithUser
  ) {
    const data = await this.doProcessingService.findOne(req.user.tenantId, id);
    return {
      success: true,
      message: "DO processing record retrieved successfully",
      data,
    };
  }

  @Get("by-do/:doNumber")
  @RolePermission(`${ModuleCode.DoProcessing}:${OperationCode.Read}`)
  @ApiOperation({ summary: "Get processing record by DO number" })
  @ApiResponse({
    status: 200,
    description: "DO processing record retrieved successfully",
  })
  async findByDoNumber(
    @Param("doNumber") doNumber: string,
    @Req() req: RequestWithUser
  ) {
    const data = await this.doProcessingService.findByDoNumber(
      req.user.tenantId,
      doNumber
    );
    return {
      success: true,
      message: "DO processing record retrieved successfully",
      data,
    };
  }

  @Post("test-weight/:weighbridgeId/:weight")
  @RolePermission(`${ModuleCode.DoProcessing}:${OperationCode.Update}`)
  @ApiOperation({ summary: "Send test weight reading (for development)" })
  @ApiResponse({
    status: 200,
    description: "Test weight sent successfully",
  })
  async sendTestWeight(
    @Param("weighbridgeId", ParseIntPipe) weighbridgeId: number,
    @Param("weight", ParseIntPipe) weight: number,
    @Req() req: RequestWithUser
  ) {
    this.deviceBridgeGateway.sendTestWeightReading(
      req.user.tenantId,
      weighbridgeId,
      weight
    );
    return {
      success: true,
      message: "Test weight sent successfully",
      data: { weighbridgeId, weight },
    };
  }
}
