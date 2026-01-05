import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { GRN } from "../../entities/grn.entity";
import { GRNFieldValue } from "../../entities/grn-field-value.entity";
import { GRNFieldConfig } from "../../entities/grn-field-config.entity";
import { Vendor } from "../../entities/vendor.entity";
import { PurchaseOrder } from "../../entities/purchase-order.entity";
import { RFIDCard, RFIDCardStatus } from "../../entities/rfid-card.entity";
import { UploadsService } from "../uploads/uploads.service";
import { DataSourceFactoryService } from "../data-source";
import {
  CreateGRNDto,
  UpdateGRNStep1Dto,
  UpdateGRNStep2Dto,
  UpdateGRNStep3Dto,
  UpdateGRNStep4Dto,
  UpdateGRNStep5Dto,
  ApprovalStatus,
} from "./dto";

@Injectable()
export class GRNService {
  constructor(
    @InjectRepository(GRN)
    private grnRepository: Repository<GRN>,
    @InjectRepository(GRNFieldValue)
    private fieldValueRepository: Repository<GRNFieldValue>,
    @InjectRepository(GRNFieldConfig)
    private fieldConfigRepository: Repository<GRNFieldConfig>,
    @InjectRepository(Vendor)
    private vendorRepository: Repository<Vendor>,
    @InjectRepository(PurchaseOrder)
    private purchaseOrderRepository: Repository<PurchaseOrder>,
    @InjectRepository(RFIDCard)
    private rfidCardRepository: Repository<RFIDCard>,
    private uploadsService: UploadsService,
    private dataSourceFactory: DataSourceFactoryService
  ) {}

  private async generateGRNNumber(tenantId: number): Promise<string> {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");

    const count = await this.grnRepository.count({
      where: { tenantId },
    });

    const sequence = String(count + 1).padStart(5, "0");
    return `GRN-${year}${month}${day}-${sequence}`;
  }

  // Step 1 - Gate Entry
  async create(
    tenantId: number,
    createDto: CreateGRNDto,
    userId: number
  ): Promise<GRN> {
    // Check if external DB is enabled for this tenant
    const usesExternalDb =
      await this.dataSourceFactory.isExternalDbEnabled(tenantId);

    let vendorId: number | null = null;
    let externalVendorId: string | null = null;
    let purchaseOrderId: number | null = null;
    let externalPoId: string | null = null;

    if (usesExternalDb) {
      // Using external database
      if (createDto.externalVendorId) {
        const vendor = await this.dataSourceFactory.getVendor(
          tenantId,
          createDto.externalVendorId
        );
        if (!vendor) {
          throw new NotFoundException(
            `Vendor with ID ${createDto.externalVendorId} not found in external database`
          );
        }
        externalVendorId = String(createDto.externalVendorId);
      }

      if (createDto.externalPoId) {
        const po = await this.dataSourceFactory.getPurchaseOrder(
          tenantId,
          createDto.externalPoId
        );
        if (!po) {
          throw new NotFoundException(
            `Purchase Order with ID ${createDto.externalPoId} not found in external database`
          );
        }
        externalPoId = String(createDto.externalPoId);
        if (!externalVendorId && po.vendorId) {
          externalVendorId = String(po.vendorId);
        }
      }
    } else {
      // Using internal database
      if (createDto.vendorId) {
        const vendor = await this.vendorRepository.findOne({
          where: { id: createDto.vendorId, tenantId },
        });
        if (!vendor) {
          throw new NotFoundException(
            `Vendor with ID ${createDto.vendorId} not found`
          );
        }
        vendorId = createDto.vendorId;
      }

      if (createDto.purchaseOrderId) {
        const purchaseOrder = await this.purchaseOrderRepository.findOne({
          where: { id: createDto.purchaseOrderId, tenantId },
        });
        if (!purchaseOrder) {
          throw new NotFoundException(
            `Purchase Order with ID ${createDto.purchaseOrderId} not found`
          );
        }
        purchaseOrderId = createDto.purchaseOrderId;
        if (!vendorId) {
          vendorId = purchaseOrder.vendorId;
        }
      }
    }

    const grnNumber = await this.generateGRNNumber(tenantId);

    const grn = this.grnRepository.create({
      tenantId,
      grnNumber,
      purchaseOrderId,
      externalPoId,
      vendorId,
      externalVendorId,
      usesExternalDb,
      truckNumber: createDto.truckNumber,
      currentStep: 2, // Step 1 (Gate Entry) is complete, move to Step 2
      status: "in_progress",
      createdBy: userId,
      updatedBy: userId,
    });

    const savedGrn = await this.grnRepository.save(grn);

    // Handle RFID card assignment if provided
    if (createDto.rfidCardNumber) {
      const rfidCard = await this.rfidCardRepository.findOne({
        where: { cardNumber: createDto.rfidCardNumber, tenantId },
      });

      if (rfidCard && rfidCard.status === RFIDCardStatus.AVAILABLE) {
        // Assign the card to this GRN
        rfidCard.grnId = savedGrn.id;
        rfidCard.status = RFIDCardStatus.ASSIGNED;
        rfidCard.assignedAt = new Date();
        rfidCard.updatedBy = userId;
        await this.rfidCardRepository.save(rfidCard);

        // Update GRN with card reference
        savedGrn.rfidCardId = rfidCard.id;
        await this.grnRepository.save(savedGrn);
      }
    }

    // Save dynamic field values for Step 1
    if (createDto.fieldValues && createDto.fieldValues.length > 0) {
      await this.saveFieldValues(savedGrn.id, createDto.fieldValues, userId);
    }

    return this.findOne(tenantId, savedGrn.id);
  }

