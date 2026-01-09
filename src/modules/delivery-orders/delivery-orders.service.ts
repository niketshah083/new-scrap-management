import {
  Injectable,
  NotFoundException,
  ConflictException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { DeliveryOrder } from "../../entities/delivery-order.entity";
import { DeliveryOrderItem } from "../../entities/delivery-order-item.entity";
import { Vendor } from "../../entities/vendor.entity";
import { Material } from "../../entities/material.entity";
import {
  CreateDeliveryOrderDto,
  UpdateDeliveryOrderDto,
  DeliveryOrderQueryDto,
  PaginatedResult,
} from "./dto";
import { DataSourceFactoryService, DeliveryOrderDto } from "../data-source";

@Injectable()
export class DeliveryOrdersService {
  constructor(
    @InjectRepository(DeliveryOrder)
    private deliveryOrderRepository: Repository<DeliveryOrder>,
    @InjectRepository(DeliveryOrderItem)
    private deliveryOrderItemRepository: Repository<DeliveryOrderItem>,
    @InjectRepository(Vendor)
    private vendorRepository: Repository<Vendor>,
    @InjectRepository(Material)
    private materialRepository: Repository<Material>,
    private dataSourceFactory: DataSourceFactoryService
  ) {}

  async create(
    tenantId: number,
    createDto: CreateDeliveryOrderDto,
    userId: number
  ): Promise<DeliveryOrder> {
    // Check if DO number already exists
    const existingDO = await this.deliveryOrderRepository.findOne({
      where: { doNumber: createDto.doNumber },
    });

    if (existingDO) {
      throw new ConflictException(
        "Delivery order with this number already exists"
      );
    }

    // Verify vendor exists and belongs to tenant
    const vendor = await this.vendorRepository.findOne({
      where: { id: createDto.vendorId, tenantId },
    });

    if (!vendor) {
      throw new NotFoundException(
        `Vendor with ID ${createDto.vendorId} not found`
      );
    }

    // Verify all materials exist and belong to tenant
    for (const item of createDto.items) {
      const material = await this.materialRepository.findOne({
        where: { id: item.materialId, tenantId },
      });

      if (!material) {
        throw new NotFoundException(
          `Material with ID ${item.materialId} not found`
        );
      }
    }

    // Calculate total amount
    let totalAmount = 0;
    const itemsWithAmount = createDto.items.map((item) => {
      const amount = item.quantity * item.rate;
      totalAmount += amount;
      return { ...item, amount };
    });

    // Create delivery order
    const deliveryOrder = this.deliveryOrderRepository.create({
      tenantId,
      doNumber: createDto.doNumber,
      vendorId: createDto.vendorId,
      doDate: new Date(createDto.doDate),
      vehicleNo: createDto.vehicleNo,
      grossWeight: createDto.grossWeight,
      tareWeight: createDto.tareWeight,
      netWeight: createDto.netWeight,
      totalAmount,
      remarks: createDto.remarks,
      createdBy: userId,
      updatedBy: userId,
    });

    const savedDO = await this.deliveryOrderRepository.save(deliveryOrder);

    // Create delivery order items
    const items = itemsWithAmount.map((item) =>
      this.deliveryOrderItemRepository.create({
        deliveryOrderId: savedDO.id,
        materialId: item.materialId,
        wbNetWeight: item.wbNetWeight,
        quantity: item.quantity,
        rate: item.rate,
        amount: item.amount,
        createdBy: userId,
        updatedBy: userId,
      })
    );

    await this.deliveryOrderItemRepository.save(items);

    return this.findOne(tenantId, savedDO.id);
  }

  /**
   * Find all delivery orders - uses external DB if configured
   */
  async findAllFromDataSource(tenantId: number): Promise<DeliveryOrderDto[]> {
    return this.dataSourceFactory.getDeliveryOrders(tenantId);
  }

  /**
   * Find all delivery orders with pagination - uses external DB if configured
   */
  async findAllFromDataSourcePaginated(
    tenantId: number,
    query: DeliveryOrderQueryDto
  ): Promise<PaginatedResult<DeliveryOrderDto>> {
    return this.dataSourceFactory.getDeliveryOrdersPaginated(tenantId, {
      page: query.page,
      limit: query.limit,
      search: query.search,
      vendorId: query.vendorId,
      startDate: query.startDate,
      endDate: query.endDate,
      sortField: query.sortField,
      sortOrder: query.sortOrder,
    });
  }

  /**
   * Find delivery orders by vendor - uses external DB if configured
   */
  async findByVendor(
    tenantId: number,
    vendorId: number
  ): Promise<DeliveryOrderDto[]> {
    return this.dataSourceFactory.getDeliveryOrdersByVendor(tenantId, vendorId);
  }

  async findAll(tenantId: number): Promise<DeliveryOrder[]> {
    return this.deliveryOrderRepository.find({
      where: { tenantId },
      relations: ["vendor", "items", "items.material"],
      order: { createdAt: "DESC" },
    });
  }

  async findOne(tenantId: number, id: number): Promise<DeliveryOrder> {
    const deliveryOrder = await this.deliveryOrderRepository.findOne({
      where: { id, tenantId },
      relations: ["vendor", "items", "items.material"],
    });

    if (!deliveryOrder) {
      throw new NotFoundException(`Delivery order with ID ${id} not found`);
    }

    return deliveryOrder;
  }

  async update(
    tenantId: number,
    id: number,
    updateDto: UpdateDeliveryOrderDto,
    userId: number
  ): Promise<DeliveryOrder> {
    const deliveryOrder = await this.findOne(tenantId, id);

    // Check if DO number is being changed and if it already exists
    if (updateDto.doNumber && updateDto.doNumber !== deliveryOrder.doNumber) {
      const existingDO = await this.deliveryOrderRepository.findOne({
        where: { doNumber: updateDto.doNumber },
      });

      if (existingDO) {
        throw new ConflictException(
          "Delivery order with this number already exists"
        );
      }
    }

    // Verify vendor if being changed
    if (updateDto.vendorId && updateDto.vendorId !== deliveryOrder.vendorId) {
      const vendor = await this.vendorRepository.findOne({
        where: { id: updateDto.vendorId, tenantId },
      });

      if (!vendor) {
        throw new NotFoundException(
          `Vendor with ID ${updateDto.vendorId} not found`
        );
      }
    }

    // Calculate total amount if items are provided
    let totalAmount = deliveryOrder.totalAmount;
    if (updateDto.items) {
      totalAmount = 0;
      updateDto.items.forEach((item) => {
        totalAmount += (item.quantity || 0) * (item.rate || 0);
      });
    }

    // Update delivery order fields
    Object.assign(deliveryOrder, {
      doNumber: updateDto.doNumber ?? deliveryOrder.doNumber,
      vendorId: updateDto.vendorId ?? deliveryOrder.vendorId,
      doDate: updateDto.doDate
        ? new Date(updateDto.doDate)
        : deliveryOrder.doDate,
      vehicleNo: updateDto.vehicleNo ?? deliveryOrder.vehicleNo,
      grossWeight: updateDto.grossWeight ?? deliveryOrder.grossWeight,
      tareWeight: updateDto.tareWeight ?? deliveryOrder.tareWeight,
      netWeight: updateDto.netWeight ?? deliveryOrder.netWeight,
      totalAmount,
      remarks: updateDto.remarks ?? deliveryOrder.remarks,
      updatedBy: userId,
    });

    await this.deliveryOrderRepository.save(deliveryOrder);

    // Update items if provided
    if (updateDto.items) {
      // Delete existing items
      await this.deliveryOrderItemRepository.delete({ deliveryOrderId: id });

      // Create new items
      const items = updateDto.items.map((item) => {
        const amount = (item.quantity || 0) * (item.rate || 0);
        return this.deliveryOrderItemRepository.create({
          deliveryOrderId: id,
          materialId: item.materialId,
          wbNetWeight: item.wbNetWeight,
          quantity: item.quantity,
          rate: item.rate,
          amount,
          createdBy: userId,
          updatedBy: userId,
        });
      });

      await this.deliveryOrderItemRepository.save(items);
    }

    return this.findOne(tenantId, id);
  }

  async remove(tenantId: number, id: number, userId: number): Promise<void> {
    const deliveryOrder = await this.findOne(tenantId, id);

    deliveryOrder.deletedBy = userId;
    await this.deliveryOrderRepository.save(deliveryOrder);

    await this.deliveryOrderRepository.softRemove(deliveryOrder);
  }

  /**
   * Check if external DB is enabled for this tenant
   */
  async isExternalDbEnabled(tenantId: number): Promise<boolean> {
    return this.dataSourceFactory.isExternalDbEnabled(tenantId);
  }
}
