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
import { NotificationsService } from "./notifications.service";
import { CreateNotificationDto } from "./dto";
import { RolePermission } from "../../common/decorators/role-permission.decorator";
import { RequestWithUser } from "../../common/middleware/verify-token.middleware";
import { ModuleCode, OperationCode } from "../../common/enums";

@ApiTags("Notifications")
@ApiBearerAuth("JWT-auth")
@Controller("notifications")
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Post()
  @RolePermission(`${ModuleCode.Notification}:${OperationCode.Create}`)
  @ApiOperation({ summary: "Create a new notification" })
  @ApiResponse({
    status: 201,
    description: "Notification created successfully",
  })
  async create(
    @Body() createDto: CreateNotificationDto,
    @Req() req: RequestWithUser
  ) {
    try {
      const data = await this.notificationsService.create(
        req.user.tenantId,
        createDto,
        req.user.userId
      );
      return {
        success: true,
        message: "Notification created successfully",
        data,
      };
    } catch (error) {
      throw error;
    }
  }

  @Get()
  @ApiOperation({ summary: "Get notifications for current user" })
  @ApiQuery({ name: "limit", required: false, type: Number, example: 50 })
  @ApiResponse({
    status: 200,
    description: "Notifications retrieved successfully",
  })
  async findForUser(
    @Query("limit") limit: string,
    @Req() req: RequestWithUser
  ) {
    const parsedLimit = limit ? parseInt(limit, 10) : 50;
    try {
      const data = await this.notificationsService.findForUser(
        req.user.tenantId,
        req.user.userId,
        parsedLimit
      );
      return {
        success: true,
        message: "Notifications retrieved successfully",
        data,
      };
    } catch (error) {
      throw error;
    }
  }

  @Get("unread")
  @ApiOperation({ summary: "Get unread notifications for current user" })
  @ApiResponse({
    status: 200,
    description: "Unread notifications retrieved successfully",
  })
  async findUnreadForUser(@Req() req: RequestWithUser) {
    try {
      const data = await this.notificationsService.findUnreadForUser(
        req.user.tenantId,
        req.user.userId
      );
      return {
        success: true,
        message: "Unread notifications retrieved successfully",
        data,
      };
    } catch (error) {
      throw error;
    }
  }

  @Get("unread/count")
  @ApiOperation({ summary: "Get unread notification count for current user" })
  @ApiResponse({
    status: 200,
    description: "Unread count retrieved successfully",
  })
  async getUnreadCount(@Req() req: RequestWithUser) {
    try {
      const count = await this.notificationsService.getUnreadCount(
        req.user.tenantId,
        req.user.userId
      );
      return {
        success: true,
        message: "Unread count retrieved successfully",
        data: { count },
      };
    } catch (error) {
      throw error;
    }
  }

  @Put(":id/read")
  @ApiOperation({ summary: "Mark a notification as read" })
  @ApiResponse({ status: 200, description: "Notification marked as read" })
  @ApiResponse({ status: 404, description: "Notification not found" })
  async markAsRead(
    @Param("id", ParseIntPipe) id: number,
    @Req() req: RequestWithUser
  ) {
    try {
      const data = await this.notificationsService.markAsRead(
        req.user.tenantId,
        req.user.userId,
        id
      );
      return {
        success: true,
        message: "Notification marked as read",
        data,
      };
    } catch (error) {
      throw error;
    }
  }

  @Put("read-all")
  @ApiOperation({ summary: "Mark all notifications as read" })
  @ApiResponse({ status: 200, description: "All notifications marked as read" })
  async markAllAsRead(@Req() req: RequestWithUser) {
    try {
      const count = await this.notificationsService.markAllAsRead(
        req.user.tenantId,
        req.user.userId
      );
      return {
        success: true,
        message: `${count} notification(s) marked as read`,
        data: { updatedCount: count },
      };
    } catch (error) {
      throw error;
    }
  }
}