  // Step 1 - Gate Entry (Update/Edit)
  async updateStep1(
    tenantId: number,
    id: number,
    updateDto: UpdateGRNStep1Dto,
    userId: number
  ): Promise<GRN> {
    const grn = await this.findOne(tenantId, id);

    // Allow editing Step 1 if GRN exists (step 1 is always completed for existing GRNs)
    if (grn.currentStep < 2) {
      throw new BadRequestException(
        "Cannot update Step 1. GRN creation is not complete."
      );
    }

    // Update static fields if provided
    if (updateDto.purchaseOrderId !== undefined) {
      if (updateDto.purchaseOrderId) {
        const purchaseOrder = await this.purchaseOrderRepository.findOne({
          where: { id: updateDto.purchaseOrderId, tenantId },
        });
        if (!purchaseOrder) {
          throw new NotFoundException(
            `Purchase Order with ID ${updateDto.purchaseOrderId} not found`
          );
        }
        grn.purchaseOrderId = updateDto.purchaseOrderId;
        // Auto-update vendor if not explicitly set
        if (updateDto.vendorId === undefined && purchaseOrder.vendorId) {
          grn.vendorId = purchaseOrder.vendorId;
        }
      } else {
        grn.purchaseOrderId = null;
      }
    }

    if (updateDto.vendorId !== undefined) {
      if (updateDto.vendorId) {
        const vendor = await this.vendorRepository.findOne({
          where: { id: updateDto.vendorId, tenantId },
        });
        if (!vendor) {
          throw new NotFoundException(
            `Vendor with ID ${updateDto.vendorId} not found`
          );
        }
        grn.vendorId = updateDto.vendorId;
      } else {
        grn.vendorId = null;
      }
    }

    if (updateDto.truckNumber !== undefined) {
      grn.truckNumber = updateDto.truckNumber;
    }

    grn.updatedBy = userId;
    await this.grnRepository.save(grn);

    // Save dynamic field values for Step 1
    if (updateDto.fieldValues && updateDto.fieldValues.length > 0) {
      await this.saveFieldValues(grn.id, updateDto.fieldValues, userId);
    }

    return this.findOne(tenantId, grn.id);
  }

