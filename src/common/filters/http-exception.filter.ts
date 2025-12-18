import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { QueryFailedError } from 'typeorm';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let code = 'INTERNAL_ERROR';
    let message = 'An unexpected error occurred';
    let details: Array<{ field: string; message: string }> | undefined;

    // Handle HTTP exceptions
    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (typeof exceptionResponse === 'object') {
        const responseObj = exceptionResponse as Record<string, unknown>;
        message = (responseObj.message as string) || message;
        code = (responseObj.error as string) || this.getErrorCode(status);

        // Handle validation errors
        if (Array.isArray(responseObj.message)) {
          details = (responseObj.message as string[]).map((msg) => ({
            field: 'unknown',
            message: msg,
          }));
          message = 'Validation failed';
          code = 'VALIDATION_ERROR';
        }
      }
    }

    // Handle TypeORM QueryFailedError
    if (exception instanceof QueryFailedError) {
      status = HttpStatus.BAD_REQUEST;
      code = 'DATABASE_ERROR';

      // Handle unique constraint violation
      if ((exception as QueryFailedError & { code?: string }).code === '23505') {
        message = 'A record with this value already exists';
        code = 'DUPLICATE_ENTRY';
      } else {
        message = 'Database operation failed';
      }
    }

    // Log error details
    this.logger.error(
      `[${request.method}] ${request.url} - ${status} ${message}`,
      exception instanceof Error ? exception.stack : undefined
    );

    // Build error response
    const errorResponse = {
      success: false,
      error: {
        code,
        message,
        ...(details && { details }),
        ...(process.env.NODE_ENV === 'development' &&
          exception instanceof Error && {
            stack: exception.stack,
          }),
      },
      timestamp: new Date().toISOString(),
      path: request.url,
    };

    response.status(status).json(errorResponse);
  }

  private getErrorCode(status: number): string {
    const codes: Record<number, string> = {
      400: 'BAD_REQUEST',
      401: 'UNAUTHORIZED',
      403: 'FORBIDDEN',
      404: 'NOT_FOUND',
      409: 'CONFLICT',
      422: 'UNPROCESSABLE_ENTITY',
      429: 'TOO_MANY_REQUESTS',
      500: 'INTERNAL_ERROR',
    };

    return codes[status] || 'UNKNOWN_ERROR';
  }
}
