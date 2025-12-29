import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { GRN } from "../../entities/grn.entity";
import { GRNFieldValue } from "../../entities/grn-field-value.entity";
import { Vendor } from "../../entities/vendor.entity";
import { PurchaseOrder } from "../../entities/purchase-order.entity";
import { UploadsService } from "../uploads/uploads.service";
import {
  CreateGRNDto,
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
    @InjectRepository(Vendor)
    private vendorRepository: Repository<Vendor>,
    @InjectRepository(PurchaseOrder)
    private purchaseOrderRepository: Repository<PurchaseOrder>,
    private uploadsService: UploadsService
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
    // Verify vendor exists and belongs to tenant
    const vendor = await this.vendorRepository.findOne({
      where: { id: createDto.vendorId, tenantId },
    });

    if (!vendor) {
      throw new NotFoundException(
        `Vendor with ID ${createDto.vendorId} not found`
      );
    }

    // If PO is provided, verify it exists and auto-populate vendor
    if (createDto.purchaseOrderId) {
      const purchaseOrder = await this.purchaseOrderRepository.findOne({
        where: { id: createDto.purchaseOrderId, tenantId },
      });

      if (!purchaseOrder) {
        throw new NotFoundException(
          `Purchase Order with ID ${createDto.purchaseOrderId} not found`
        );
      }

      // Auto-populate vendor from PO
      createDto.vendorId = purchaseOrder.vendorId;
    }

    const grnNumber = await this.generateGRNNumber(tenantId);

    const grn = this.grnRepository.create({
      tenantId,
      grnNumber,
      purchaseOrderId: createDto.purchaseOrderId,
      vendorId: createDto.vendorId,
      truckNumber: createDto.truckNumber,
      currentStep: 2, // Step 1 (Gate Entry) is complete, move to Step 2
      status: "in_progress",
      createdBy: userId,
      updatedBy: userId,
    });

    const savedGrn = await this.grnRepository.save(grn);

    // Save dynamic field values for Step 1
    if (createDto.fieldValues && createDto.fieldValues.length > 0) {
      await this.saveFieldValues(savedGrn.id, createDto.fieldValues, userId);
    }

    return savedGrn;
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
      ],
    });

    if (!grn) {
      throw new NotFoundException(`GRN with ID ${id} not found`);
    }

    // Enrich with file URLs (async for S3 signed URLs)
    return this.enrichWithFileUrls(grn);
  }

  /**
   * Enrich GRN data with S3 signed URLs for all file fields
   */
  private async enrichWithFileUrls(grn: GRN): Promise<GRN> {
    // Add URLs for main GRN file fields
    if (grn.grossWeightImage) {
      (grn as any).grossWeightImageUrls = await this.uploadsService.getFileUrls(
        grn.grossWeightImage
      );
    }
    if (grn.tareWeightImage) {
      (grn as any).tareWeightImageUrls = await this.uploadsService.getFileUrls(
        grn.tareWeightImage
      );
    }
    if (grn.driverPhoto) {
      (grn as any).driverPhotoUrl = await this.uploadsService.getFileUrl(
        grn.driverPhoto
      );
    }
    if (grn.driverLicenceImage) {
      (grn as any).driverLicenceImageUrl = await this.uploadsService.getFileUrl(
        grn.driverLicenceImage
      );
    }
    if (grn.unloadingPhotos && grn.unloadingPhotos.length > 0) {
      const unloadingPhotoUrls: { key: string; url: string }[] = [];
      for (const photo of grn.unloadingPhotos) {
        const url = await this.uploadsService.getFileUrl(photo);
        unloadingPhotoUrls.push({ key: photo, url });
      }
      (grn as any).unloadingPhotoUrls = unloadingPhotoUrls;
    }

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

  // Step 2 - Initial Weighing
  async updateStep2(
    tenantId: number,
    id: number,
    updateDto: UpdateGRNStep2Dto,
    userId: number
  ): Promise<GRN> {
    const grn = await this.findOne(tenantId, id);

    if (grn.currentStep !== 2) {
      throw new BadRequestException(
        "Cannot update Step 2. GRN is not at the correct step."
      );
    }

    grn.grossWeight = updateDto.grossWeight;
    grn.grossWeightImage = updateDto.grossWeightImage;
    grn.currentStep = 3; // Move to Step 3 after completing Step 2
    grn.updatedBy = userId;

    const savedGrn = await this.grnRepository.save(grn);

    // Save dynamic field values
    if (updateDto.fieldValues && updateDto.fieldValues.length > 0) {
      await this.saveFieldValues(savedGrn.id, updateDto.fieldValues, userId);
    }

    return savedGrn;
  }

  // Step 3 - Unloading
  async updateStep3(
    tenantId: number,
    id: number,
    updateDto: UpdateGRNStep3Dto,
    userId: number
  ): Promise<GRN> {
    const grn = await this.findOne(tenantId, id);

    if (grn.currentStep !== 3) {
      throw new BadRequestException(
        "Cannot update Step 3. GRN is not at the correct step."
      );
    }

    // Make unloading photos optional for now
    grn.driverPhoto = updateDto.driverPhoto;
    grn.driverLicenceImage = updateDto.driverLicenceImage;
    grn.unloadingPhotos = updateDto.unloadingPhotos || [];
    grn.unloadingNotes = updateDto.unloadingNotes;
    grn.currentStep = 4; // Move to Step 4 after completing Step 3
    grn.updatedBy = userId;

    const savedGrn = await this.grnRepository.save(grn);

    // Save dynamic field values
    if (updateDto.fieldValues && updateDto.fieldValues.length > 0) {
      await this.saveFieldValues(savedGrn.id, updateDto.fieldValues, userId);
    }

    return savedGrn;
  }

  // Step 4 - Final Weighing
  async updateStep4(
    tenantId: number,
    id: number,
    updateDto: UpdateGRNStep4Dto,
    userId: number
  ): Promise<GRN> {
    const grn = await this.findOne(tenantId, id);

    if (grn.currentStep !== 4) {
      throw new BadRequestException(
        "Cannot update Step 4. GRN is not at the correct step."
      );
    }

    if (!grn.grossWeight) {
      throw new BadRequestException(
        "Gross weight must be recorded before final weighing"
      );
    }

    // Calculate net weight
    const netWeight = grn.grossWeight - updateDto.tareWeight;

    if (netWeight < 0) {
      throw new BadRequestException(
        "Tare weight cannot be greater than gross weight"
      );
    }

    grn.tareWeight = updateDto.tareWeight;
    grn.tareWeightImage = updateDto.tareWeightImage;
    grn.netWeight = netWeight;
    grn.materialCount = updateDto.materialCount;
    grn.currentStep = 5; // Move to Step 5 after completing Step 4
    grn.updatedBy = userId;

    const savedGrn = await this.grnRepository.save(grn);

    // Save dynamic field values
    if (updateDto.fieldValues && updateDto.fieldValues.length > 0) {
      await this.saveFieldValues(savedGrn.id, updateDto.fieldValues, userId);
    }

    return savedGrn;
  }

  // Step 5 - Supervisor Review
  async updateStep5(
    tenantId: number,
    id: number,
    updateDto: UpdateGRNStep5Dto,
    userId: number
  ): Promise<GRN> {
    const grn = await this.findOne(tenantId, id);

    if (grn.currentStep !== 5) {
      throw new BadRequestException(
        "Cannot update Step 5. GRN is not at the correct step."
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

    grn.verificationStatus = updateDto.verificationStatus;
    grn.approvalStatus = updateDto.approvalStatus;
    grn.reviewNotes = updateDto.reviewNotes;
    grn.rejectionReason = updateDto.rejectionReason;
    grn.reviewedBy = userId;
    grn.reviewedAt = new Date();
    grn.updatedBy = userId;

    // Update status and step based on approval
    if (updateDto.approvalStatus === ApprovalStatus.APPROVED) {
      grn.currentStep = 6; // Move to Gate Pass step
    } else if (updateDto.approvalStatus === ApprovalStatus.REJECTED) {
      grn.status = "rejected";
    }

    const savedGrn = await this.grnRepository.save(grn);

    // Save dynamic field values
    if (updateDto.fieldValues && updateDto.fieldValues.length > 0) {
      await this.saveFieldValues(savedGrn.id, updateDto.fieldValues, userId);
    }

    return savedGrn;
  }

  // Helper method to save field values
  private async saveFieldValues(
    grnId: number,
    fieldValues: { fieldConfigId: number; value: string }[],
    userId: number
  ): Promise<void> {
    for (const fv of fieldValues) {
      // Check if field value already exists
      const existing = await this.fieldValueRepository.findOne({
        where: { grnId, fieldConfigId: fv.fieldConfigId },
      });

      if (existing) {
        // Update existing
        existing.textValue = fv.value;
        existing.updatedBy = userId;
        await this.fieldValueRepository.save(existing);
      } else {
        // Create new
        const fieldValue = this.fieldValueRepository.create({
          grnId,
          fieldConfigId: fv.fieldConfigId,
          textValue: fv.value,
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
