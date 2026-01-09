import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import {
  Repository,
  In,
  Like,
  Between,
  MoreThanOrEqual,
  LessThanOrEqual,
} from "typeorm";
import { DeliveryOrder } from "../../../entities/delivery-order.entity";
import {
  IDeliveryOrderDataSource,
  DeliveryOrderDto,
  PaginatedResult,
  PaginationQuery,
} from "../interfaces";

/**
 * Internal Delivery Order Data Source
 * Fetches delivery order data from the internal database
 */
@Injectable()
export class InternalDeliveryOrderDataSource implements IDeliveryOrderDataSource {
  private readonly logger = new Logger(InternalDeliveryOrderDataSource.name);

  constructor(
    @InjectRepository(DeliveryOrder)
    private readonly deliveryOrderRepository: Repository<DeliveryOrder>
  ) {}

  /**
   * Find all delivery orders from internal database with pagination
   */
  async findAllPaginated(
    tenantId: number,
    query: PaginationQuery
  ): Promise<PaginatedResult<DeliveryOrderDto>> {
    const page = query.page || 1;
    const limit = query.limit || 10;
    const skip = (page - 1) * limit;

    const queryBuilder = this.deliveryOrderRepository
      .createQueryBuilder("do")
      .leftJoinAndSelect("do.vendor", "vendor")
      .leftJoinAndSelect("do.items", "items")
      .leftJoinAndSelect("items.material", "material")
      .where("do.tenantId = :tenantId", { tenantId });

    // Apply search filter
    if (query.search) {
      queryBuilder.andWhere(
        "(do.doNumber LIKE :search OR vendor.companyName LIKE :search OR do.vehicleNo LIKE :search)",
        { search: `%${query.search}%` }
      );
    }

    // Apply vendor filter
    if (query.vendorId) {
      queryBuilder.andWhere("do.vendorId = :vendorId", {
        vendorId: query.vendorId,
      });
    }

    // Apply date range filter
    if (query.startDate) {
      queryBuilder.andWhere("do.doDate >= :startDate", {
        startDate: query.startDate,
      });
    }
    if (query.endDate) {
      queryBuilder.andWhere("do.doDate <= :endDate", {
        endDate: query.endDate,
      });
    }

    // Apply sorting
    const sortField = query.sortField || "doDate";
    const sortOrder = query.sortOrder?.toUpperCase() === "ASC" ? "ASC" : "DESC";

    // Map sort field to actual column
    const sortFieldMap: Record<string, string> = {
      doNumber: "do.doNumber",
      doDate: "do.doDate",
      vendorName: "vendor.companyName",
      vehicleNo: "do.vehicleNo",
      totalAmount: "do.totalAmount",
      netWeight: "do.netWeight",
      createdAt: "do.createdAt",
    };

    const actualSortField = sortFieldMap[sortField] || "do.doDate";
    queryBuilder.orderBy(actualSortField, sortOrder as "ASC" | "DESC");

    // Get total count
    const total = await queryBuilder.getCount();

    // Apply pagination
    queryBuilder.skip(skip).take(limit);

    // Execute query
    const deliveryOrders = await queryBuilder.getMany();

    return {
      data: deliveryOrders.map((dOrder) => this.mapToDto(dOrder)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Find all delivery orders from internal database
   */
  async findAll(
    tenantId: number,
    filters?: Record<string, any>
  ): Promise<DeliveryOrderDto[]> {
    const whereClause: any = { tenantId };

    if (filters?.vendorId) {
      whereClause.vendorId = filters.vendorId;
    }

    const deliveryOrders = await this.deliveryOrderRepository.find({
      where: whereClause,
      relations: ["vendor", "items", "items.material"],
      order: { createdAt: "DESC" },
    });

    return deliveryOrders.map((dOrder) => this.mapToDto(dOrder));
  }

  /**
   * Find a single delivery order by ID from internal database
   */
  async findOne(
    tenantId: number,
    id: number | string
  ): Promise<DeliveryOrderDto | null> {
    const deliveryOrder = await this.deliveryOrderRepository.findOne({
      where: { id: Number(id), tenantId },
      relations: ["vendor", "items", "items.material"],
    });

    if (!deliveryOrder) {
      return null;
    }

    return this.mapToDto(deliveryOrder);
  }

  /**
   * Find multiple delivery orders by IDs from internal database
   */
  async findByIds(
    tenantId: number,
    ids: (number | string)[]
  ): Promise<DeliveryOrderDto[]> {
    if (ids.length === 0) {
      return [];
    }

    const numericIds = ids.map((id) => Number(id));
    const deliveryOrders = await this.deliveryOrderRepository.find({
      where: { id: In(numericIds), tenantId },
      relations: ["vendor", "items", "items.material"],
    });

    return deliveryOrders.map((dOrder) => this.mapToDto(dOrder));
  }

  /**
   * Find delivery orders by vendor ID from internal database
   */
  async findByVendorId(
    tenantId: number,
    vendorId: number | string
  ): Promise<DeliveryOrderDto[]> {
    const deliveryOrders = await this.deliveryOrderRepository.find({
      where: { tenantId, vendorId: Number(vendorId) },
      relations: ["vendor", "items", "items.material"],
      order: { createdAt: "DESC" },
    });

    return deliveryOrders.map((dOrder) => this.mapToDto(dOrder));
  }

  /**
   * Map internal DeliveryOrder entity to DeliveryOrderDto
   */
  private mapToDto(deliveryOrder: DeliveryOrder): DeliveryOrderDto {
    return {
      id: deliveryOrder.id,
      doNumber: deliveryOrder.doNumber,
      vendorId: deliveryOrder.vendorId,
      vendorName: deliveryOrder.vendor?.companyName,
      doDate: deliveryOrder.doDate,
      vehicleNo: deliveryOrder.vehicleNo,
      grossWeight: deliveryOrder.grossWeight,
      tareWeight: deliveryOrder.tareWeight,
      netWeight: deliveryOrder.netWeight,
      totalAmount: deliveryOrder.totalAmount,
      remarks: deliveryOrder.remarks,
      items: deliveryOrder.items?.map((item) => ({
        id: item.id,
        materialId: item.materialId,
        materialName: item.material?.name,
        wbNetWeight: item.wbNetWeight,
        quantity: item.quantity,
        rate: item.rate,
        amount: item.amount,
      })),
      isExternal: false,
    };
  }
}
