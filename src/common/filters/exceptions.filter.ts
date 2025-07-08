import {
    Catch,
    ArgumentsHost,
    HttpException,
    HttpStatus,
    ExceptionFilter,
    Logger
} from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
    private readonly logger = new Logger(AllExceptionsFilter.name);

    constructor(private readonly httpAdapterHost: HttpAdapterHost) { }

    catch(exception: unknown, host: ArgumentsHost): void {
        const { httpAdapter } = this.httpAdapterHost;

        const ctx = host.switchToHttp();

        const httpStatus =
            exception instanceof HttpException
                ? exception.getStatus()
                : HttpStatus.INTERNAL_SERVER_ERROR;

        const responseBody = {
            statusCode: httpStatus,
            timestamp: new Date().toISOString(),
            path: httpAdapter.getRequestUrl(ctx.getRequest()),
            message:
                exception instanceof HttpException
                    ? (exception.getResponse() as any).message || exception.message
                    : 'Internal server error',
        };

        if (httpStatus === HttpStatus.INTERNAL_SERVER_ERROR) {
            this.logger.error(`Unhandled exception: ${exception instanceof Error ? exception.message : 'Unknown error'}`, (exception as Error).stack);
        } else {
            this.logger.warn(`Client error (${httpStatus}): ${responseBody.message} - Path: ${responseBody.path}`);
        }

        httpAdapter.reply(ctx.getResponse(), responseBody, httpStatus);
    }
}