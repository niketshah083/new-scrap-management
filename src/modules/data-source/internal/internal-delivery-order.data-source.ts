import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, In } from "typeorm";
import { DeliveryOrder } from "../../../entities/delivery-order.entity";
import { IDeliveryOrderDataSource, DeliveryOrderDto } from "../interfaces";

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
