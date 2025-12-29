import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from "@nestjs/common";
import { Observable } from "rxjs";
import { tap, catchError } from "rxjs/operators";
import { Request } from "express";

@Injectable()
export class LogInterceptor implements NestInterceptor {
  private readonly logger = new Logger("HTTP");

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<Request>();
    const { method, url, body, ip } = request;
    const userAgent = request.get("user-agent") || "";
    const startTime = Date.now();

    this.logger.log(
      `Incoming Request: ${method} ${url} - IP: ${ip} - User-Agent: ${userAgent}`,
    );

    if (body && Object.keys(body).length > 0) {
      // Mask sensitive fields in logs
      const sanitizedBody = this.sanitizeBody(body);
      this.logger.debug(`Request Body: ${JSON.stringify(sanitizedBody)}`);
    }

    return next.handle().pipe(
      tap((response) => {
        const responseTime = Date.now() - startTime;
        this.logger.log(
          `Response: ${method} ${url} - ${responseTime}ms - Status: Success`,
        );
        this.logger.debug(`Response Body: ${JSON.stringify(response)}`);
      }),
      catchError((error) => {
        const responseTime = Date.now() - startTime;
        this.logger.error(
          `Error: ${method} ${url} - ${responseTime}ms - ${error.message}`,
        );
        throw error;
      }),
    );
  }

  private sanitizeBody(body: Record<string, unknown>): Record<string, unknown> {
    const sensitiveFields = ["password", "token", "secret", "accessToken"];
    const sanitized = { ...body };

    for (const field of sensitiveFields) {
      if (sanitized[field]) {
        sanitized[field] = "***REDACTED***";
      }
    }

    return sanitized;
  }
}
