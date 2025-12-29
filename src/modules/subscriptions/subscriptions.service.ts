import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, LessThan } from "typeorm";
import { Subscription } from "../../entities/subscription.entity";
import { Tenant } from "../../entities/tenant.entity";
import { Plan } from "../../entities/plan.entity";
import { CreateSubscriptionDto, UpdateSubscriptionDto } from "./dto";
import { SubscriptionStatus } from "./dto/create-subscription.dto";

@Injectable()
export class SubscriptionsService {
  constructor(
    @InjectRepository(Subscription)
    private subscriptionRepository: Repository<Subscription>,
    @InjectRepository(Tenant)
    private tenantRepository: Repository<Tenant>,
    @InjectRepository(Plan)
    private planRepository: Repository<Plan>,
  ) {}

  async create(
    createSubscriptionDto: CreateSubscriptionDto,
    userId: number,
  ): Promise<Subscription> {
    // Check if tenant exists
    const tenant = await this.tenantRepository.findOne({
      where: { id: createSubscriptionDto.tenantId },
    });

    if (!tenant) {
      throw new NotFoundException(
        `Tenant with ID ${createSubscriptionDto.tenantId} not found`,
      );
    }

    // Check if plan exists
    const plan = await this.planRepository.findOne({
      where: { id: createSubscriptionDto.planId },
    });

    if (!plan) {
      throw new NotFoundException(
        `Plan with ID ${createSubscriptionDto.planId} not found`,
      );
    }

    // Check if tenant already has an active subscription
    const existingSubscription = await this.subscriptionRepository.findOne({
      where: { tenantId: createSubscriptionDto.tenantId },
    });

    if (existingSubscription) {
      throw new ConflictException(
        "Tenant already has a subscription. Update the existing subscription instead.",
      );
    }

    // Validate dates
    const startDate = new Date(createSubscriptionDto.startDate);
    const endDate = new Date(createSubscriptionDto.endDate);

    if (endDate <= startDate) {
      throw new BadRequestException("End date must be after start date");
    }

    const subscription = this.subscriptionRepository.create({
      ...createSubscriptionDto,
      startDate,
      endDate,
      status: createSubscriptionDto.status || SubscriptionStatus.ACTIVE,
      createdBy: userId,
      updatedBy: userId,
    });

    return this.subscriptionRepository.save(subscription);
  }

  async findAll(): Promise<Subscription[]> {
    return this.subscriptionRepository.find({
      relations: ["tenant", "plan"],
      order: { createdAt: "DESC" },
    });
  }

  async findOne(id: number): Promise<Subscription> {
    const subscription = await this.subscriptionRepository.findOne({
      where: { id },
      relations: ["tenant", "plan"],
    });

    if (!subscription) {
      throw new NotFoundException(`Subscription with ID ${id} not found`);
    }

    return subscription;
  }

  async findByTenantId(tenantId: number): Promise<Subscription | null> {
    return this.subscriptionRepository.findOne({
      where: { tenantId },
      relations: ["tenant", "plan", "plan.modules"],
    });
  }

  async update(
    id: number,
    updateSubscriptionDto: UpdateSubscriptionDto,
    userId: number,
  ): Promise<Subscription> {
    const subscription = await this.findOne(id);

    // If plan is being changed, verify it exists
    if (updateSubscriptionDto.planId) {
      const plan = await this.planRepository.findOne({
        where: { id: updateSubscriptionDto.planId },
      });

      if (!plan) {
        throw new NotFoundException(
          `Plan with ID ${updateSubscriptionDto.planId} not found`,
        );
      }
    }

    // Validate dates if both are provided
    const startDate = updateSubscriptionDto.startDate
      ? new Date(updateSubscriptionDto.startDate)
      : subscription.startDate;
    const endDate = updateSubscriptionDto.endDate
      ? new Date(updateSubscriptionDto.endDate)
      : subscription.endDate;

    if (endDate <= startDate) {
      throw new BadRequestException("End date must be after start date");
    }

    Object.assign(subscription, {
      ...updateSubscriptionDto,
      startDate: updateSubscriptionDto.startDate
        ? new Date(updateSubscriptionDto.startDate)
        : subscription.startDate,
      endDate: updateSubscriptionDto.endDate
        ? new Date(updateSubscriptionDto.endDate)
        : subscription.endDate,
      updatedBy: userId,
    });

    return this.subscriptionRepository.save(subscription);
  }

  async remove(id: number, userId: number): Promise<void> {
    const subscription = await this.findOne(id);

    subscription.deletedBy = userId;
    await this.subscriptionRepository.save(subscription);

    await this.subscriptionRepository.softRemove(subscription);
  }

  /**
   * Check if a tenant's subscription is valid (active and not expired)
   */
  async isSubscriptionValid(tenantId: number): Promise<boolean> {
    const subscription = await this.subscriptionRepository.findOne({
      where: { tenantId },
    });

    if (!subscription) {
      return false;
    }

    const now = new Date();
    const endDate = new Date(subscription.endDate);

    return subscription.status === SubscriptionStatus.ACTIVE && endDate > now;
  }

  /**
   * Update expired subscriptions status
   */
  async updateExpiredSubscriptions(): Promise<number> {
    const now = new Date();

    const result = await this.subscriptionRepository.update(
      {
        status: SubscriptionStatus.ACTIVE,
        endDate: LessThan(now),
      },
      {
        status: SubscriptionStatus.EXPIRED,
      },
    );

    return result.affected || 0;
  }

  /**
   * Get subscriptions expiring within specified days
   */
  async getExpiringSubscriptions(days: number): Promise<Subscription[]> {
    const now = new Date();
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);

    return this.subscriptionRepository
      .createQueryBuilder("subscription")
      .leftJoinAndSelect("subscription.tenant", "tenant")
      .leftJoinAndSelect("subscription.plan", "plan")
      .where("subscription.status = :status", {
        status: SubscriptionStatus.ACTIVE,
      })
      .andWhere("subscription.endDate > :now", { now })
      .andWhere("subscription.endDate <= :futureDate", { futureDate })
      .getMany();
  }
}
