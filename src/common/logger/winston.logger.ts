import { Injectable, LoggerService } from '@nestjs/common';
import { createLogger, format, transports, Logger } from 'winston';
import 'winston-daily-rotate-file'; // For daily file rotation

@Injectable()
export class WinstonLogger implements LoggerService {
    private readonly logger: Logger;

    constructor(private context?: string) {
        this.logger = createLogger({
            level: process.env.NODE_ENV === 'production' ? 'info' : 'debug', // Adjust log level for prod
            format: format.combine(
                format.timestamp(),
                format.json() 
            ),
            transports: [
                new transports.Console({
                    format: format.combine(
                        format.colorize(),
                        format.simple() // For local development readability
                    ),
                }),
                new transports.DailyRotateFile({
                    filename: 'logs/%DATE%-error.log',
                    level: 'error',
                    datePattern: 'YYYY-MM-DD',
                    zippedArchive: true,
                    maxSize: '20m',
                    maxFiles: '14d',
                }),
                new transports.DailyRotateFile({
                    filename: 'logs/%DATE%-combined.log',
                    datePattern: 'YYYY-MM-DD',
                    zippedArchive: true,
                    maxSize: '20m',
                    maxFiles: '14d',  // Log File live for 14 Day
                }),
            ],
        });
    }

    log(message: any, context?: string) {
        this.logger.info(message, { context: context || this.context });
    }

    error(message: any, trace?: string, context?: string) {
        this.logger.error(message, { trace, context: context || this.context });
    }

    warn(message: any, context?: string) {
        this.logger.warn(message, { context: context || this.context });
    }

    debug(message: any, context?: string) {
        if (process.env.NODE_ENV !== 'production') {
            this.logger.debug(message, { context: context || this.context });
        }
    }

    verbose(message: any, context?: string) {
        if (process.env.NODE_ENV !== 'production') {
            this.logger.verbose(message, { context: context || this.context });
        }
    }

    // Method to set context if needed dynamically
    setContext(context: string) {
        this.context = context;
    }
}