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
import { VendorsService } from "./vendors.service";
import { CreateVendorDto, UpdateVendorDto } from "./dto";
import { RolePermission } from "../../common/decorators/role-permission.decorator";
import { RequestWithUser } from "../../common/middleware/verify-token.middleware";
import { ModuleCode } from "../../common/enums/modules.enum";
import { OperationCode } from "../../common/enums/operations.enum";

@ApiTags("Vendors")
@ApiBearerAuth("JWT-auth")
@Controller("vendors")
export class VendorsController {
  constructor(private readonly vendorsService: VendorsService) {}

  @Post()
  @RolePermission(`${ModuleCode.Vendor}:${OperationCode.Create}`)
  @ApiOperation({ summary: "Create a new vendor" })
  @ApiResponse({ status: 201, description: "Vendor created successfully" })
  @ApiResponse({ status: 400, description: "Bad request" })
  @ApiResponse({
    status: 409,
    description: "Vendor with this email already exists",
  })
  async create(
    @Body() createVendorDto: CreateVendorDto,
    @Req() req: RequestWithUser
  ) {
    try {
      const data = await this.vendorsService.create(
        req.user.tenantId,
        createVendorDto,
        req.user.userId
      );
      return {
        success: true,
        message: "Vendor created successfully",
        data,
      };
    } catch (error) {
      throw error;
    }
  }

  @Get()
  @RolePermission(`${ModuleCode.Vendor}:${OperationCode.List}`)
  @ApiOperation({ summary: "Get all vendors" })
  @ApiResponse({ status: 200, description: "Vendors retrieved successfully" })
  async findAll(@Req() req: RequestWithUser) {
    try {
      const data = await this.vendorsService.findAll(req.user.tenantId);
      return {
        success: true,
        message: "Vendors retrieved successfully",
        data,
      };
    } catch (error) {
      throw error;
    }
  }

  @Get("active")
  @RolePermission(`${ModuleCode.Vendor}:${OperationCode.List}`)
  @ApiOperation({ summary: "Get all active vendors" })
  @ApiResponse({
    status: 200,
    description: "Active vendors retrieved successfully",
  })
  async findActiveVendors(@Req() req: RequestWithUser) {
    try {
      const data = await this.vendorsService.findActiveVendors(
        req.user.tenantId
      );
      return {
        success: true,
        message: "Active vendors retrieved successfully",
        data,
      };
    } catch (error) {
      throw error;
    }
  }

  @Get(":id")
  @RolePermission(`${ModuleCode.Vendor}:${OperationCode.Read}`)
  @ApiOperation({ summary: "Get a vendor by ID" })
  @ApiResponse({ status: 200, description: "Vendor retrieved successfully" })
  @ApiResponse({ status: 404, description: "Vendor not found" })
  async findOne(
    @Param("id", ParseIntPipe) id: number,
    @Req() req: RequestWithUser
  ) {
    try {
      const data = await this.vendorsService.findOne(req.user.tenantId, id);
      return {
        success: true,
        message: "Vendor retrieved successfully",
        data,
      };
    } catch (error) {
      throw error;
    }
  }

  @Put(":id")
  @RolePermission(`${ModuleCode.Vendor}:${OperationCode.Update}`)
  @ApiOperation({ summary: "Update a vendor" })
  @ApiResponse({ status: 200, description: "Vendor updated successfully" })
  @ApiResponse({ status: 404, description: "Vendor not found" })
  @ApiResponse({
    status: 409,
    description: "Vendor with this email already exists",
  })
  async update(
    @Param("id", ParseIntPipe) id: number,
    @Body() updateVendorDto: UpdateVendorDto,
    @Req() req: RequestWithUser
  ) {
    try {
      const data = await this.vendorsService.update(
        req.user.tenantId,
        id,
        updateVendorDto,
        req.user.userId
      );
      return {
        success: true,
        message: "Vendor updated successfully",
        data,
      };
    } catch (error) {
      throw error;
    }
  }

  @Delete(":id")
  @RolePermission(`${ModuleCode.Vendor}:${OperationCode.Delete}`)
  @ApiOperation({ summary: "Delete a vendor" })
  @ApiResponse({ status: 200, description: "Vendor deleted successfully" })
  @ApiResponse({ status: 404, description: "Vendor not found" })
  async remove(
    @Param("id", ParseIntPipe) id: number,
    @Req() req: RequestWithUser
  ) {
    try {
      await this.vendorsService.remove(req.user.tenantId, id, req.user.userId);
      return {
        success: true,
        message: "Vendor deleted successfully",
        data: null,
      };
    } catch (error) {
      throw error;
    }
  }

  @Patch(":id/toggle-status")
  @RolePermission(`${ModuleCode.Vendor}:${OperationCode.Update}`)
  @ApiOperation({ summary: "Toggle vendor active status" })
  @ApiResponse({
    status: 200,
    description: "Vendor status updated successfully",
  })
  @ApiResponse({ status: 404, description: "Vendor not found" })
  async toggleStatus(
    @Param("id", ParseIntPipe) id: number,
    @Req() req: RequestWithUser
  ) {
    try {
      const data = await this.vendorsService.toggleStatus(
        req.user.tenantId,
        id,
        req.user.userId
      );
      const statusMessage = data.isActive ? "activated" : "deactivated";
      return {
        success: true,
        message: `Vendor ${statusMessage} successfully`,
        data,
      };
    } catch (error) {
      throw error;
    }
  }
}
