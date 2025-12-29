import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, In } from "typeorm";
import { PurchaseOrder } from "../../../entities/purchase-order.entity";
import { IPurchaseOrderDataSource, PurchaseOrderDto } from "../interfaces";

/**
 * Internal Purchase Order Data Source
 * Fetches purchase order data from the internal application database
 */
@Injectable()
export class InternalPurchaseOrderDataSource implements IPurchaseOrderDataSource {
  constructor(
    @InjectRepository(PurchaseOrder)
    private readonly purchaseOrderRepository: Repository<PurchaseOrder>
  ) {}

  /**
   * Find all purchase orders for a tenant
   */
  async findAll(
    tenantId: number,
    filters?: Record<string, any>
  ): Promise<PurchaseOrderDto[]> {
    const queryBuilder = this.purchaseOrderRepository
      .createQueryBuilder("po")
      .where("po.tenantId = :tenantId", { tenantId });

    if (filters?.vendorId) {
      queryBuilder.andWhere("po.vendorId = :vendorId", {
        vendorId: filters.vendorId,
      });
    }

    if (filters?.status) {
      queryBuilder.andWhere("po.status = :status", {
        status: filters.status,
      });
    }

    if (filters?.search) {
      queryBuilder.andWhere("po.poNumber LIKE :search", {
        search: `%${filters.search}%`,
      });
    }

    const purchaseOrders = await queryBuilder.getMany();
    return purchaseOrders.map((po) => this.toDto(po));
  }

  /**
   * Find a single purchase order by ID
   */
  async findOne(
    tenantId: number,
    id: number | string
  ): Promise<PurchaseOrderDto | null> {
    const purchaseOrder = await this.purchaseOrderRepository.findOne({
      where: { id: Number(id), tenantId },
    });

    return purchaseOrder ? this.toDto(purchaseOrder) : null;
  }

  /**
   * Find multiple purchase orders by IDs
   */
  async findByIds(
    tenantId: number,
    ids: (number | string)[]
  ): Promise<PurchaseOrderDto[]> {
    const numericIds = ids.map((id) => Number(id));
    const purchaseOrders = await this.purchaseOrderRepository.find({
      where: { id: In(numericIds), tenantId },
    });

    return purchaseOrders.map((po) => this.toDto(po));
  }

  /**
   * Find purchase orders by vendor ID
   */
  async findByVendorId(
    tenantId: number,
    vendorId: number | string
  ): Promise<PurchaseOrderDto[]> {
    const purchaseOrders = await this.purchaseOrderRepository.find({
      where: { tenantId, vendorId: Number(vendorId) },
    });

    return purchaseOrders.map((po) => this.toDto(po));
  }

  /**
   * Convert entity to DTO
   */
  private toDto(po: PurchaseOrder): PurchaseOrderDto {
    return {
      id: po.id,
      poNumber: po.poNumber,
      vendorId: po.vendorId,
      expectedDeliveryDate: po.expectedDeliveryDate,
      status: po.status,
      notes: po.notes,
      isExternal: false,
    };
  }
}
