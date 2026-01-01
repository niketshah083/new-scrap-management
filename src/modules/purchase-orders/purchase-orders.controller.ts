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
import {
  CreatePurchaseOrderDto,
  UpdatePurchaseOrderDto,
  RejectPurchaseOrderDto,
} from "./dto";
import { RolePermission } from "../../common/decorators/role-permission.decorator";
import { RequestWithUser } from "../../common/middleware/verify-token.middleware";
import { ModuleCode, OperationCode } from "../../common/enums";

@ApiTags("Purchase Orders")
@ApiBearerAuth("JWT-auth")
@Controller("purchase-orders")
export class PurchaseOrdersController {
  constructor(private readonly purchaseOrdersService: PurchaseOrdersService) {}

  @Post()
  @RolePermission(`${ModuleCode.PurchaseOrder}:${OperationCode.Create}`)
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
    `${ModuleCode.PurchaseOrder}:${OperationCode.List}`,
    `${ModuleCode.PurchaseOrder}:${OperationCode.Read}`
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
    `${ModuleCode.PurchaseOrder}:${OperationCode.List}`,
    `${ModuleCode.PurchaseOrder}:${OperationCode.Read}`
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
  @RolePermission(`${ModuleCode.PurchaseOrder}:${OperationCode.Read}`)
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
    `${ModuleCode.PurchaseOrder}:${OperationCode.Update}`,
    `${ModuleCode.PurchaseOrder}:${OperationCode.Edit}`
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
  @RolePermission(`${ModuleCode.PurchaseOrder}:${OperationCode.Delete}`)
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
    `${ModuleCode.PurchaseOrder}:${OperationCode.Update}`,
    `${ModuleCode.PurchaseOrder}:${OperationCode.Edit}`
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

  @Patch(":id/submit-for-approval")
  @RolePermission(
    `${ModuleCode.PurchaseOrder}:${OperationCode.Update}`,
    `${ModuleCode.PurchaseOrder}:${OperationCode.Edit}`
  )
  @ApiOperation({ summary: "Submit purchase order for approval" })
  @ApiResponse({
    status: 200,
    description: "Purchase order submitted for approval successfully",
  })
  @ApiResponse({ status: 400, description: "Invalid status transition" })
  @ApiResponse({ status: 404, description: "Purchase order not found" })
  async submitForApproval(
    @Param("id", ParseIntPipe) id: number,
    @Req() req: RequestWithUser
  ) {
    try {
      const data = await this.purchaseOrdersService.submitForApproval(
        req.user.tenantId,
        id,
        req.user.userId
      );
      return {
        success: true,
        message: "Purchase order submitted for approval successfully",
        data,
      };
    } catch (error) {
      throw error;
    }
  }

  @Patch(":id/approve")
  @RolePermission(`${ModuleCode.PurchaseOrder}:${OperationCode.Approve}`)
  @ApiOperation({ summary: "Approve purchase order" })
  @ApiResponse({
    status: 200,
    description: "Purchase order approved successfully",
  })
  @ApiResponse({ status: 400, description: "Invalid status transition" })
  @ApiResponse({ status: 404, description: "Purchase order not found" })
  async approve(
    @Param("id", ParseIntPipe) id: number,
    @Req() req: RequestWithUser
  ) {
    try {
      const data = await this.purchaseOrdersService.approve(
        req.user.tenantId,
        id,
        req.user.userId
      );
      return {
        success: true,
        message: "Purchase order approved successfully",
        data,
      };
    } catch (error) {
      throw error;
    }
  }

  @Patch(":id/reject")
  @RolePermission(`${ModuleCode.PurchaseOrder}:${OperationCode.Approve}`)
  @ApiOperation({ summary: "Reject purchase order" })
  @ApiResponse({
    status: 200,
    description: "Purchase order rejected successfully",
  })
  @ApiResponse({
    status: 400,
    description: "Invalid status transition or missing rejection reason",
  })
  @ApiResponse({ status: 404, description: "Purchase order not found" })
  async reject(
    @Param("id", ParseIntPipe) id: number,
    @Body() rejectDto: RejectPurchaseOrderDto,
    @Req() req: RequestWithUser
  ) {
    try {
      const data = await this.purchaseOrdersService.reject(
        req.user.tenantId,
        id,
        req.user.userId,
        rejectDto.rejectionReason
      );
      return {
        success: true,
        message: "Purchase order rejected successfully",
        data,
      };
    } catch (error) {
      throw error;
    }
  }

  @Get("approved/list")
  @RolePermission(
    `${ModuleCode.PurchaseOrder}:${OperationCode.List}`,
    `${ModuleCode.PurchaseOrder}:${OperationCode.Read}`
  )
  @ApiOperation({
    summary: "Get all approved purchase orders (for GRN creation)",
  })
  @ApiResponse({
    status: 200,
    description: "Approved purchase orders retrieved successfully",
  })
  async findApprovedOrders(@Req() req: RequestWithUser) {
    try {
      const data = await this.purchaseOrdersService.findApprovedOrders(
        req.user.tenantId
      );
      return {
        success: true,
        message: "Approved purchase orders retrieved successfully",
        data,
      };
    } catch (error) {
      throw error;
    }
  }
}
