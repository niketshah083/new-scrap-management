import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Patch,
  Body,
  Param,
  ParseIntPipe,
  Req,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from "@nestjs/swagger";
import { PlansService } from "./plans.service";
import { CreatePlanDto, UpdatePlanDto, AssignModulesDto } from "./dto";
import { RolePermission } from "../../common/decorators/role-permission.decorator";
import { RequestWithUser } from "../../common/middleware/verify-token.middleware";
import { ModuleCode, OperationCode } from "../../common/enums";

@ApiTags("Plans")
@ApiBearerAuth("JWT-auth")
@Controller("plans")
export class PlansController {
  constructor(private readonly plansService: PlansService) {}

  @Post()
  @RolePermission(`${ModuleCode.PLAN}:${OperationCode.CREATE}`)
  @ApiOperation({ summary: "Create a new plan" })
  @ApiResponse({ status: 201, description: "Plan created successfully" })
  @ApiResponse({ status: 400, description: "Bad request" })
  async create(
    @Body() createPlanDto: CreatePlanDto,
    @Req() req: RequestWithUser
  ) {
    try {
      const data = await this.plansService.create(
        createPlanDto,
        req.user.userId
      );
      return {
        success: true,
        message: "Plan created successfully",
        data,
      };
    } catch (error) {
      throw error;
    }
  }

  @Get()
  @RolePermission(
    `${ModuleCode.PLAN}:${OperationCode.LIST}`,
    `${ModuleCode.PLAN}:${OperationCode.READ}`
  )
  @ApiOperation({ summary: "Get all plans" })
  @ApiResponse({ status: 200, description: "Plans retrieved successfully" })
  async findAll() {
    try {
      const data = await this.plansService.findAll();
      return {
        success: true,
        message: "Plans retrieved successfully",
        data,
      };
    } catch (error) {
      throw error;
    }
  }

  @Get(":id")
  @RolePermission(`${ModuleCode.PLAN}:${OperationCode.READ}`)
  @ApiOperation({ summary: "Get a plan by ID" })
  @ApiResponse({ status: 200, description: "Plan retrieved successfully" })
  @ApiResponse({ status: 404, description: "Plan not found" })
  async findOne(@Param("id", ParseIntPipe) id: number) {
    try {
      const data = await this.plansService.findOne(id);
      return {
        success: true,
        message: "Plan retrieved successfully",
        data,
      };
    } catch (error) {
      throw error;
    }
  }

  @Put(":id")
  @RolePermission(
    `${ModuleCode.PLAN}:${OperationCode.UPDATE}`,
    `${ModuleCode.PLAN}:${OperationCode.EDIT}`
  )
  @ApiOperation({ summary: "Update a plan" })
  @ApiResponse({ status: 200, description: "Plan updated successfully" })
  @ApiResponse({ status: 404, description: "Plan not found" })
  async update(
    @Param("id", ParseIntPipe) id: number,
    @Body() updatePlanDto: UpdatePlanDto,
    @Req() req: RequestWithUser
  ) {
    try {
      const data = await this.plansService.update(
        id,
        updatePlanDto,
        req.user.userId
      );
      return {
        success: true,
        message: "Plan updated successfully",
        data,
      };
    } catch (error) {
      throw error;
    }
  }

  @Delete(":id")
  @RolePermission(`${ModuleCode.PLAN}:${OperationCode.DELETE}`)
  @ApiOperation({ summary: "Delete a plan" })
  @ApiResponse({ status: 200, description: "Plan deleted successfully" })
  @ApiResponse({ status: 404, description: "Plan not found" })
  async remove(
    @Param("id", ParseIntPipe) id: number,
    @Req() req: RequestWithUser
  ) {
    try {
      await this.plansService.remove(id, req.user.userId);
      return {
        success: true,
        message: "Plan deleted successfully",
        data: null,
      };
    } catch (error) {
      throw error;
    }
  }

  @Post(":id/modules")
  @RolePermission(
    `${ModuleCode.PLAN}:${OperationCode.UPDATE}`,
    `${ModuleCode.PLAN}:${OperationCode.EDIT}`
  )
  @ApiOperation({ summary: "Assign modules to a plan" })
  @ApiResponse({ status: 200, description: "Modules assigned successfully" })
  @ApiResponse({ status: 404, description: "Plan not found" })
  async assignModules(
    @Param("id", ParseIntPipe) id: number,
    @Body() assignModulesDto: AssignModulesDto,
    @Req() req: RequestWithUser
  ) {
    try {
      const data = await this.plansService.assignModules(
        id,
        assignModulesDto,
        req.user.userId
      );
      return {
        success: true,
        message: "Modules assigned to plan successfully",
        data,
      };
    } catch (error) {
      throw error;
    }
  }

  @Delete(":id/modules")
  @RolePermission(
    `${ModuleCode.PLAN}:${OperationCode.UPDATE}`,
    `${ModuleCode.PLAN}:${OperationCode.EDIT}`
  )
  @ApiOperation({ summary: "Remove modules from a plan" })
  @ApiResponse({ status: 200, description: "Modules removed successfully" })
  @ApiResponse({ status: 404, description: "Plan not found" })
  async removeModules(
    @Param("id", ParseIntPipe) id: number,
    @Body() assignModulesDto: AssignModulesDto,
    @Req() req: RequestWithUser
  ) {
    try {
      const data = await this.plansService.removeModules(
        id,
        assignModulesDto.moduleIds,
        req.user.userId
      );
      return {
        success: true,
        message: "Modules removed from plan successfully",
        data,
      };
    } catch (error) {
      throw error;
    }
  }

  @Patch(":id/toggle-status")
  @RolePermission(
    `${ModuleCode.PLAN}:${OperationCode.UPDATE}`,
    `${ModuleCode.PLAN}:${OperationCode.EDIT}`
  )
  @ApiOperation({ summary: "Toggle plan active status" })
  @ApiResponse({ status: 200, description: "Plan status updated successfully" })
  @ApiResponse({ status: 404, description: "Plan not found" })
  async toggleStatus(
    @Param("id", ParseIntPipe) id: number,
    @Req() req: RequestWithUser
  ) {
    try {
      const data = await this.plansService.toggleStatus(id, req.user.userId);
      const statusMessage = data.isActive ? "activated" : "deactivated";
      return {
        success: true,
        message: `Plan ${statusMessage} successfully`,
        data,
      };
    } catch (error) {
      throw error;
    }
  }
}
