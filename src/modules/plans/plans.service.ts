import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, In } from "typeorm";
import { Plan } from "../../entities/plan.entity";
import { Module } from "../../entities/module.entity";
import { CreatePlanDto, UpdatePlanDto, AssignModulesDto } from "./dto";

@Injectable()
export class PlansService {
  constructor(
    @InjectRepository(Plan)
    private planRepository: Repository<Plan>,
    @InjectRepository(Module)
    private moduleRepository: Repository<Module>,
  ) {}

  async create(createPlanDto: CreatePlanDto, userId: number): Promise<Plan> {
    const { moduleIds, ...planData } = createPlanDto;

    const plan = this.planRepository.create({
      ...planData,
      createdBy: userId,
      updatedBy: userId,
    });

    // If moduleIds provided, fetch and assign modules
    if (moduleIds && moduleIds.length > 0) {
      const modules = await this.moduleRepository.find({
        where: { id: In(moduleIds) },
      });
      plan.modules = modules;
    }

    return this.planRepository.save(plan);
  }

  async findAll(): Promise<Plan[]> {
    return this.planRepository.find({
      relations: ["modules"],
      order: { createdAt: "DESC" },
    });
  }

  async findOne(id: number): Promise<Plan> {
    const plan = await this.planRepository.findOne({
      where: { id },
      relations: ["modules"],
    });

    if (!plan) {
      throw new NotFoundException(`Plan with ID ${id} not found`);
    }

    return plan;
  }

  async update(
    id: number,
    updatePlanDto: UpdatePlanDto,
    userId: number,
  ): Promise<Plan> {
    const plan = await this.findOne(id);
    const { moduleIds, ...planData } = updatePlanDto;

    Object.assign(plan, {
      ...planData,
      updatedBy: userId,
    });

    // If moduleIds provided, update modules
    if (moduleIds !== undefined) {
      if (moduleIds.length > 0) {
        const modules = await this.moduleRepository.find({
          where: { id: In(moduleIds) },
        });
        plan.modules = modules;
      } else {
        plan.modules = [];
      }
    }

    return this.planRepository.save(plan);
  }

  async remove(id: number, userId: number): Promise<void> {
    const plan = await this.findOne(id);

    // Soft delete - update deletedBy before removing
    plan.deletedBy = userId;
    await this.planRepository.save(plan);

    await this.planRepository.softRemove(plan);
  }

  async assignModules(
    id: number,
    assignModulesDto: AssignModulesDto,
    userId: number,
  ): Promise<Plan> {
    const plan = await this.findOne(id);

    const modules = await this.moduleRepository.find({
      where: { id: In(assignModulesDto.moduleIds) },
    });

    plan.modules = modules;
    plan.updatedBy = userId;

    return this.planRepository.save(plan);
  }

  async removeModules(
    id: number,
    moduleIds: number[],
    userId: number,
  ): Promise<Plan> {
    const plan = await this.findOne(id);

    plan.modules = plan.modules.filter(
      (module) => !moduleIds.includes(module.id),
    );
    plan.updatedBy = userId;

    return this.planRepository.save(plan);
  }

  async toggleStatus(id: number, userId: number): Promise<Plan> {
    const plan = await this.findOne(id);
    plan.isActive = !plan.isActive;
    plan.updatedBy = userId;
    return this.planRepository.save(plan);
  }
}