  async findAll(tenantId: number): Promise<GRN[]> {
    return this.grnRepository.find({
      where: { tenantId },
      relations: ["vendor", "purchaseOrder"],
      order: { createdAt: "DESC" },
    });
  }

  async findOne(tenantId: number, id: number): Promise<GRN> {
    const grn = await this.grnRepository.findOne({
      where: { id, tenantId },
      relations: [
        "vendor",
        "purchaseOrder",
        "purchaseOrder.items",
        "purchaseOrder.items.material",
        "fieldValues",
        "fieldValues.fieldConfig",
        "rfidCard",
      ],
    });

    if (!grn) {
      throw new NotFoundException(`GRN with ID ${id} not found`);
    }

    // Enrich with file URLs
    return this.enrichWithFileUrls(grn);
  }

  /**
   * Enrich GRN data with S3 signed URLs for all file fields
   */
  private async enrichWithFileUrls(grn: GRN): Promise<GRN> {
    // Add URLs for dynamic field values that are file/photo types
    if (grn.fieldValues) {
      for (const fv of grn.fieldValues) {
        if (
          fv.fieldConfig &&
          (fv.fieldConfig.fieldType === "photo" ||
            fv.fieldConfig.fieldType === "file")
        ) {
          const value = fv.textValue || fv.fileUrl;
          if (value) {
            (fv as any).fileUrls = await this.uploadsService.getFileUrls(value);
          }
        }
      }
    }

    return grn;
  }

  async findByStatus(tenantId: number, status: string): Promise<GRN[]> {
    return this.grnRepository.find({
      where: { tenantId, status },
      relations: ["vendor", "purchaseOrder"],
      order: { createdAt: "DESC" },
    });
  }

  async findByStep(tenantId: number, step: number): Promise<GRN[]> {
    return this.grnRepository.find({
      where: { tenantId, currentStep: step, status: "in_progress" },
      relations: ["vendor", "purchaseOrder"],
      order: { createdAt: "DESC" },
    });
  }

  /**
   * Get field value by field name from GRN's field values
   */
  private getFieldValue(grn: GRN, fieldName: string): string | null {
    if (!grn.fieldValues) return null;
    const fv = grn.fieldValues.find(
      (v) => v.fieldConfig?.fieldName === fieldName
    );
    return fv?.textValue || fv?.numberValue?.toString() || null;
  }

  /**
   * Get numeric field value
   */
  private getNumericFieldValue(grn: GRN, fieldName: string): number | null {
    if (!grn.fieldValues) return null;
    const fv = grn.fieldValues.find(
      (v) => v.fieldConfig?.fieldName === fieldName
    );
    return fv?.numberValue || null;
  }

  // Step 2 - Initial Weighing
  async updateStep2(
    tenantId: number,
    id: number,
    updateDto: UpdateGRNStep2Dto,
    userId: number
  ): Promise<GRN> {
    const grn = await this.findOne(tenantId, id);

    // Allow editing if at step 2 OR if step 2 was already completed (currentStep > 2)
    if (grn.currentStep < 2) {
      throw new BadRequestException(
        "Cannot update Step 2. Complete Step 1 first."
      );
    }

    // Only advance step if we're at step 2 (not editing a completed step)
    if (grn.currentStep === 2) {
      grn.currentStep = 3;
    }
    grn.updatedBy = userId;

    const savedGrn = await this.grnRepository.save(grn);

    // Save dynamic field values (gross_weight, gross_weight_image)
    if (updateDto.fieldValues && updateDto.fieldValues.length > 0) {
      await this.saveFieldValues(savedGrn.id, updateDto.fieldValues, userId);
    }

    return this.findOne(tenantId, savedGrn.id);
  }

