import { Injectable } from "@nestjs/common";
import { FieldMapping } from "../../../entities/tenant.entity";

/**
 * Default field mappings for vendor entity
 */
export const DEFAULT_VENDOR_MAPPINGS: FieldMapping[] = [
  { internalField: "id", externalField: "id", transform: "number" },
  {
    internalField: "companyName",
    externalField: "company_name",
    transform: "string",
  },
  {
    internalField: "contactPerson",
    externalField: "contact_person",
    transform: "string",
  },
  { internalField: "email", externalField: "email", transform: "string" },
  { internalField: "phone", externalField: "phone", transform: "string" },
  { internalField: "address", externalField: "address", transform: "string" },
  {
    internalField: "isActive",
    externalField: "is_active",
    transform: "boolean",
  },
];

/**
 * Default field mappings for purchase order entity
 */
export const DEFAULT_PO_MAPPINGS: FieldMapping[] = [
  { internalField: "id", externalField: "id", transform: "number" },
  {
    internalField: "poNumber",
    externalField: "po_number",
    transform: "string",
  },
  {
    internalField: "vendorId",
    externalField: "vendor_id",
    transform: "number",
  },
  {
    internalField: "orderDate",
    externalField: "order_date",
    transform: "date",
  },
  {
    internalField: "expectedDeliveryDate",
    externalField: "expected_delivery_date",
    transform: "date",
  },
  { internalField: "status", externalField: "status", transform: "string" },
  {
    internalField: "totalAmount",
    externalField: "total_amount",
    transform: "number",
  },
  { internalField: "notes", externalField: "notes", transform: "string" },
];

/**
 * Default field mappings for material entity
 */
export const DEFAULT_MATERIAL_MAPPINGS: FieldMapping[] = [
  { internalField: "id", externalField: "id", transform: "number" },
  { internalField: "name", externalField: "name", transform: "string" },
  { internalField: "code", externalField: "code", transform: "string" },
  {
    internalField: "description",
    externalField: "description",
    transform: "string",
  },
  {
    internalField: "unitOfMeasure",
    externalField: "unit_of_measure",
    transform: "string",
  },
  { internalField: "category", externalField: "category", transform: "string" },
  {
    internalField: "isActive",
    externalField: "is_active",
    transform: "boolean",
  },
];

/**
 * Field Mapping Service
 * Handles transformation of external database fields to internal model fields
 */
@Injectable()
export class FieldMappingService {
  /**
   * Apply field mappings to transform external data to internal format
   */
  applyMappings(
    externalData: Record<string, any>,
    mappings: FieldMapping[]
  ): Record<string, any> {
    const result: Record<string, any> = {};

    for (const mapping of mappings) {
      const externalValue = externalData[mapping.externalField];
      if (externalValue !== undefined) {
        result[mapping.internalField] = this.transformValue(
          externalValue,
          mapping.transform
        );
      }
    }

    return result;
  }

  /**
   * Get the external field name for an internal field
   */
  getExternalField(mappings: FieldMapping[], internalField: string): string {
    const mapping = mappings.find((m) => m.internalField === internalField);
    return mapping?.externalField || internalField;
  }

  /**
   * Validate that all required fields have mappings
   */
  validateMappings(
    mappings: FieldMapping[],
    requiredFields: string[]
  ): { valid: boolean; missingFields: string[] } {
    const mappedFields = new Set(mappings.map((m) => m.internalField));
    const missingFields = requiredFields.filter(
      (field) => !mappedFields.has(field)
    );

    return {
      valid: missingFields.length === 0,
      missingFields,
    };
  }

  /**
   * Get default mappings for an entity type
   */
  getDefaultMappings(
    entityType: "vendor" | "purchaseOrder" | "material"
  ): FieldMapping[] {
    switch (entityType) {
      case "vendor":
        return [...DEFAULT_VENDOR_MAPPINGS];
      case "purchaseOrder":
        return [...DEFAULT_PO_MAPPINGS];
      case "material":
        return [...DEFAULT_MATERIAL_MAPPINGS];
      default:
        return [];
    }
  }

  /**
   * Merge custom mappings with defaults (custom takes precedence)
   */
  mergeMappings(
    customMappings: FieldMapping[] | null | undefined,
    defaultMappings: FieldMapping[]
  ): FieldMapping[] {
    if (!customMappings || customMappings.length === 0) {
      return defaultMappings;
    }

    const customFieldMap = new Map(
      customMappings.map((m) => [m.internalField, m])
    );

    return defaultMappings.map((defaultMapping) => {
      const customMapping = customFieldMap.get(defaultMapping.internalField);
      return customMapping || defaultMapping;
    });
  }

  /**
   * Transform a value based on the specified type
   */
  private transformValue(
    value: any,
    transform?: "string" | "number" | "date" | "boolean"
  ): any {
    if (value === null || value === undefined) {
      return value;
    }

    switch (transform) {
      case "string":
        return String(value);
      case "number":
        const num = Number(value);
        return isNaN(num) ? null : num;
      case "date":
        if (value instanceof Date) {
          return value;
        }
        const date = new Date(value);
        return isNaN(date.getTime()) ? null : date;
      case "boolean":
        if (typeof value === "boolean") {
          return value;
        }
        if (typeof value === "number") {
          return value !== 0;
        }
        if (typeof value === "string") {
          return value.toLowerCase() === "true" || value === "1";
        }
        return Boolean(value);
      default:
        return value;
    }
  }
}
