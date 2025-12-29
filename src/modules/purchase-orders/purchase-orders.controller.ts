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
import { PurchaseOrdersService } from "./purchase-orders.service";
import { CreatePurchaseOrderDto, UpdatePurchaseOrderDto } from "./dto";
import { RolePermission } from "../../common/decorators/role-permission.decorator";
import { RequestWithUser } from "../../common/middleware/verify-token.middleware";
import { ModuleCode, OperationCode } from "../../common/enums";

@ApiTags("Purchase Orders")
@ApiBearerAuth("JWT-auth")
@Controller("purchase-orders")
export class PurchaseOrdersController {
  constructor(private readonly purchaseOrdersService: PurchaseOrdersService) {}

  @Post()
  @RolePermission(`${ModuleCode.PURCHASE_ORDER}:${OperationCode.CREATE}`)
  @ApiOperation({ summary: "Create a new purchase order" })
  @ApiResponse({
    status: 201,
    description: "Purchase order created successfully",
  })
  @ApiResponse({ status: 400, description: "Bad request" })
  @ApiResponse({ status: 404, description: "Vendor or Material not found" })
  @ApiResponse({
    status: 409,
    description: "Purchase order number already exists",
  })
  async create(
    @Body() createDto: CreatePurchaseOrderDto,
    @Req() req: RequestWithUser
  ) {
    try {
      const data = await this.purchaseOrdersService.create(
        req.user.tenantId,
        createDto,
        req.user.userId
      );
      return {
        success: true,
        message: "Purchase order created successfully",
        data,
      };
    } catch (error) {
      throw error;
    }
  }

  @Get()
  @RolePermission(
    `${ModuleCode.PURCHASE_ORDER}:${OperationCode.LIST}`,
    `${ModuleCode.PURCHASE_ORDER}:${OperationCode.READ}`
  )
  @ApiOperation({ summary: "Get all purchase orders" })
  @ApiResponse({
    status: 200,
    description: "Purchase orders retrieved successfully",
  })
  async findAll(@Req() req: RequestWithUser) {
    try {
      const data = await this.purchaseOrdersService.findAll(req.user.tenantId);
      return {
        success: true,
        message: "Purchase orders retrieved successfully",
        data,
      };
    } catch (error) {
      throw error;
    }
  }

  @Get("pending")
  @RolePermission(
    `${ModuleCode.PURCHASE_ORDER}:${OperationCode.LIST}`,
    `${ModuleCode.PURCHASE_ORDER}:${OperationCode.READ}`
  )
  @ApiOperation({ summary: "Get all pending purchase orders" })
  @ApiResponse({
    status: 200,
    description: "Pending purchase orders retrieved successfully",
  })
  async findPendingOrders(@Req() req: RequestWithUser) {
    try {
      const data = await this.purchaseOrdersService.findPendingOrders(
        req.user.tenantId
      );
      return {
        success: true,
        message: "Pending purchase orders retrieved successfully",
        data,
      };
    } catch (error) {
      throw error;
    }
  }

  @Get(":id")
  @RolePermission(`${ModuleCode.PURCHASE_ORDER}:${OperationCode.READ}`)
  @ApiOperation({ summary: "Get a purchase order by ID" })
  @ApiResponse({
    status: 200,
    description: "Purchase order retrieved successfully",
  })
  @ApiResponse({ status: 404, description: "Purchase order not found" })
  async findOne(
    @Param("id", ParseIntPipe) id: number,
    @Req() req: RequestWithUser
  ) {
    try {
      const data = await this.purchaseOrdersService.findOne(
        req.user.tenantId,
        id
      );
      return {
        success: true,
        message: "Purchase order retrieved successfully",
        data,
      };
    } catch (error) {
      throw error;
    }
  }

  @Put(":id")
  @RolePermission(
    `${ModuleCode.PURCHASE_ORDER}:${OperationCode.UPDATE}`,
    `${ModuleCode.PURCHASE_ORDER}:${OperationCode.EDIT}`
  )
  @ApiOperation({ summary: "Update a purchase order" })
  @ApiResponse({
    status: 200,
    description: "Purchase order updated successfully",
  })
  @ApiResponse({ status: 404, description: "Purchase order not found" })
  @ApiResponse({
    status: 409,
    description: "Purchase order number already exists",
  })
  async update(
    @Param("id", ParseIntPipe) id: number,
    @Body() updateDto: UpdatePurchaseOrderDto,
    @Req() req: RequestWithUser
  ) {
    try {
      const data = await this.purchaseOrdersService.update(
        req.user.tenantId,
        id,
        updateDto,
        req.user.userId
      );
      return {
        success: true,
        message: "Purchase order updated successfully",
        data,
      };
    } catch (error) {
      throw error;
    }
  }

  @Delete(":id")
  @RolePermission(`${ModuleCode.PURCHASE_ORDER}:${OperationCode.DELETE}`)
  @ApiOperation({ summary: "Delete a purchase order" })
  @ApiResponse({
    status: 200,
    description: "Purchase order deleted successfully",
  })
  @ApiResponse({ status: 404, description: "Purchase order not found" })
  async remove(
    @Param("id", ParseIntPipe) id: number,
    @Req() req: RequestWithUser
  ) {
    try {
      await this.purchaseOrdersService.remove(
        req.user.tenantId,
        id,
        req.user.userId
      );
      return {
        success: true,
        message: "Purchase order deleted successfully",
        data: null,
      };
    } catch (error) {
      throw error;
    }
  }

  @Patch(":id/status/:status")
  @RolePermission(
    `${ModuleCode.PURCHASE_ORDER}:${OperationCode.UPDATE}`,
    `${ModuleCode.PURCHASE_ORDER}:${OperationCode.EDIT}`
  )
  @ApiOperation({ summary: "Update purchase order status" })
  @ApiResponse({
    status: 200,
    description: "Purchase order status updated successfully",
  })
  @ApiResponse({ status: 404, description: "Purchase order not found" })
  async updateStatus(
    @Param("id", ParseIntPipe) id: number,
    @Param("status") status: string,
    @Req() req: RequestWithUser
  ) {
    try {
      const data = await this.purchaseOrdersService.updateStatus(
        req.user.tenantId,
        id,
        status,
        req.user.userId
      );
      return {
        success: true,
        message: `Purchase order status updated to ${status} successfully`,
        data,
      };
    } catch (error) {
      throw error;
    }
  }
}
