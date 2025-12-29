import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from "@nestjs/common";
import { Observable } from "rxjs";
import { map } from "rxjs/operators";

export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
}

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<
  T,
  ApiResponse<T>
> {
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<ApiResponse<T>> {
    return next.handle().pipe(
      map((data) => {
        // If response already has success/message structure, return as-is
        if (data && typeof data === "object" && "success" in data) {
          return {
            ...data,
            timestamp: data.timestamp || new Date().toISOString(),
          };
        }

        // Wrap raw data in standard response format
        return {
          success: true,
          message: "Operation completed successfully",
          data: data,
          timestamp: new Date().toISOString(),
        };
      }),
    );
  }
}
