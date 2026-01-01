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
import { SubscriptionsService } from "./subscriptions.service";
import { CreateSubscriptionDto, UpdateSubscriptionDto } from "./dto";
import { RolePermission } from "../../common/decorators/role-permission.decorator";
import { RequestWithUser } from "../../common/middleware/verify-token.middleware";
import { ModuleCode, OperationCode } from "../../common/enums";

@ApiTags("Subscriptions")
@ApiBearerAuth("JWT-auth")
@Controller("subscriptions")
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @Post()
  @RolePermission(`${ModuleCode.Subscription}:${OperationCode.Create}`)
  @ApiOperation({ summary: "Create a new subscription" })
  @ApiResponse({
    status: 201,
    description: "Subscription created successfully",
  })
  @ApiResponse({ status: 400, description: "Bad request" })
  @ApiResponse({ status: 404, description: "Tenant or Plan not found" })
  @ApiResponse({
    status: 409,
    description: "Tenant already has a subscription",
  })
  async create(
    @Body() createSubscriptionDto: CreateSubscriptionDto,
    @Req() req: RequestWithUser
  ) {
    try {
      const data = await this.subscriptionsService.create(
        createSubscriptionDto,
        req.user.userId
      );
      return {
        success: true,
        message: "Subscription created successfully",
        data,
      };
    } catch (error) {
      throw error;
    }
  }

  @Get()
  @RolePermission(
    `${ModuleCode.Subscription}:${OperationCode.List}`,
    `${ModuleCode.Subscription}:${OperationCode.Read}`
  )
  @ApiOperation({ summary: "Get all subscriptions" })
  @ApiResponse({
    status: 200,
    description: "Subscriptions retrieved successfully",
  })
  async findAll() {
    try {
      const data = await this.subscriptionsService.findAll();
      return {
        success: true,
        message: "Subscriptions retrieved successfully",
        data,
      };
    } catch (error) {
      throw error;
    }
  }

  @Get(":id")
  @RolePermission(`${ModuleCode.Subscription}:${OperationCode.Read}`)
  @ApiOperation({ summary: "Get a subscription by ID" })
  @ApiResponse({
    status: 200,
    description: "Subscription retrieved successfully",
  })
  @ApiResponse({ status: 404, description: "Subscription not found" })
  async findOne(@Param("id", ParseIntPipe) id: number) {
    try {
      const data = await this.subscriptionsService.findOne(id);
      return {
        success: true,
        message: "Subscription retrieved successfully",
        data,
      };
    } catch (error) {
      throw error;
    }
  }

  @Get("tenant/:tenantId")
  @RolePermission(`${ModuleCode.Subscription}:${OperationCode.Read}`)
  @ApiOperation({ summary: "Get subscription by tenant ID" })
  @ApiResponse({
    status: 200,
    description: "Subscription retrieved successfully",
  })
  async findByTenantId(@Param("tenantId", ParseIntPipe) tenantId: number) {
    try {
      const data = await this.subscriptionsService.findByTenantId(tenantId);
      return {
        success: true,
        message: data
          ? "Subscription retrieved successfully"
          : "No subscription found for this tenant",
        data,
      };
    } catch (error) {
      throw error;
    }
  }

  @Put(":id")
  @RolePermission(
    `${ModuleCode.Subscription}:${OperationCode.Update}`,
    `${ModuleCode.Subscription}:${OperationCode.Edit}`
  )
  @ApiOperation({ summary: "Update a subscription" })
  @ApiResponse({
    status: 200,
    description: "Subscription updated successfully",
  })
  @ApiResponse({ status: 404, description: "Subscription not found" })
  async update(
    @Param("id", ParseIntPipe) id: number,
    @Body() updateSubscriptionDto: UpdateSubscriptionDto,
    @Req() req: RequestWithUser
  ) {
    try {
      const data = await this.subscriptionsService.update(
        id,
        updateSubscriptionDto,
        req.user.userId
      );
      return {
        success: true,
        message: "Subscription updated successfully",
        data,
      };
    } catch (error) {
      throw error;
    }
  }

  @Delete(":id")
  @RolePermission(`${ModuleCode.Subscription}:${OperationCode.Delete}`)
  @ApiOperation({ summary: "Delete a subscription" })
  @ApiResponse({
    status: 200,
    description: "Subscription deleted successfully",
  })
  @ApiResponse({ status: 404, description: "Subscription not found" })
  async remove(
    @Param("id", ParseIntPipe) id: number,
    @Req() req: RequestWithUser
  ) {
    try {
      await this.subscriptionsService.remove(id, req.user.userId);
      return {
        success: true,
        message: "Subscription deleted successfully",
        data: null,
      };
    } catch (error) {
      throw error;
    }
  }

  @Get("expiring/:days")
  @RolePermission(`${ModuleCode.Subscription}:${OperationCode.Read}`)
  @ApiOperation({ summary: "Get subscriptions expiring within specified days" })
  @ApiResponse({
    status: 200,
    description: "Expiring subscriptions retrieved successfully",
  })
  async getExpiringSubscriptions(@Param("days", ParseIntPipe) days: number) {
    try {
      const data =
        await this.subscriptionsService.getExpiringSubscriptions(days);
      return {
        success: true,
        message: `Subscriptions expiring within ${days} days retrieved successfully`,
        data,
      };
    } catch (error) {
      throw error;
    }
  }
}
