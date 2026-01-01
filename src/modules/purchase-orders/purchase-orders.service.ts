import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, In } from "typeorm";
import { PurchaseOrder, POStatus } from "../../entities/purchase-order.entity";
import { PurchaseOrderItem } from "../../entities/purchase-order-item.entity";
import { Vendor } from "../../entities/vendor.entity";
import { Material } from "../../entities/material.entity";
import { CreatePurchaseOrderDto, UpdatePurchaseOrderDto } from "./dto";
import { DataSourceFactoryService, PurchaseOrderDto } from "../data-source";

@Injectable()
export class PurchaseOrdersService {
  constructor(
    @InjectRepository(PurchaseOrder)
    private purchaseOrderRepository: Repository<PurchaseOrder>,
    @InjectRepository(PurchaseOrderItem)
    private purchaseOrderItemRepository: Repository<PurchaseOrderItem>,
    @InjectRepository(Vendor)
    private vendorRepository: Repository<Vendor>,
    @InjectRepository(Material)
    private materialRepository: Repository<Material>,
    private dataSourceFactory: DataSourceFactoryService
  ) {}

  async create(
    tenantId: number,
    createDto: CreatePurchaseOrderDto,
    userId: number
  ): Promise<PurchaseOrder> {
    // Check if PO number already exists
    const existingPO = await this.purchaseOrderRepository.findOne({
      where: { poNumber: createDto.poNumber },
    });

    if (existingPO) {
      throw new ConflictException(
        "Purchase order with this number already exists"
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

    // Create purchase order
    const purchaseOrder = this.purchaseOrderRepository.create({
      tenantId,
      poNumber: createDto.poNumber,
      vendorId: createDto.vendorId,
      expectedDeliveryDate: new Date(createDto.expectedDeliveryDate),
      notes: createDto.notes,
      status: POStatus.DRAFT,
      createdBy: userId,
      updatedBy: userId,
    });

    const savedPO = await this.purchaseOrderRepository.save(purchaseOrder);

    // Create purchase order items
    const items = createDto.items.map((item) => {
      const totalPrice = item.quantity * item.unitPrice;
      return this.purchaseOrderItemRepository.create({
        purchaseOrderId: savedPO.id,
        materialId: item.materialId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice,
        createdBy: userId,
        updatedBy: userId,
      });
    });

    await this.purchaseOrderItemRepository.save(items);

    return this.findOne(tenantId, savedPO.id);
  }

  /**
   * Find all purchase orders - uses external DB if configured
   */
  async findAllFromDataSource(tenantId: number): Promise<PurchaseOrderDto[]> {
    return this.dataSourceFactory.getPurchaseOrders(tenantId);
  }

  /**
   * Find purchase orders by vendor - uses external DB if configured
   */
  async findByVendor(
    tenantId: number,
    vendorId: number
  ): Promise<PurchaseOrderDto[]> {
    return this.dataSourceFactory.getPurchaseOrdersByVendor(tenantId, vendorId);
  }

  async findAll(tenantId: number): Promise<PurchaseOrder[]> {
    return this.purchaseOrderRepository.find({
      where: { tenantId },
      relations: ["vendor", "items", "items.material"],
      order: { createdAt: "DESC" },
    });
  }

  async findOne(tenantId: number, id: number): Promise<PurchaseOrder> {
    const purchaseOrder = await this.purchaseOrderRepository.findOne({
      where: { id, tenantId },
      relations: ["vendor", "items", "items.material"],
    });

    if (!purchaseOrder) {
      throw new NotFoundException(`Purchase order with ID ${id} not found`);
    }

    return purchaseOrder;
  }

  async findPendingOrders(tenantId: number): Promise<PurchaseOrder[]> {
    return this.purchaseOrderRepository.find({
      where: { tenantId, status: "pending" },
      relations: ["vendor", "items", "items.material"],
      order: { expectedDeliveryDate: "ASC" },
    });
  }

  async update(
    tenantId: number,
    id: number,
    updateDto: UpdatePurchaseOrderDto,
    userId: number
  ): Promise<PurchaseOrder> {
    const purchaseOrder = await this.findOne(tenantId, id);

    // Check if PO number is being changed and if it already exists
    if (updateDto.poNumber && updateDto.poNumber !== purchaseOrder.poNumber) {
      const existingPO = await this.purchaseOrderRepository.findOne({
        where: { poNumber: updateDto.poNumber },
      });

      if (existingPO) {
        throw new ConflictException(
          "Purchase order with this number already exists"
        );
      }
    }

    // Verify vendor if being changed
    if (updateDto.vendorId && updateDto.vendorId !== purchaseOrder.vendorId) {
      const vendor = await this.vendorRepository.findOne({
        where: { id: updateDto.vendorId, tenantId },
      });

      if (!vendor) {
        throw new NotFoundException(
          `Vendor with ID ${updateDto.vendorId} not found`
        );
      }
    }

    // Update purchase order fields
    Object.assign(purchaseOrder, {
      poNumber: updateDto.poNumber ?? purchaseOrder.poNumber,
      vendorId: updateDto.vendorId ?? purchaseOrder.vendorId,
      expectedDeliveryDate: updateDto.expectedDeliveryDate
        ? new Date(updateDto.expectedDeliveryDate)
        : purchaseOrder.expectedDeliveryDate,
      status: updateDto.status ?? purchaseOrder.status,
      notes: updateDto.notes ?? purchaseOrder.notes,
      updatedBy: userId,
    });

    await this.purchaseOrderRepository.save(purchaseOrder);

    // Update items if provided
    if (updateDto.items) {
      // Delete existing items
      await this.purchaseOrderItemRepository.delete({ purchaseOrderId: id });

      // Create new items
      const items = updateDto.items.map((item) => {
        const totalPrice = (item.quantity || 0) * (item.unitPrice || 0);
        return this.purchaseOrderItemRepository.create({
          purchaseOrderId: id,
          materialId: item.materialId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice,
          createdBy: userId,
          updatedBy: userId,
        });
      });

      await this.purchaseOrderItemRepository.save(items);
    }

    return this.findOne(tenantId, id);
  }

  async remove(tenantId: number, id: number, userId: number): Promise<void> {
    const purchaseOrder = await this.findOne(tenantId, id);

    purchaseOrder.deletedBy = userId;
    await this.purchaseOrderRepository.save(purchaseOrder);

    await this.purchaseOrderRepository.softRemove(purchaseOrder);
  }

  async updateStatus(
    tenantId: number,
    id: number,
    status: string,
    userId: number
  ): Promise<PurchaseOrder> {
    const purchaseOrder = await this.findOne(tenantId, id);
    purchaseOrder.status = status;
    purchaseOrder.updatedBy = userId;
    return this.purchaseOrderRepository.save(purchaseOrder);
  }

  /**
   * Check if external DB is enabled for this tenant
   */
  async isExternalDbEnabled(tenantId: number): Promise<boolean> {
    return this.dataSourceFactory.isExternalDbEnabled(tenantId);
  }

  /**
   * Submit PO for approval - changes status from draft to pending_approval
   */
  async submitForApproval(
    tenantId: number,
    id: number,
    userId: number
  ): Promise<PurchaseOrder> {
    const purchaseOrder = await this.findOne(tenantId, id);

    if (purchaseOrder.status !== POStatus.DRAFT) {
      throw new BadRequestException(
        `Cannot submit PO for approval. Current status is "${purchaseOrder.status}". Only draft POs can be submitted.`
      );
    }

    purchaseOrder.status = POStatus.PENDING_APPROVAL;
    purchaseOrder.updatedBy = userId;

    await this.purchaseOrderRepository.save(purchaseOrder);
    return this.findOne(tenantId, id);
  }

  /**
   * Approve PO - changes status from pending_approval to approved
   */
  async approve(
    tenantId: number,
    id: number,
    userId: number
  ): Promise<PurchaseOrder> {
    const purchaseOrder = await this.findOne(tenantId, id);

    if (purchaseOrder.status !== POStatus.PENDING_APPROVAL) {
      throw new BadRequestException(
        `Cannot approve PO. Current status is "${purchaseOrder.status}". Only pending approval POs can be approved.`
      );
    }

    purchaseOrder.status = POStatus.APPROVED;
    purchaseOrder.approvedBy = userId;
    purchaseOrder.approvedAt = new Date();
    purchaseOrder.updatedBy = userId;

    await this.purchaseOrderRepository.save(purchaseOrder);
    return this.findOne(tenantId, id);
  }

  /**
   * Reject PO - changes status from pending_approval to rejected
   */
  async reject(
    tenantId: number,
    id: number,
    userId: number,
    rejectionReason: string
  ): Promise<PurchaseOrder> {
    const purchaseOrder = await this.findOne(tenantId, id);

    if (purchaseOrder.status !== POStatus.PENDING_APPROVAL) {
      throw new BadRequestException(
        `Cannot reject PO. Current status is "${purchaseOrder.status}". Only pending approval POs can be rejected.`
      );
    }

    if (!rejectionReason || rejectionReason.trim() === "") {
      throw new BadRequestException("Rejection reason is required");
    }

    purchaseOrder.status = POStatus.REJECTED;
    purchaseOrder.approvedBy = userId;
    purchaseOrder.approvedAt = new Date();
    purchaseOrder.rejectionReason = rejectionReason;
    purchaseOrder.updatedBy = userId;

    await this.purchaseOrderRepository.save(purchaseOrder);
    return this.findOne(tenantId, id);
  }

  /**
   * Find approved POs for GRN creation
   */
  async findApprovedOrders(tenantId: number): Promise<PurchaseOrder[]> {
    return this.purchaseOrderRepository.find({
      where: {
        tenantId,
        status: In([POStatus.APPROVED, POStatus.PARTIAL]),
      },
      relations: ["vendor", "items", "items.material"],
      order: { expectedDeliveryDate: "ASC" },
    });
  }
}