  // Step 3 - Unloading
  async updateStep3(
    tenantId: number,
    id: number,
    updateDto: UpdateGRNStep3Dto,
    userId: number
  ): Promise<GRN> {
    const grn = await this.findOne(tenantId, id);

    // Allow editing if at step 3 OR if step 3 was already completed (currentStep > 3)
    if (grn.currentStep < 3) {
      throw new BadRequestException(
        "Cannot update Step 3. Complete previous steps first."
      );
    }

    // Only advance step if we're at step 3 (not editing a completed step)
    if (grn.currentStep === 3) {
      grn.currentStep = 4;
    }
    grn.updatedBy = userId;

    const savedGrn = await this.grnRepository.save(grn);

    // Save dynamic field values (driver_photo, driver_licence_image, unloading_photos, unloading_notes, material_count)
    if (updateDto.fieldValues && updateDto.fieldValues.length > 0) {
      await this.saveFieldValues(savedGrn.id, updateDto.fieldValues, userId);
    }

    return this.findOne(tenantId, savedGrn.id);
  }

  // Step 4 - Final Weighing
  async updateStep4(
    tenantId: number,
    id: number,
    updateDto: UpdateGRNStep4Dto,
    userId: number
  ): Promise<GRN> {
    const grn = await this.findOne(tenantId, id);

    // Allow editing if at step 4 OR if step 4 was already completed (currentStep > 4)
    if (grn.currentStep < 4) {
      throw new BadRequestException(
        "Cannot update Step 4. Complete previous steps first."
      );
    }

    // Get gross_weight from field values to validate and calculate net_weight
    const grossWeight = this.getNumericFieldValue(grn, "gross_weight");
    if (!grossWeight) {
      throw new BadRequestException(
        "Gross weight must be recorded before final weighing"
      );
    }

    // Save dynamic field values first (tare_weight, tare_weight_image)
    if (updateDto.fieldValues && updateDto.fieldValues.length > 0) {
      await this.saveFieldValues(grn.id, updateDto.fieldValues, userId);
    }

    // Reload GRN to get the saved tare_weight
    const updatedGrn = await this.findOne(tenantId, id);
    const tareWeight = this.getNumericFieldValue(updatedGrn, "tare_weight");

    // Calculate net_weight if tare_weight is available
    if (tareWeight !== null) {
      const netWeight = grossWeight - tareWeight;
      if (netWeight < 0) {
        throw new BadRequestException(
          "Tare weight cannot be greater than gross weight"
        );
      }
      updatedGrn.netWeight = netWeight;
    }

    // Only advance step if we're at step 4 (not editing a completed step)
    if (grn.currentStep === 4) {
      updatedGrn.currentStep = 5;
    }
    updatedGrn.updatedBy = userId;

    await this.grnRepository.save(updatedGrn);

    return this.findOne(tenantId, updatedGrn.id);
  }

  // Step 5 - Supervisor Review
  async updateStep5(
    tenantId: number,
    id: number,
    updateDto: UpdateGRNStep5Dto,
    userId: number
  ): Promise<GRN> {
    const grn = await this.findOne(tenantId, id);

    // Allow editing if at step 5 OR if step 5 was already completed (currentStep > 5)
    if (grn.currentStep < 5) {
      throw new BadRequestException(
        "Cannot update Step 5. Complete previous steps first."
      );
    }

    // Validate rejection reason if rejected
    if (
      updateDto.approvalStatus === ApprovalStatus.REJECTED &&
      !updateDto.rejectionReason
    ) {
      throw new BadRequestException(
        "Rejection reason is required when rejecting a GRN"
      );
    }

    // Update static fields for Step 5
    grn.verificationStatus = updateDto.verificationStatus;
    grn.approvalStatus = updateDto.approvalStatus;
    grn.rejectionReason = updateDto.rejectionReason;
    grn.reviewedBy = userId;
    grn.reviewedAt = new Date();
    grn.updatedBy = userId;

    // Only advance step if we're at step 5 (not editing a completed step)
    if (grn.currentStep === 5) {
      if (updateDto.approvalStatus === ApprovalStatus.APPROVED) {
        grn.currentStep = 6; // Move to Gate Pass step
      } else if (updateDto.approvalStatus === ApprovalStatus.REJECTED) {
        grn.status = "rejected";
      }
    }

    const savedGrn = await this.grnRepository.save(grn);

    // Save dynamic field values if any
    if (updateDto.fieldValues && updateDto.fieldValues.length > 0) {
      await this.saveFieldValues(savedGrn.id, updateDto.fieldValues, userId);
    }

    return this.findOne(tenantId, savedGrn.id);
  }

