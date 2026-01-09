import {
  Injectable,
  NotFoundException,
  ConflictException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Transporter } from "../../entities/transporter.entity";
import { CreateTransporterDto, UpdateTransporterDto } from "./dto";
import { DataSourceFactoryService, TransporterDto } from "../data-source";

@Injectable()
export class TransporterService {
  constructor(
    @InjectRepository(Transporter)
    private transporterRepository: Repository<Transporter>,
    private dataSourceFactory: DataSourceFactoryService
  ) {}

  async create(
    tenantId: number,
    createDto: CreateTransporterDto,
    userId: number
  ): Promise<Transporter> {
    // Check for duplicate GSTIN if provided
    if (createDto.gstin) {
      const existing = await this.transporterRepository.findOne({
        where: { tenantId, gstin: createDto.gstin },
      });

      if (existing) {
        throw new ConflictException(
          "Transporter with this GSTIN already exists"
        );
      }
    }

    const transporter = this.transporterRepository.create({
      ...createDto,
      tenantId,
      createdBy: userId,
      updatedBy: userId,
    });

    return this.transporterRepository.save(transporter);
  }

  async findAll(tenantId: number): Promise<TransporterDto[]> {
    return this.dataSourceFactory.getTransporters(tenantId);
  }

  async findActive(tenantId: number): Promise<TransporterDto[]> {
    return this.dataSourceFactory.getTransporters(tenantId, { isActive: true });
  }

  async findOne(
    tenantId: number,
    id: number | string
  ): Promise<TransporterDto> {
    const transporter = await this.dataSourceFactory.getTransporter(
      tenantId,
      id
    );

    if (!transporter) {
      throw new NotFoundException(`Transporter with ID ${id} not found`);
    }

    return transporter;
  }

  /**
   * Find internal transporter entity (for updates/deletes)
   */
  async findInternalTransporter(
    tenantId: number,
    id: number
  ): Promise<Transporter> {
    const transporter = await this.transporterRepository.findOne({
      where: { id, tenantId },
    });

    if (!transporter) {
      throw new NotFoundException(`Transporter with ID ${id} not found`);
    }

    return transporter;
  }

  async update(
    tenantId: number,
    id: number,
    updateDto: UpdateTransporterDto,
    userId: number
  ): Promise<Transporter> {
    const transporter = await this.findInternalTransporter(tenantId, id);

    // Check for duplicate GSTIN if being updated
    if (updateDto.gstin && updateDto.gstin !== transporter.gstin) {
      const existing = await this.transporterRepository.findOne({
        where: { tenantId, gstin: updateDto.gstin },
      });

      if (existing) {
        throw new ConflictException(
          "Transporter with this GSTIN already exists"
        );
      }
    }

    Object.assign(transporter, {
      ...updateDto,
      updatedBy: userId,
    });

    return this.transporterRepository.save(transporter);
  }

  async remove(tenantId: number, id: number, userId: number): Promise<void> {
    const transporter = await this.findInternalTransporter(tenantId, id);
    transporter.deletedBy = userId;
    await this.transporterRepository.save(transporter);
    await this.transporterRepository.softRemove(transporter);
  }

  async toggleStatus(
    tenantId: number,
    id: number,
    userId: number
  ): Promise<Transporter> {
    const transporter = await this.findInternalTransporter(tenantId, id);
    transporter.isActive = !transporter.isActive;
    transporter.updatedBy = userId;
    return this.transporterRepository.save(transporter);
  }
}
