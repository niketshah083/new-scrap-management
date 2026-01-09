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
import { DeliveryOrdersService } from "./delivery-orders.service";
import { CreateDeliveryOrderDto, UpdateDeliveryOrderDto } from "./dto";
import { RolePermission } from "../../common/decorators/role-permission.decorator";
import { RequestWithUser } from "../../common/middleware/verify-token.middleware";
import { ModuleCode } from "../../common/enums/modules.enum";
import { OperationCode } from "../../common/enums/operations.enum";

@ApiTags("Delivery Orders")
@ApiBearerAuth("JWT-auth")
@Controller("delivery-orders")
export class DeliveryOrdersController {
  constructor(private readonly deliveryOrdersService: DeliveryOrdersService) {}

  @Post()
  @RolePermission(`${ModuleCode.DeliveryOrder}:${OperationCode.Create}`)
  @ApiOperation({ summary: "Create a new delivery order" })
  @ApiResponse({
    status: 201,
    description: "Delivery order created successfully",
  })
  @ApiResponse({ status: 400, description: "Bad request" })
  @ApiResponse({
    status: 409,
    description: "Delivery order with this number already exists",
  })
  async create(
    @Body() createDto: CreateDeliveryOrderDto,
    @Req() req: RequestWithUser
  ) {
    try {
      const data = await this.deliveryOrdersService.create(
        req.user.tenantId,
        createDto,
        req.user.userId
      );
      return {
        success: true,
        message: "Delivery order created successfully",
        data,
      };
    } catch (error) {
      throw error;
    }
  }

  @Get()
  @RolePermission(`${ModuleCode.DeliveryOrder}:${OperationCode.List}`)
  @ApiOperation({ summary: "Get all delivery orders" })
  @ApiResponse({
    status: 200,
    description: "Delivery orders retrieved successfully",
  })
  async findAll(@Req() req: RequestWithUser) {
    try {
      const data = await this.deliveryOrdersService.findAll(req.user.tenantId);
      return {
        success: true,
        message: "Delivery orders retrieved successfully",
        data,
      };
    } catch (error) {
      throw error;
    }
  }

  @Get("from-data-source")
  @RolePermission(`${ModuleCode.DeliveryOrder}:${OperationCode.List}`)
  @ApiOperation({
    summary: "Get all delivery orders from data source (internal or external)",
  })
  @ApiResponse({
    status: 200,
    description: "Delivery orders retrieved successfully",
  })
  async findAllFromDataSource(@Req() req: RequestWithUser) {
    try {
      const data = await this.deliveryOrdersService.findAllFromDataSource(
        req.user.tenantId
      );
      return {
        success: true,
        message: "Delivery orders retrieved successfully",
        data,
      };
    } catch (error) {
      throw error;
    }
  }

  @Get("vendor/:vendorId")
  @RolePermission(`${ModuleCode.DeliveryOrder}:${OperationCode.List}`)
  @ApiOperation({ summary: "Get delivery orders by vendor" })
  @ApiResponse({
    status: 200,
    description: "Delivery orders retrieved successfully",
  })
  async findByVendor(
    @Param("vendorId", ParseIntPipe) vendorId: number,
    @Req() req: RequestWithUser
  ) {
    try {
      const data = await this.deliveryOrdersService.findByVendor(
        req.user.tenantId,
        vendorId
      );
      return {
        success: true,
        message: "Delivery orders retrieved successfully",
        data,
      };
    } catch (error) {
      throw error;
    }
  }

  @Get(":id")
  @RolePermission(`${ModuleCode.DeliveryOrder}:${OperationCode.Read}`)
  @ApiOperation({ summary: "Get a delivery order by ID" })
  @ApiResponse({
    status: 200,
    description: "Delivery order retrieved successfully",
  })
  @ApiResponse({ status: 404, description: "Delivery order not found" })
  async findOne(
    @Param("id", ParseIntPipe) id: number,
    @Req() req: RequestWithUser
  ) {
    try {
      const data = await this.deliveryOrdersService.findOne(
        req.user.tenantId,
        id
      );
      return {
        success: true,
        message: "Delivery order retrieved successfully",
        data,
      };
    } catch (error) {
      throw error;
    }
  }

  @Put(":id")
  @RolePermission(`${ModuleCode.DeliveryOrder}:${OperationCode.Update}`)
  @ApiOperation({ summary: "Update a delivery order" })
  @ApiResponse({
    status: 200,
    description: "Delivery order updated successfully",
  })
  @ApiResponse({ status: 404, description: "Delivery order not found" })
  @ApiResponse({
    status: 409,
    description: "Delivery order with this number already exists",
  })
  async update(
    @Param("id", ParseIntPipe) id: number,
    @Body() updateDto: UpdateDeliveryOrderDto,
    @Req() req: RequestWithUser
  ) {
    try {
      const data = await this.deliveryOrdersService.update(
        req.user.tenantId,
        id,
        updateDto,
        req.user.userId
      );
      return {
        success: true,
        message: "Delivery order updated successfully",
        data,
      };
    } catch (error) {
      throw error;
    }
  }

  @Delete(":id")
  @RolePermission(`${ModuleCode.DeliveryOrder}:${OperationCode.Delete}`)
  @ApiOperation({ summary: "Delete a delivery order" })
  @ApiResponse({
    status: 200,
    description: "Delivery order deleted successfully",
  })
  @ApiResponse({ status: 404, description: "Delivery order not found" })
  async remove(
    @Param("id", ParseIntPipe) id: number,
    @Req() req: RequestWithUser
  ) {
    try {
      await this.deliveryOrdersService.remove(
        req.user.tenantId,
        id,
        req.user.userId
      );
      return {
        success: true,
        message: "Delivery order deleted successfully",
        data: null,
      };
    } catch (error) {
      throw error;
    }
  }
}
