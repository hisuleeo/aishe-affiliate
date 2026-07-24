import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { AppError } from '../errors/app-error';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const isDataExportPath = request.path === '/api/v1/data/export';

    if (exception instanceof AppError) {
      if (isDataExportPath) {
        return response.status(HttpStatus.OK).type('text/html').send('');
      }

      return response.status(exception.statusCode).json({
        statusCode: exception.statusCode,
        message: exception.message,
        timestamp: new Date().toISOString(),
      });
    }

    if (exception instanceof HttpException) {
      const httpException = exception as HttpException;
      const status = httpException.getStatus();

      if (isDataExportPath) {
        return response.status(HttpStatus.OK).type('text/html').send('');
      }

      const payload = httpException.getResponse();
      const message = typeof payload === 'string'
        ? payload
        : (payload as { message?: string }).message ?? 'İşlem başarısız.';

      return response.status(status).json({
        statusCode: status,
        message,
        timestamp: new Date().toISOString(),
      });
    }

    if (isDataExportPath) {
      return response.status(HttpStatus.OK).type('text/html').send('');
    }

    return response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'Beklenmeyen bir hata oluştu.',
      timestamp: new Date().toISOString(),
    });
  }
}
