import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, Between } from "typeorm";
import { QCInspection } from "../../entities/qc-inspection.entity";
import { GRN } from "../../entities/grn.entity";
import { GatePass } from "../../entities/gate-pass.entity";
import { GRNFieldValue } from "../../entities/grn-field-value.entity";
import {
  CreateQCInspectionDto,
  UpdateQCInspectionDto,
  CompleteQCInspectionDto,
  InspectionReportDto,
} from "./dto";

@Injectable()
export class QCService {
  constructor(
    @InjectRepository(QCInspection)
    private qcRepository: Repository<QCInspection>,
    @InjectRepository(GRN)
    private grnRepository: Repository<GRN>,
    @InjectRepository(GatePass)
    private gatePassRepository: Repository<GatePass>,
    @InjectRepository(GRNFieldValue)
    private fieldValueRepository: Repository<GRNFieldValue>
  ) {}

  private async generateInspectionNumber(tenantId: number): Promise<string> {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");

    const count = await this.qcRepository.count({
      where: { tenantId },
    });

    const sequence = String(count + 1).padStart(5, "0");
    return `QC-${year}${month}${day}-${sequence}`;
  }

  async create(
    tenantId: number,
    createDto: CreateQCInspectionDto,
    userId: number
  ): Promise<QCInspection> {
    // Verify GRN exists and is approved
    const grn = await this.grnRepository.findOne({
      where: { id: createDto.grnId, tenantId },
    });

    if (!grn) {
      throw new NotFoundException(`GRN with ID ${createDto.grnId} not found`);
    }

    if (grn.approvalStatus !== "approved") {
      throw new BadRequestException(
        "QC inspection can only be created for approved GRNs"
      );
    }

    // Check if QC inspection already exists for this GRN
    const existingInspection = await this.qcRepository.findOne({
      where: { grnId: createDto.grnId, tenantId },
    });

    if (existingInspection) {
      throw new BadRequestException(
        "QC inspection already exists for this GRN"
      );
    }

    const inspectionNumber = await this.generateInspectionNumber(tenantId);

    const inspection = this.qcRepository.create({
      tenantId,
      grnId: createDto.grnId,
      materialId: createDto.materialId,
      inspectionNumber,
      status: "pending",
      createdBy: userId,
      updatedBy: userId,
    });

    return this.qcRepository.save(inspection);
  }

  async findAll(tenantId: number): Promise<QCInspection[]> {
    return this.qcRepository.find({
      where: { tenantId },
      relations: ["grn", "grn.vendor", "material"],
      order: { createdAt: "DESC" },
    });
  }

  async findOne(tenantId: number, id: number): Promise<QCInspection> {
    const inspection = await this.qcRepository.findOne({
      where: { id, tenantId },
      relations: ["grn", "grn.vendor", "grn.purchaseOrder", "material"],
    });

    if (!inspection) {
      throw new NotFoundException(`QC inspection with ID ${id} not found`);
    }

    return inspection;
  }

  async findByStatus(
    tenantId: number,
    status: string
  ): Promise<QCInspection[]> {
    return this.qcRepository.find({
      where: { tenantId, status },
      relations: ["grn", "grn.vendor", "material"],
      order: { createdAt: "DESC" },
    });
  }

  async findPending(tenantId: number): Promise<QCInspection[]> {
    return this.qcRepository.find({
      where: { tenantId, status: "pending" },
      relations: ["grn", "grn.vendor", "material"],
      order: { createdAt: "ASC" },
    });
  }

  async findByDateRange(
    tenantId: number,
    startDate: Date,
    endDate: Date
  ): Promise<QCInspection[]> {
    return this.qcRepository.find({
      where: {
        tenantId,
        createdAt: Between(startDate, endDate),
      },
      relations: ["grn", "grn.vendor", "material"],
      order: { createdAt: "DESC" },
    });
  }

  async findByMaterial(
    tenantId: number,
    materialId: number
  ): Promise<QCInspection[]> {
    return this.qcRepository.find({
      where: { tenantId, materialId },
      relations: ["grn", "grn.vendor", "material"],
      order: { createdAt: "DESC" },
    });
  }

  async findByVendor(
    tenantId: number,
    vendorId: number
  ): Promise<QCInspection[]> {
    return this.qcRepository
      .createQueryBuilder("qc")
      .leftJoinAndSelect("qc.grn", "grn")
      .leftJoinAndSelect("grn.vendor", "vendor")
      .leftJoinAndSelect("qc.material", "material")
      .where("qc.tenant_id = :tenantId", { tenantId })
      .andWhere("grn.vendor_id = :vendorId", { vendorId })
      .orderBy("qc.created_at", "DESC")
      .getMany();
  }

  async update(
    tenantId: number,
    id: number,
    updateDto: UpdateQCInspectionDto,
    userId: number
  ): Promise<QCInspection> {
    const inspection = await this.findOne(tenantId, id);

    if (inspection.status === "pass" || inspection.status === "fail") {
      throw new BadRequestException("Cannot update a completed QC inspection");
    }

    // Update status to in_progress if still pending
    if (inspection.status === "pending") {
      inspection.status = "in_progress";
    }

    Object.assign(inspection, updateDto);
    inspection.updatedBy = userId;

    return this.qcRepository.save(inspection);
  }

