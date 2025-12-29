import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, LessThan } from "typeorm";
import { GatePass } from "../../entities/gate-pass.entity";
import { GRN } from "../../entities/grn.entity";
import { CreateGatePassDto } from "./dto";

@Injectable()
export class GatePassService {
  constructor(
    @InjectRepository(GatePass)
    private gatePassRepository: Repository<GatePass>,
    @InjectRepository(GRN)
    private grnRepository: Repository<GRN>
  ) {}

  private async generatePassNumber(tenantId: number): Promise<string> {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");

    const count = await this.gatePassRepository.count({
      where: { tenantId },
    });

    const sequence = String(count + 1).padStart(5, "0");
    return `GP-${year}${month}${day}-${sequence}`;
  }

  async create(
    tenantId: number,
    createDto: CreateGatePassDto,
    userId: number
  ): Promise<GatePass> {
    // Verify GRN exists and is approved
    const grn = await this.grnRepository.findOne({
      where: { id: createDto.grnId, tenantId },
    });

    if (!grn) {
      throw new NotFoundException(`GRN with ID ${createDto.grnId} not found`);
    }

    if (grn.approvalStatus !== "approved") {
      throw new BadRequestException(
        "Gate pass can only be generated for approved GRNs"
      );
    }

    // Check if gate pass already exists for this GRN
    const existingPass = await this.gatePassRepository.findOne({
      where: { grnId: createDto.grnId, tenantId },
    });

    if (existingPass) {
      throw new BadRequestException("Gate pass already exists for this GRN");
    }

    const passNumber = await this.generatePassNumber(tenantId);
    const expiryMinutes = createDto.expiryMinutes || 60;
    const issuedAt = new Date();
    const expiresAt = new Date(issuedAt.getTime() + expiryMinutes * 60 * 1000);

    const gatePass = this.gatePassRepository.create({
      tenantId,
      grnId: createDto.grnId,
      passNumber,
      issuedAt,
      expiresAt,
      expiryMinutes,
      status: "active",
      notes: createDto.notes,
      createdBy: userId,
      updatedBy: userId,
    });

    const savedPass = await this.gatePassRepository.save(gatePass);

    // Update GRN to step 6 (Gate Pass)
    grn.currentStep = 6;
    grn.updatedBy = userId;
    await this.grnRepository.save(grn);

    return savedPass;
  }

  async findAll(tenantId: number): Promise<GatePass[]> {
    return this.gatePassRepository.find({
      where: { tenantId },
      relations: ["grn", "grn.vendor"],
      order: { createdAt: "DESC" },
    });
  }

  async findOne(tenantId: number, id: number): Promise<GatePass> {
    const gatePass = await this.gatePassRepository.findOne({
      where: { id, tenantId },
      relations: ["grn", "grn.vendor", "grn.purchaseOrder"],
    });

    if (!gatePass) {
      throw new NotFoundException(`Gate pass with ID ${id} not found`);
    }

    return gatePass;
  }

  async findByPassNumber(
    tenantId: number,
    passNumber: string
  ): Promise<GatePass> {
    const gatePass = await this.gatePassRepository.findOne({
      where: { passNumber, tenantId },
      relations: ["grn", "grn.vendor", "grn.purchaseOrder"],
    });

    if (!gatePass) {
      throw new NotFoundException(
        `Gate pass with number ${passNumber} not found`
      );
    }

    return gatePass;
  }

  async findByGrnId(tenantId: number, grnId: number): Promise<GatePass | null> {
    return this.gatePassRepository.findOne({
      where: { grnId, tenantId },
      relations: ["grn", "grn.vendor", "grn.purchaseOrder"],
    });
  }

  async findActive(tenantId: number): Promise<GatePass[]> {
    const now = new Date();
    return this.gatePassRepository.find({
      where: { tenantId, status: "active" },
      relations: ["grn", "grn.vendor"],
      order: { expiresAt: "ASC" },
    });
  }

  async findExpired(tenantId: number): Promise<GatePass[]> {
    const now = new Date();
    return this.gatePassRepository.find({
      where: {
        tenantId,
        status: "active",
        expiresAt: LessThan(now),
      },
      relations: ["grn", "grn.vendor"],
    });
  }

  async verify(
    tenantId: number,
    passNumber: string
  ): Promise<{
    valid: boolean;
    gatePass: GatePass;
    message: string;
  }> {
    const gatePass = await this.findByPassNumber(tenantId, passNumber);
    const now = new Date();

    if (gatePass.status === "used") {
      return {
        valid: false,
        gatePass,
        message: "Gate pass has already been used",
      };
    }

    if (gatePass.status === "expired" || gatePass.expiresAt < now) {
      // Update status to expired if not already
      if (gatePass.status !== "expired") {
        gatePass.status = "expired";
        await this.gatePassRepository.save(gatePass);
      }
      return {
        valid: false,
        gatePass,
        message: "Gate pass has expired",
      };
    }

    return {
      valid: true,
      gatePass,
      message: "Gate pass is valid",
    };
  }

  async markAsUsed(
    tenantId: number,
    id: number,
    userId: number,
    notes?: string
  ): Promise<GatePass> {
    const gatePass = await this.findOne(tenantId, id);
    const now = new Date();

    if (gatePass.status === "used") {
      throw new BadRequestException("Gate pass has already been used");
    }

    if (gatePass.status === "expired" || gatePass.expiresAt < now) {
      throw new BadRequestException("Gate pass has expired");
    }

    gatePass.status = "used";
    gatePass.usedAt = now;
    gatePass.usedBy = userId;
    gatePass.updatedBy = userId;
    if (notes) {
      gatePass.notes = gatePass.notes ? `${gatePass.notes}\n${notes}` : notes;
    }

    const savedPass = await this.gatePassRepository.save(gatePass);

    // Update GRN status to completed
    const grn = await this.grnRepository.findOne({
      where: { id: gatePass.grnId, tenantId },
    });
    if (grn) {
      grn.status = "completed";
      grn.currentStep = 7;
      grn.updatedBy = userId;
      await this.grnRepository.save(grn);
    }

    return savedPass;
  }

  async updateExpiredPasses(tenantId: number): Promise<number> {
    const now = new Date();
    const result = await this.gatePassRepository.update(
      {
        tenantId,
        status: "active",
        expiresAt: LessThan(now),
      },
      { status: "expired" }
    );
    return result.affected || 0;
  }

  async remove(tenantId: number, id: number, userId: number): Promise<void> {
    const gatePass = await this.findOne(tenantId, id);

    gatePass.deletedBy = userId;
    await this.gatePassRepository.save(gatePass);

    await this.gatePassRepository.softRemove(gatePass);
  }

  async getActiveCount(tenantId: number): Promise<number> {
    const now = new Date();
    return this.gatePassRepository.count({
      where: {
        tenantId,
        status: "active",
      },
    });
  }
}
