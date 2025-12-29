import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, IsNull, LessThan } from "typeorm";
import { Notification } from "../../entities/notification.entity";
import {
  CreateNotificationDto,
  NotificationType,
  NotificationPriority,
} from "./dto";

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private notificationRepository: Repository<Notification>
  ) {}

  async create(
    tenantId: number | null,
    createDto: CreateNotificationDto,
    createdByUserId: number
  ): Promise<Notification> {
    const notification = this.notificationRepository.create({
      tenantId,
      userId: createDto.userId,
      type: createDto.type,
      title: createDto.title,
      message: createDto.message,
      metadata: createDto.metadata,
      priority: createDto.priority || NotificationPriority.INFO,
      isRead: false,
      createdBy: createdByUserId,
      updatedBy: createdByUserId,
    });

    return this.notificationRepository.save(notification);
  }

  // Create notification for GRN status change
  async createGRNStatusNotification(
    tenantId: number,
    grnId: number,
    grnNumber: string,
    status: string,
    userId?: number
  ): Promise<Notification> {
    const statusMessages: Record<string, string> = {
      approved: `GRN #${grnNumber} has been approved`,
      rejected: `GRN #${grnNumber} has been rejected`,
      completed: `GRN #${grnNumber} has been completed`,
    };

    return this.create(
      tenantId,
      {
        userId,
        type: NotificationType.GRN_STATUS,
        title: `GRN ${status.charAt(0).toUpperCase() + status.slice(1)}`,
        message:
          statusMessages[status] || `GRN #${grnNumber} status: ${status}`,
        metadata: { entityType: "grn", entityId: grnId },
        priority:
          status === "rejected"
            ? NotificationPriority.WARNING
            : NotificationPriority.INFO,
      },
      0
    );
  }

  // Create notification for gate pass expiry
  async createGatePassExpiryNotification(
    tenantId: number,
    gatePassId: number,
    passNumber: string,
    expiresAt: Date
  ): Promise<Notification> {
    return this.create(
      tenantId,
      {
        type: NotificationType.GATE_PASS_EXPIRY,
        title: "Gate Pass Expiring Soon",
        message: `Gate pass #${passNumber} will expire at ${expiresAt.toLocaleString()}`,
        metadata: { entityType: "gate_pass", entityId: gatePassId },
        priority: NotificationPriority.WARNING,
      },
      0
    );
  }

  // Create notification for QC result
  async createQCResultNotification(
    tenantId: number,
    qcId: number,
    inspectionNumber: string,
    result: string,
    userId?: number
  ): Promise<Notification> {
    return this.create(
      tenantId,
      {
        userId,
        type: NotificationType.QC_RESULT,
        title: `QC Inspection ${result === "pass" ? "Passed" : "Failed"}`,
        message: `QC inspection #${inspectionNumber} has ${result === "pass" ? "passed" : "failed"}`,
        metadata: { entityType: "qc_inspection", entityId: qcId },
        priority:
          result === "fail"
            ? NotificationPriority.WARNING
            : NotificationPriority.INFO,
      },
      0
    );
  }

  // Create notification for subscription expiry
  async createSubscriptionExpiryNotification(
    tenantId: number,
    daysRemaining: number
  ): Promise<Notification> {
    return this.create(
      tenantId,
      {
        type: NotificationType.SUBSCRIPTION_EXPIRY,
        title: "Subscription Expiring Soon",
        message: `Your subscription will expire in ${daysRemaining} day(s). Please renew to continue using the service.`,
        metadata: { daysRemaining },
        priority:
          daysRemaining <= 3
            ? NotificationPriority.CRITICAL
            : NotificationPriority.WARNING,
      },
      0
    );
  }

  // Get notifications for a user (tenant-scoped + user-specific)
  async findForUser(
    tenantId: number,
    userId: number,
    limit: number = 50
  ): Promise<Notification[]> {
    return this.notificationRepository
      .createQueryBuilder("n")
      .where("n.tenant_id = :tenantId", { tenantId })
      .andWhere("(n.user_id = :userId OR n.user_id IS NULL)", { userId })
      .orderBy("n.created_at", "DESC")
      .take(limit)
      .getMany();
  }

  // Get unread notifications for a user
  async findUnreadForUser(
    tenantId: number,
    userId: number
  ): Promise<Notification[]> {
    return this.notificationRepository
      .createQueryBuilder("n")
      .where("n.tenant_id = :tenantId", { tenantId })
      .andWhere("(n.user_id = :userId OR n.user_id IS NULL)", { userId })
      .andWhere("n.is_read = :isRead", { isRead: false })
      .orderBy("n.created_at", "DESC")
      .getMany();
  }

  // Get unread count for a user
  async getUnreadCount(tenantId: number, userId: number): Promise<number> {
    return this.notificationRepository
      .createQueryBuilder("n")
      .where("n.tenant_id = :tenantId", { tenantId })
      .andWhere("(n.user_id = :userId OR n.user_id IS NULL)", { userId })
      .andWhere("n.is_read = :isRead", { isRead: false })
      .getCount();
  }

  // Mark notification as read
  async markAsRead(
    tenantId: number,
    userId: number,
    id: number
  ): Promise<Notification> {
    const notification = await this.notificationRepository.findOne({
      where: { id, tenantId },
    });

    if (!notification) {
      throw new NotFoundException(`Notification with ID ${id} not found`);
    }

    // Verify user can access this notification
    if (notification.userId && notification.userId !== userId) {
      throw new NotFoundException(`Notification with ID ${id} not found`);
    }

    notification.isRead = true;
    notification.readAt = new Date();
    notification.updatedBy = userId;

    return this.notificationRepository.save(notification);
  }

  // Mark all notifications as read for a user
  async markAllAsRead(tenantId: number, userId: number): Promise<number> {
    const result = await this.notificationRepository
      .createQueryBuilder()
      .update(Notification)
      .set({ isRead: true, readAt: new Date(), updatedBy: userId })
      .where("tenant_id = :tenantId", { tenantId })
      .andWhere("(user_id = :userId OR user_id IS NULL)", { userId })
      .andWhere("is_read = :isRead", { isRead: false })
      .execute();

    return result.affected || 0;
  }

  // Delete old notifications (cleanup)
  async deleteOldNotifications(daysOld: number = 30): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const result = await this.notificationRepository.delete({
      createdAt: LessThan(cutoffDate),
      isRead: true,
    });

    return result.affected || 0;
  }
}
