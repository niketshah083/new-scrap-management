import {
  Controller,
  Post,
  Delete,
  Param,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
  Req,
  BadRequestException,
} from "@nestjs/common";
import { FileInterceptor, FilesInterceptor } from "@nestjs/platform-express";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiConsumes,
  ApiBody,
} from "@nestjs/swagger";
import {
  UploadsService,
  UploadedFile as IUploadedFile,
} from "./uploads.service";
import { RolePermission } from "../../common/decorators/role-permission.decorator";
import { RequestWithUser } from "../../common/middleware/verify-token.middleware";
import { ModuleCode, OperationCode } from "../../common/enums";

@ApiTags("Uploads")
@ApiBearerAuth("JWT-auth")
@Controller("uploads")
export class UploadsController {
  constructor(private readonly uploadsService: UploadsService) {}

  @Post("file")
  @RolePermission(`${ModuleCode.UPLOADS}:${OperationCode.CREATE}`)
  @UseInterceptors(FileInterceptor("file"))
  @ApiConsumes("multipart/form-data")
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        file: {
          type: "string",
          format: "binary",
        },
        folder: {
          type: "string",
          example: "general",
        },
      },
    },
  })
  @ApiOperation({ summary: "Upload a single file" })
  @ApiResponse({ status: 201, description: "File uploaded successfully" })
  @ApiResponse({ status: 400, description: "Invalid file" })
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Req() req: RequestWithUser
  ) {
    try {
      if (!file) {
        throw new BadRequestException("No file provided");
      }

      const uploadedFile: IUploadedFile = {
        fieldname: file.fieldname,
        originalname: file.originalname,
        encoding: file.encoding,
        mimetype: file.mimetype,
        buffer: file.buffer,
        size: file.size,
      };

      const folder = req.body?.folder || "general";
      const data = await this.uploadsService.uploadFile(
        uploadedFile,
        req.user.tenantId,
        folder
      );

      return {
        success: true,
        message: "File uploaded successfully",
        data,
      };
    } catch (error) {
      throw error;
    }
  }

  @Post("image")
  @RolePermission(`${ModuleCode.UPLOADS}:${OperationCode.CREATE}`)
  @UseInterceptors(FileInterceptor("file"))
  @ApiConsumes("multipart/form-data")
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        file: {
          type: "string",
          format: "binary",
        },
        folder: {
          type: "string",
          example: "images",
        },
      },
    },
  })
  @ApiOperation({ summary: "Upload an image file" })
  @ApiResponse({ status: 201, description: "Image uploaded successfully" })
  @ApiResponse({ status: 400, description: "Invalid image file" })
  async uploadImage(
    @UploadedFile() file: Express.Multer.File,
    @Req() req: RequestWithUser
  ) {
    try {
      if (!file) {
        throw new BadRequestException("No file provided");
      }

      const uploadedFile: IUploadedFile = {
        fieldname: file.fieldname,
        originalname: file.originalname,
        encoding: file.encoding,
        mimetype: file.mimetype,
        buffer: file.buffer,
        size: file.size,
      };

      const folder = req.body?.folder || "images";
      const data = await this.uploadsService.uploadImage(
        uploadedFile,
        req.user.tenantId,
        folder
      );

      return {
        success: true,
        message: "Image uploaded successfully",
        data,
      };
    } catch (error) {
      throw error;
    }
  }

  @Post("document")
  @RolePermission(`${ModuleCode.UPLOADS}:${OperationCode.CREATE}`)
  @UseInterceptors(FileInterceptor("file"))
  @ApiConsumes("multipart/form-data")
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        file: {
          type: "string",
          format: "binary",
        },
        folder: {
          type: "string",
          example: "documents",
        },
      },
    },
  })
  @ApiOperation({ summary: "Upload a document file" })
  @ApiResponse({ status: 201, description: "Document uploaded successfully" })
  @ApiResponse({ status: 400, description: "Invalid document file" })
  async uploadDocument(
    @UploadedFile() file: Express.Multer.File,
    @Req() req: RequestWithUser
  ) {
    try {
      if (!file) {
        throw new BadRequestException("No file provided");
      }

      const uploadedFile: IUploadedFile = {
        fieldname: file.fieldname,
        originalname: file.originalname,
        encoding: file.encoding,
        mimetype: file.mimetype,
        buffer: file.buffer,
        size: file.size,
      };

      const folder = req.body?.folder || "documents";
      const data = await this.uploadsService.uploadDocument(
        uploadedFile,
        req.user.tenantId,
        folder
      );

      return {
        success: true,
        message: "Document uploaded successfully",
        data,
      };
    } catch (error) {
      throw error;
    }
  }

  @Post("multiple")
  @RolePermission(`${ModuleCode.UPLOADS}:${OperationCode.CREATE}`)
  @UseInterceptors(FilesInterceptor("files", 10))
  @ApiConsumes("multipart/form-data")
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        files: {
          type: "array",
          items: {
            type: "string",
            format: "binary",
          },
        },
        folder: {
          type: "string",
          example: "general",
        },
      },
    },
  })
  @ApiOperation({ summary: "Upload multiple files (max 10)" })
  @ApiResponse({ status: 201, description: "Files uploaded successfully" })
  @ApiResponse({ status: 400, description: "Invalid files" })
  async uploadMultiple(
    @UploadedFiles() files: Express.Multer.File[],
    @Req() req: RequestWithUser
  ) {
    try {
      if (!files || files.length === 0) {
        throw new BadRequestException("No files provided");
      }

      const uploadedFiles: IUploadedFile[] = files.map((file) => ({
        fieldname: file.fieldname,
        originalname: file.originalname,
        encoding: file.encoding,
        mimetype: file.mimetype,
        buffer: file.buffer,
        size: file.size,
      }));

      const folder = req.body?.folder || "general";
      const data = await this.uploadsService.uploadMultiple(
        uploadedFiles,
        req.user.tenantId,
        folder
      );

      return {
        success: true,
        message: `${data.length} file(s) uploaded successfully`,
        data,
      };
    } catch (error) {
      throw error;
    }
  }

  @Delete(":key(*)")
  @RolePermission(`${ModuleCode.UPLOADS}:${OperationCode.DELETE}`)
  @ApiOperation({ summary: "Delete a file by key" })
  @ApiResponse({ status: 200, description: "File deleted successfully" })
  @ApiResponse({ status: 404, description: "File not found" })
  async deleteFile(@Param("key") key: string) {
    try {
      const deleted = await this.uploadsService.deleteFile(key);

      if (!deleted) {
        return {
          success: false,
          message: "File not found",
          data: null,
        };
      }

      return {
        success: true,
        message: "File deleted successfully",
        data: null,
      };
    } catch (error) {
      throw error;
    }
  }
}
