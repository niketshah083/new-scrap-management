import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from "@nestjs/common";
import { Request, Response } from "express";
import { QueryFailedError } from "typeorm";

export interface ErrorResponse {
  success: boolean;
  message: string;
  data: null;
  timestamp: string;
  path: string;
  errors?: string[];
}

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger("ExceptionFilter");

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = "Internal server error";
    let errors: string[] | undefined;

    // Handle HttpException (NestJS built-in exceptions)
    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === "string") {
        message = exceptionResponse;
      } else if (typeof exceptionResponse === "object") {
        const responseObj = exceptionResponse as Record<string, unknown>;
        message = (responseObj.message as string) || message;

        // Handle validation errors (array of messages)
        if (Array.isArray(responseObj.message)) {
          errors = responseObj.message;
          message = "Validation failed";
        }
      }
    }
    // Handle TypeORM QueryFailedError
    else if (exception instanceof QueryFailedError) {
      status = HttpStatus.BAD_REQUEST;
      const queryError = exception as QueryFailedError & { code?: string };

      // Handle specific MySQL error codes
      if (queryError.code === "ER_DUP_ENTRY") {
        message = "Duplicate entry. This record already exists.";
      } else if (queryError.code === "ER_NO_REFERENCED_ROW_2") {
        message = "Referenced record does not exist.";
      } else if (queryError.code === "ER_ROW_IS_REFERENCED_2") {
        message = "Cannot delete. This record is referenced by other records.";
      } else {
        message = "Database operation failed";
      }

      this.logger.error(`Database Error: ${queryError.message}`);
    }
    // Handle generic errors
    else if (exception instanceof Error) {
      message = exception.message || message;
      this.logger.error(
        `Unhandled Error: ${exception.message}`,
        exception.stack,
      );
    }

    const errorResponse: ErrorResponse = {
      success: false,
      message,
      data: null,
      timestamp: new Date().toISOString(),
      path: request.url,
    };

    if (errors) {
      errorResponse.errors = errors;
    }

    this.logger.error(
      `${request.method} ${request.url} - ${status} - ${message}`,
    );

    response.status(status).json(errorResponse);
  }
}
