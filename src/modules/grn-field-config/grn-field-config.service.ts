import {
  Injectable,
  NotFoundException,
  ConflictException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { GRNFieldConfig } from "../../entities/grn-field-config.entity";
import { CreateGRNFieldConfigDto, UpdateGRNFieldConfigDto } from "./dto";

/**
 * Default GRN field configurations for new tenants
 *
 * STATIC FIELDS (in GRN entity - not configurable):
 * - Step 1: truckNumber
 * - Step 4: netWeight (auto-calculated)
 * - Step 5: verificationStatus, approvalStatus, rejectionReason
 *
 * DYNAMIC FIELDS (configurable per tenant - stored in GRNFieldValue):
 * - Step 1: invoice_file, po_file, driver_name
 * - Step 2: gross_weight, gross_weight_image
 * - Step 3: driver_photo, driver_licence_image, unloading_photos, unloading_notes, material_count
 * - Step 4: tare_weight, tare_weight_image
 * - Step 5, 6, 7: No dynamic fields as of now
 */
const DEFAULT_GRN_FIELDS = [
  // Step 1: Gate Entry (truckNumber is static, these are dynamic)
  {
    stepNumber: 1,
    fieldName: "invoice_file",
    fieldLabel: "Invoice File",
    fieldType: "file",
    isRequired: false,
    displayOrder: 1,
    allowMultiple: false,
    maxFiles: 1,
  },
  {
    stepNumber: 1,
    fieldName: "po_file",
    fieldLabel: "PO File",
    fieldType: "file",
    isRequired: false,
    displayOrder: 2,
    allowMultiple: false,
    maxFiles: 1,
  },
  {
    stepNumber: 1,
    fieldName: "driver_name",
    fieldLabel: "Driver Name",
    fieldType: "text",
    isRequired: false,
    displayOrder: 3,
    allowMultiple: false,
    maxFiles: 1,
  },

  // Step 2: Initial Weighing
  {
    stepNumber: 2,
    fieldName: "gross_weight",
    fieldLabel: "Gross Weight (kg)",
    fieldType: "number",
    isRequired: true,
    displayOrder: 1,
    allowMultiple: false,
    maxFiles: 1,
  },
  {
    stepNumber: 2,
    fieldName: "gross_weight_image",
    fieldLabel: "Gross Weight Image",
    fieldType: "photo",
    isRequired: false,
    displayOrder: 2,
    allowMultiple: true,
    maxFiles: 3,
  },

  // Step 3: Unloading
  {
    stepNumber: 3,
    fieldName: "driver_photo",
    fieldLabel: "Driver Photo",
    fieldType: "photo",
    isRequired: false,
    displayOrder: 1,
    allowMultiple: false,
    maxFiles: 1,
  },
  {
    stepNumber: 3,
    fieldName: "driver_licence_image",
    fieldLabel: "Driver Licence Image",
    fieldType: "photo",
    isRequired: false,
    displayOrder: 2,
    allowMultiple: true,
    maxFiles: 2,
  },
  {
    stepNumber: 3,
    fieldName: "unloading_photos",
    fieldLabel: "Unloading Photos",
    fieldType: "photo",
    isRequired: true,
    displayOrder: 3,
    allowMultiple: true,
    maxFiles: 3,
  },
  {
    stepNumber: 3,
    fieldName: "unloading_notes",
    fieldLabel: "Unloading Notes",
    fieldType: "text",
    isRequired: false,
    displayOrder: 4,
    allowMultiple: false,
    maxFiles: 1,
  },
  {
    stepNumber: 3,
    fieldName: "material_count",
    fieldLabel: "Material Count",
    fieldType: "number",
    isRequired: true,
    displayOrder: 5,
    allowMultiple: false,
    maxFiles: 1,
  },

  // Step 4: Final Weighing
  {
    stepNumber: 4,
    fieldName: "tare_weight",
    fieldLabel: "Tare Weight (kg)",
    fieldType: "number",
    isRequired: true,
    displayOrder: 1,
    allowMultiple: false,
    maxFiles: 1,
  },
  {
    stepNumber: 4,
    fieldName: "tare_weight_image",
    fieldLabel: "Tare Weight Image",
    fieldType: "photo",
    isRequired: false,
    displayOrder: 2,
    allowMultiple: true,
    maxFiles: 3,
  },
  // NOTE: net_weight is a static field in GRN entity (auto-calculated from gross_weight - tare_weight)

  // Step 5: Supervisor Review -fields (verificationStatus, approvalStatus, rejectionReason are static)

  {
    stepNumber: 5,
    fieldName: "remark",
    fieldLabel: "Remarks",
    fieldType: "text",
    isRequired: false,
    displayOrder: 1,
    allowMultiple: false,
    maxFiles: 1,
  },
  // Step 6: Gate Pass - No dynamic fields
  // Step 7: QC Inspection - No dynamic fields
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
