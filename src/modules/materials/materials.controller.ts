import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Patch,
  Body,
  Param,
  Query,
  ParseIntPipe,
  Req,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from "@nestjs/swagger";
import { MaterialsService } from "./materials.service";
import { CreateMaterialDto, UpdateMaterialDto } from "./dto";
import { RolePermission } from "../../common/decorators/role-permission.decorator";
import { RequestWithUser } from "../../common/middleware/verify-token.middleware";
import { ModuleCode } from "../../common/enums/modules.enum";
import { OperationCode } from "../../common/enums/operations.enum";

@ApiTags("Materials")
@ApiBearerAuth("JWT-auth")
@Controller("materials")
export class MaterialsController {
  constructor(private readonly materialsService: MaterialsService) {}

  @Post()
  @RolePermission(`${ModuleCode.MATERIALS}:${OperationCode.CREATE}`)
  @ApiOperation({ summary: "Create a new material" })
  @ApiResponse({ status: 201, description: "Material created successfully" })
  @ApiResponse({ status: 400, description: "Bad request" })
  @ApiResponse({
    status: 409,
    description: "Material with this code already exists",
  })
  async create(
    @Body() createMaterialDto: CreateMaterialDto,
    @Req() req: RequestWithUser
  ) {
    try {
      const data = await this.materialsService.create(
        req.user.tenantId,
        createMaterialDto,
        req.user.userId
      );
      return {
        success: true,
        message: "Material created successfully",
        data,
      };
    } catch (error) {
      throw error;
    }
  }

  @Get()
  @RolePermission(`${ModuleCode.MATERIALS}:${OperationCode.LIST}`)
  @ApiOperation({ summary: "Get all materials" })
  @ApiResponse({ status: 200, description: "Materials retrieved successfully" })
  async findAll(@Req() req: RequestWithUser) {
    try {
      const data = await this.materialsService.findAll(req.user.tenantId);
      return {
        success: true,
        message: "Materials retrieved successfully",
        data,
      };
    } catch (error) {
      throw error;
    }
  }

  @Get("active")
  @RolePermission(`${ModuleCode.MATERIALS}:${OperationCode.LIST}`)
  @ApiOperation({ summary: "Get all active materials" })
  @ApiResponse({
    status: 200,
    description: "Active materials retrieved successfully",
  })
  async findActiveMaterials(@Req() req: RequestWithUser) {
    try {
      const data = await this.materialsService.findActiveMaterials(
        req.user.tenantId
      );
      return {
        success: true,
        message: "Active materials retrieved successfully",
        data,
      };
    } catch (error) {
      throw error;
    }
  }

  @Get("category")
  @RolePermission(`${ModuleCode.MATERIALS}:${OperationCode.LIST}`)
  @ApiOperation({ summary: "Get materials by category" })
  @ApiQuery({
    name: "category",
    required: true,
    description: "Material category",
  })
  @ApiResponse({ status: 200, description: "Materials retrieved successfully" })
  async findByCategory(
    @Query("category") category: string,
    @Req() req: RequestWithUser
  ) {
    try {
      const data = await this.materialsService.findByCategory(
        req.user.tenantId,
        category
      );
      return {
        success: true,
        message: "Materials retrieved successfully",
        data,
      };
    } catch (error) {
      throw error;
    }
  }

  @Get(":id")
  @RolePermission(`${ModuleCode.MATERIALS}:${OperationCode.READ}`)
  @ApiOperation({ summary: "Get a material by ID" })
  @ApiResponse({ status: 200, description: "Material retrieved successfully" })
  @ApiResponse({ status: 404, description: "Material not found" })
  async findOne(
    @Param("id", ParseIntPipe) id: number,
    @Req() req: RequestWithUser
  ) {
    try {
      const data = await this.materialsService.findOne(req.user.tenantId, id);
      return {
        success: true,
        message: "Material retrieved successfully",
        data,
      };
    } catch (error) {
      throw error;
    }
  }

  @Put(":id")
  @RolePermission(`${ModuleCode.MATERIALS}:${OperationCode.UPDATE}`)
  @ApiOperation({ summary: "Update a material" })
  @ApiResponse({ status: 200, description: "Material updated successfully" })
  @ApiResponse({ status: 404, description: "Material not found" })
  @ApiResponse({
    status: 409,
    description: "Material with this code already exists",
  })
  async update(
    @Param("id", ParseIntPipe) id: number,
    @Body() updateMaterialDto: UpdateMaterialDto,
    @Req() req: RequestWithUser
  ) {
    try {
      const data = await this.materialsService.update(
        req.user.tenantId,
        id,
        updateMaterialDto,
        req.user.userId
      );
      return {
        success: true,
        message: "Material updated successfully",
        data,
      };
    } catch (error) {
      throw error;
    }
  }

  @Delete(":id")
  @RolePermission(`${ModuleCode.MATERIALS}:${OperationCode.DELETE}`)
  @ApiOperation({ summary: "Delete a material" })
  @ApiResponse({ status: 200, description: "Material deleted successfully" })
  @ApiResponse({ status: 404, description: "Material not found" })
  async remove(
    @Param("id", ParseIntPipe) id: number,
    @Req() req: RequestWithUser
  ) {
    try {
      await this.materialsService.remove(
        req.user.tenantId,
        id,
        req.user.userId
      );
      return {
        success: true,
        message: "Material deleted successfully",
        data: null,
      };
    } catch (error) {
      throw error;
    }
  }

  @Patch(":id/toggle-status")
  @RolePermission(`${ModuleCode.MATERIALS}:${OperationCode.UPDATE}`)
  @ApiOperation({ summary: "Toggle material active status" })
  @ApiResponse({
    status: 200,
    description: "Material status updated successfully",
  })
  @ApiResponse({ status: 404, description: "Material not found" })
  async toggleStatus(
    @Param("id", ParseIntPipe) id: number,
    @Req() req: RequestWithUser
  ) {
    try {
      const data = await this.materialsService.toggleStatus(
        req.user.tenantId,
        id,
        req.user.userId
      );
      const statusMessage = data.isActive ? "activated" : "deactivated";
      return {
        success: true,
        message: `Material ${statusMessage} successfully`,
        data,
      };
    } catch (error) {
      throw error;
    }
  }
}
