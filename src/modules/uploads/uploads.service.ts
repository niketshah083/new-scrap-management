import { Injectable, BadRequestException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { v4 as uuidv4 } from "uuid";
import { S3Service } from "../../common/services/s3.service";
import { FileConstants } from "../../common/constants/file.constant";
import { Readable } from "stream";

export interface UploadedFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  buffer: Buffer;
  size: number;
}

export interface UploadResult {
  url: string;
  key: string;
  originalName: string;
  mimeType: string;
  size: number;
}

@Injectable()
export class UploadsService {
  private bucketName: string;

  constructor(
    private configService: ConfigService,
    private s3Service: S3Service
  ) {
    this.bucketName =
      this.configService.get("AWS_S3_BUCKET") || "scrap-management-uploads";
  }

  private validateFile(
    file: UploadedFile,
    allowedMimeTypes: string[],
    maxSize: number
  ): void {
    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        `Invalid file type. Allowed types: ${allowedMimeTypes.join(", ")}`
      );
    }

    if (file.size > maxSize) {
      throw new BadRequestException(
        `File too large. Maximum size: ${maxSize / (1024 * 1024)}MB`
      );
    }
  }

  private generateFileKey(
    tenantId: number,
    folder: string,
    originalName: string
  ): string {
    const ext = originalName.substring(originalName.lastIndexOf("."));
    const timestamp = Date.now();
    const uuid = uuidv4().substring(0, 8);
    return `tenant-${tenantId}/${folder}/${timestamp}-${uuid}${ext}`;
  }

  async uploadFile(
    file: UploadedFile,
    tenantId: number,
    folder: string = "general"
  ): Promise<UploadResult> {
    const allowedMimeTypes = [
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ];
    const maxSize = FileConstants.FILE_SIZE.TEN_MB;

    this.validateFile(file, allowedMimeTypes, maxSize);

    const fileKey = this.generateFileKey(tenantId, folder, file.originalname);

    // Convert buffer to readable stream
    const stream = Readable.from(file.buffer);

    // Upload to S3
    await this.s3Service.uploadS3Stream(
      stream,
      file.mimetype,
      this.bucketName,
      fileKey
    );

    // Get signed URL for the uploaded file
    const signedUrl = await this.s3Service.getFilePathFromUrl(
      fileKey,
      this.bucketName,
      3600 // 1 hour expiry
    );

    return {
      url: signedUrl,
      key: fileKey,
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
    };
  }

  async uploadImage(
    file: UploadedFile,
    tenantId: number,
    folder: string = "images"
  ): Promise<UploadResult> {
    const allowedMimeTypes = [
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
    ];
    const maxSize = 5 * 1024 * 1024; // 5MB

    this.validateFile(file, allowedMimeTypes, maxSize);

    return this.uploadFile(file, tenantId, folder);
  }

  async uploadDocument(
    file: UploadedFile,
    tenantId: number,
    folder: string = "documents"
  ): Promise<UploadResult> {
    const allowedMimeTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ];
    const maxSize = FileConstants.FILE_SIZE.TEN_MB;

    this.validateFile(file, allowedMimeTypes, maxSize);

    return this.uploadFile(file, tenantId, folder);
  }

  async uploadMultiple(
    files: UploadedFile[],
    tenantId: number,
    folder: string = "general"
  ): Promise<UploadResult[]> {
    const results: UploadResult[] = [];

    for (const file of files) {
      const result = await this.uploadFile(file, tenantId, folder);
      results.push(result);
    }

    return results;
  }

  async deleteFile(key: string): Promise<boolean> {
    try {
      await this.s3Service.deleteS3File(this.bucketName, key);
      return true;
    } catch (error) {
      console.error("Error deleting file from S3:", error);
      return false;
    }
  }

  /**
   * Generate a signed URL for accessing a file from S3
   */
  async getFileUrl(key: string): Promise<string> {
    if (!key) return "";
    // If key already contains the full URL, return as is
    if (key.startsWith("http://") || key.startsWith("https://")) {
      return key;
    }
    try {
      return await this.s3Service.getFilePathFromUrl(
        key,
        this.bucketName,
        3600 // 1 hour expiry
      );
    } catch (error) {
      console.error("Error getting signed URL:", error);
      return "";
    }
  }

  /**
   * Generate signed URLs for multiple file keys (comma-separated)
   */
  async getFileUrls(keys: string): Promise<{ key: string; url: string }[]> {
    if (!keys) return [];
    const keyArray = keys
      .split(",")
      .map((k) => k.trim())
      .filter((k) => k);

    const results: { key: string; url: string }[] = [];
    for (const key of keyArray) {
      const url = await this.getFileUrl(key);
      results.push({ key, url });
    }
    return results;
  }

  /**
   * Get file from S3 as base64 string (for PDF generation, bypasses CORS)
   */
  async getFileAsBase64(
    key: string
  ): Promise<{ base64: string; contentType: string }> {
    if (!key) {
      throw new BadRequestException("File key is required");
    }

    try {
      const { buffer, contentType } = await this.s3Service.getFileAsBuffer(
        this.bucketName,
        key
      );

      const base64 = buffer.toString("base64");
      const dataUrl = `data:${contentType};base64,${base64}`;

      return {
        base64: dataUrl,
        contentType,
      };
    } catch (error) {
      console.error("Error getting file as base64:", error);
      throw new BadRequestException(`Failed to get file: ${error.message}`);
    }
  }
}