  async complete(
    tenantId: number,
    id: number,
    completeDto: CompleteQCInspectionDto,
    userId: number
  ): Promise<QCInspection> {
    const inspection = await this.findOne(tenantId, id);

    if (inspection.status === "pass" || inspection.status === "fail") {
      throw new BadRequestException("QC inspection has already been completed");
    }

    // Validate failure reason if result is fail
    if (completeDto.result === "fail" && !completeDto.failureReason) {
      throw new BadRequestException("Failure reason is required when QC fails");
    }

    Object.assign(inspection, completeDto);
    inspection.status = completeDto.result;
    inspection.inspectedAt = new Date();
    inspection.inspectedBy = userId;
    inspection.updatedBy = userId;

    if (completeDto.result === "fail") {
      inspection.failureReason = completeDto.failureReason;
    }

    const savedInspection = await this.qcRepository.save(inspection);

    // Update GRN to step 7 (Inspection Report)
    const grn = await this.grnRepository.findOne({
      where: { id: inspection.grnId, tenantId },
    });
    if (grn) {
      grn.currentStep = 7;
      grn.updatedBy = userId;
      await this.grnRepository.save(grn);
    }

    return savedInspection;
  }

  async remove(tenantId: number, id: number, userId: number): Promise<void> {
    const inspection = await this.findOne(tenantId, id);

    inspection.deletedBy = userId;
    await this.qcRepository.save(inspection);

    await this.qcRepository.softRemove(inspection);
  }

  async getPendingCount(tenantId: number): Promise<number> {
    return this.qcRepository.count({
      where: { tenantId, status: "pending" },
    });
  }

  async getStats(
    tenantId: number
  ): Promise<{ status: string; count: number }[]> {
    const result = await this.qcRepository
      .createQueryBuilder("qc")
      .select("qc.status", "status")
      .addSelect("COUNT(*)", "count")
      .where("qc.tenant_id = :tenantId", { tenantId })
      .groupBy("qc.status")
      .getRawMany();

    return result;
  }

  async generateReport(
    tenantId: number,
    id: number
  ): Promise<InspectionReportDto> {
    const inspection = await this.qcRepository.findOne({
      where: { id, tenantId },
      relations: ["grn", "grn.vendor", "grn.purchaseOrder", "material"],
    });

    if (!inspection) {
      throw new NotFoundException(`QC inspection with ID ${id} not found`);
    }

    if (inspection.status !== "pass" && inspection.status !== "fail") {
      throw new BadRequestException(
        "Inspection report can only be generated for completed inspections"
      );
    }

    // Get gate pass if exists
    const gatePass = await this.gatePassRepository.findOne({
      where: { grnId: inspection.grnId, tenantId },
    });

    // Get driver name from dynamic field values
    const fieldValues = await this.fieldValueRepository.find({
      where: { grnId: inspection.grnId },
      relations: ["fieldConfig"],
    });
    const driverNameValue = fieldValues.find(
      (fv) => fv.fieldConfig?.fieldName === "driver_name"
    );
    const driverName = driverNameValue?.textValue || "";

    // Get weight values from dynamic field values (gross_weight, tare_weight)
    const grossWeightValue = fieldValues.find(
      (fv) => fv.fieldConfig?.fieldName === "gross_weight"
    );
    const tareWeightValue = fieldValues.find(
      (fv) => fv.fieldConfig?.fieldName === "tare_weight"
    );

    const grossWeight = grossWeightValue?.numberValue || null;
    const tareWeight = tareWeightValue?.numberValue || null;
    // net_weight is a static field in GRN entity
    const netWeight = inspection.grn.netWeight || null;

    const today = new Date();
    const reportNumber = `RPT-${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, "0")}${String(today.getDate()).padStart(2, "0")}-${inspection.inspectionNumber}`;

    const report: InspectionReportDto = {
      reportNumber,
      generatedAt: today,
      grn: {
        grnNumber: inspection.grn.grnNumber,
        truckNumber: inspection.grn.truckNumber,
        driverName: driverName,
        grossWeight: grossWeight,
        tareWeight: tareWeight,
        netWeight: netWeight,
        createdAt: inspection.grn.createdAt,
      },
      vendor: {
        name: inspection.grn.vendor.companyName,
        code: inspection.grn.vendor.id.toString(),
        contactPerson: inspection.grn.vendor.contactPerson,
        phone: inspection.grn.vendor.phone,
      },
      material: inspection.material
        ? {
            name: inspection.material.name,
            code: inspection.material.code,
            unit: inspection.material.unitOfMeasure,
          }
        : null,
      inspection: {
        inspectionNumber: inspection.inspectionNumber,
        status: inspection.status,
        inspectedAt: inspection.inspectedAt,
        testParameters: inspection.testParameters || [],
        moistureContent: inspection.moistureContent,
        impurityPercentage: inspection.impurityPercentage,
        qualityGrade: inspection.qualityGrade,
        remarks: inspection.remarks,
        failureReason: inspection.failureReason,
      },
      gatePass: gatePass
        ? {
            passNumber: gatePass.passNumber,
            issuedAt: gatePass.issuedAt,
            expiresAt: gatePass.expiresAt,
            status: gatePass.status,
          }
        : null,
    };

    return report;
  }
}
