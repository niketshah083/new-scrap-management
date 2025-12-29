import {
  Injectable,
  NotFoundException,
  ConflictException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { GRNFieldConfig } from "../../entities/grn-field-config.entity";
import { CreateGRNFieldConfigDto, UpdateGRNFieldConfigDto } from "./dto";

// Default GRN field configurations for new tenants
// NOTE: These are DYNAMIC fields only. Static fields like grossWeight, tareWeight, netWeight,
// truckNumber, verificationStatus, approvalStatus are already in the GRN entity.
const DEFAULT_GRN_FIELDS = [
  // Step 1: Gate Entry (truckNumber, vendorId, purchaseOrderId are static)
  {
    stepNumber: 1,
    fieldName: "invoice",
    fieldLabel: "Invoice",
    fieldType: "file",
    isRequired: false,
    displayOrder: 1,
  },
  {
    stepNumber: 1,
    fieldName: "driver_name",
    fieldLabel: "Driver Name",
    fieldType: "text",
    isRequired: true,
    displayOrder: 2,
  },
  {
    stepNumber: 1,
    fieldName: "driver_phone",
    fieldLabel: "Driver Phone",
    fieldType: "text",
    isRequired: false,
    displayOrder: 3,
  },
  {
    stepNumber: 1,
    fieldName: "entry_time",
    fieldLabel: "Entry Time",
    fieldType: "date",
    isRequired: true,
    displayOrder: 4,
  },
  {
    stepNumber: 1,
    fieldName: "po_file",
    fieldLabel: "Purchase Order File",
    fieldType: "photo",
    isRequired: false,
    displayOrder: 5,
  },
  // Step 2: Initial Weighing (grossWeight, grossWeightImage are static)
  // No additional dynamic fields needed - static fields handle this step
  // Step 3: Unloading
  {
    stepNumber: 3,
    fieldName: "unloading_start_time",
    fieldLabel: "Unloading Start Time",
    fieldType: "date",
    isRequired: false,
    displayOrder: 1,
  },
  {
    stepNumber: 3,
    fieldName: "unloading_end_time",
    fieldLabel: "Unloading End Time",
    fieldType: "date",
    isRequired: false,
    displayOrder: 2,
  },
  {
    stepNumber: 3,
    fieldName: "unloading_notes",
    fieldLabel: "Unloading Notes",
    fieldType: "text",
    isRequired: false,
    displayOrder: 3,
  },
  // Step 4: Final Weighing (tareWeight, tareWeightImage, netWeight are static)
  // No additional dynamic fields needed - static fields handle this step
  // Step 5: Supervisor Review (verificationStatus, approvalStatus, reviewNotes, rejectionReason are static)
  {
    stepNumber: 5,
    fieldName: "review_notes",
    fieldLabel: "Review Notes",
    fieldType: "text",
    isRequired: false,
    displayOrder: 1,
  },
  // Step 6: Gate Pass - handled by GatePass entity
  // No dynamic fields needed
  // Step 7: Inspection Report - handled by QCInspection entity
  // No dynamic fields needed
];

@Injectable()
export class GRNFieldConfigService {
  constructor(
    @InjectRepository(GRNFieldConfig)
    private fieldConfigRepository: Repository<GRNFieldConfig>
  ) {}

  /**
   * Create default GRN field configurations for a new tenant
   */
  async createDefaultFieldsForTenant(
    tenantId: number,
    userId: number
  ): Promise<GRNFieldConfig[]> {
    const createdFields: GRNFieldConfig[] = [];

    for (const fieldData of DEFAULT_GRN_FIELDS) {
      const fieldConfig = this.fieldConfigRepository.create({
        ...fieldData,
        tenantId,
        isActive: true,
        createdBy: userId,
        updatedBy: userId,
      });

      const saved = await this.fieldConfigRepository.save(fieldConfig);
      createdFields.push(saved);
    }

    return createdFields;
  }

  async create(
    tenantId: number,
    createDto: CreateGRNFieldConfigDto,
    userId: number
  ): Promise<GRNFieldConfig> {
    // Check if field with same name already exists for this tenant and step
    const existingField = await this.fieldConfigRepository.findOne({
      where: {
        tenantId,
        stepNumber: createDto.stepNumber,
        fieldName: createDto.fieldName,
      },
    });

    if (existingField) {
      throw new ConflictException(
        "Field with this name already exists for this step"
      );
    }

    const fieldConfig = this.fieldConfigRepository.create({
      ...createDto,
      tenantId,
      createdBy: userId,
      updatedBy: userId,
    });

    return this.fieldConfigRepository.save(fieldConfig);
  }

  async findAll(tenantId: number): Promise<GRNFieldConfig[]> {
    return this.fieldConfigRepository.find({
      where: { tenantId },
      order: { stepNumber: "ASC", displayOrder: "ASC" },
    });
  }

  async findByStep(
    tenantId: number,
    stepNumber: number
  ): Promise<GRNFieldConfig[]> {
    return this.fieldConfigRepository.find({
      where: { tenantId, stepNumber, isActive: true },
      order: { displayOrder: "ASC" },
    });
  }

  async findOne(tenantId: number, id: number): Promise<GRNFieldConfig> {
    const fieldConfig = await this.fieldConfigRepository.findOne({
      where: { id, tenantId },
    });

    if (!fieldConfig) {
      throw new NotFoundException(
        `Field configuration with ID ${id} not found`
      );
    }

    return fieldConfig;
  }

  async update(
    tenantId: number,
    id: number,
    updateDto: UpdateGRNFieldConfigDto,
    userId: number
  ): Promise<GRNFieldConfig> {
    const fieldConfig = await this.findOne(tenantId, id);

    // Check if field name is being changed and if it already exists
    if (updateDto.fieldName && updateDto.fieldName !== fieldConfig.fieldName) {
      const stepNumber = updateDto.stepNumber ?? fieldConfig.stepNumber;
      const existingField = await this.fieldConfigRepository.findOne({
        where: {
          tenantId,
          stepNumber,
          fieldName: updateDto.fieldName,
        },
      });

      if (existingField && existingField.id !== id) {
        throw new ConflictException(
          "Field with this name already exists for this step"
        );
      }
    }

    Object.assign(fieldConfig, {
      ...updateDto,
      updatedBy: userId,
    });

    return this.fieldConfigRepository.save(fieldConfig);
  }

  async remove(tenantId: number, id: number, userId: number): Promise<void> {
    const fieldConfig = await this.findOne(tenantId, id);

    fieldConfig.deletedBy = userId;
    await this.fieldConfigRepository.save(fieldConfig);

    await this.fieldConfigRepository.softRemove(fieldConfig);
  }

  async toggleStatus(
    tenantId: number,
    id: number,
    userId: number
  ): Promise<GRNFieldConfig> {
    const fieldConfig = await this.findOne(tenantId, id);
    fieldConfig.isActive = !fieldConfig.isActive;
    fieldConfig.updatedBy = userId;
    return this.fieldConfigRepository.save(fieldConfig);
  }

  async reorderFields(
    tenantId: number,
    stepNumber: number,
    fieldOrders: { id: number; displayOrder: number }[],
    userId: number
  ): Promise<GRNFieldConfig[]> {
    for (const order of fieldOrders) {
      await this.fieldConfigRepository.update(
        { id: order.id, tenantId, stepNumber },
        { displayOrder: order.displayOrder, updatedBy: userId }
      );
    }

    return this.findByStep(tenantId, stepNumber);
  }
}