  // Helper method to save field values
  private async saveFieldValues(
    grnId: number,
    fieldValues: {
      fieldConfigId?: number;
      fieldName?: string;
      value: string;
    }[],
    userId: number
  ): Promise<void> {
    for (const fv of fieldValues) {
      let fieldConfigId = fv.fieldConfigId;

      // If fieldConfigId not provided, look up by fieldName
      if (!fieldConfigId && fv.fieldName) {
        const grn = await this.grnRepository.findOne({ where: { id: grnId } });
        if (grn) {
          const config = await this.fieldConfigRepository.findOne({
            where: { tenantId: grn.tenantId, fieldName: fv.fieldName },
          });
          if (config) {
            fieldConfigId = config.id;
          }
        }
      }

      if (!fieldConfigId) continue;

      // Check if field value already exists
      const existing = await this.fieldValueRepository.findOne({
        where: { grnId, fieldConfigId },
      });

      // Get field config to determine value type
      const fieldConfig = await this.fieldConfigRepository.findOne({
        where: { id: fieldConfigId },
      });

      if (existing) {
        // Update existing
        if (fieldConfig?.fieldType === "number") {
          existing.numberValue = parseFloat(fv.value) || null;
          existing.textValue = null;
        } else if (
          fieldConfig?.fieldType === "photo" ||
          fieldConfig?.fieldType === "file"
        ) {
          existing.fileUrl = fv.value;
          existing.textValue = fv.value;
        } else {
          existing.textValue = fv.value;
        }
        existing.updatedBy = userId;
        await this.fieldValueRepository.save(existing);
      } else {
        // Create new
        const fieldValue = this.fieldValueRepository.create({
          grnId,
          fieldConfigId,
          textValue: fieldConfig?.fieldType === "number" ? null : fv.value,
          numberValue:
            fieldConfig?.fieldType === "number"
              ? parseFloat(fv.value) || null
              : null,
          fileUrl:
            fieldConfig?.fieldType === "photo" ||
            fieldConfig?.fieldType === "file"
              ? fv.value
              : null,
          createdBy: userId,
          updatedBy: userId,
        });
        await this.fieldValueRepository.save(fieldValue);
      }
    }
  }

  async remove(tenantId: number, id: number, userId: number): Promise<void> {
    const grn = await this.findOne(tenantId, id);

    grn.deletedBy = userId;
    await this.grnRepository.save(grn);

    await this.grnRepository.softRemove(grn);
  }

  // Get GRNs pending approval (at step 5)
  async findPendingApproval(tenantId: number): Promise<GRN[]> {
    return this.grnRepository.find({
      where: { tenantId, currentStep: 5, status: "in_progress" },
      relations: ["vendor", "purchaseOrder"],
      order: { createdAt: "ASC" },
    });
  }

  // Get approved GRNs (for gate pass generation)
  async findApproved(tenantId: number): Promise<GRN[]> {
    return this.grnRepository.find({
      where: { tenantId, approvalStatus: "approved", currentStep: 6 },
      relations: ["vendor", "purchaseOrder"],
      order: { reviewedAt: "DESC" },
    });
  }

  // Get today's GRN count by status
  async getTodayStats(
    tenantId: number
  ): Promise<{ status: string; count: number }[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const result = await this.grnRepository
      .createQueryBuilder("grn")
      .select("grn.status", "status")
      .addSelect("COUNT(*)", "count")
      .where("grn.tenant_id = :tenantId", { tenantId })
      .andWhere("grn.created_at >= :today", { today })
      .groupBy("grn.status")
      .getRawMany();

    return result;
  }
}
