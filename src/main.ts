import { HttpAdapterHost, NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe } from '@nestjs/common';
import * as compression from 'compression';
import helmet from 'helmet';
import * as cookieParser from 'cookie-parser';
import { AllExceptionsFilter } from './common/filters/exceptions.filter';
import { WinstonLogger } from './common/logger/winston.logger';
import { doubleCsrf } from 'csrf-csrf';
import { join } from 'path';
import * as express from 'express';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { SanitizeMongoMiddleware } from './common/middleware/express-mongo-sanitize ';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: new WinstonLogger('AppBootstrap')
  });
  const configService = app.get(ConfigService);

  const config = new DocumentBuilder()
    .setTitle('KiK E-Commerce')
    .setDescription('The kik API description')
    .addTag('kik')
    .build();
  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, documentFactory);

  // Static Folder For Images
  app.use('/public', express.static(join(process.cwd(), 'public')));

  // Security Middlewares
  app.use(helmet());
  app.enableCors({
    origin:
      process.env.NODE_ENV === 'development'
        ? true // allows all origins in development
        : configService.get<string>('CORS_ORIGIN').split(','),
    credentials: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE'
  });

  app.use(new SanitizeMongoMiddleware().use);

  // CSRF Protection
  // const {
  //   // invalidCsrfTokenError,
  //   // generateToken,
  //   // validateRequest,
  //   doubleCsrfProtection
  // } = doubleCsrf({
  //   get
  //     : (req) => req.secret,
  //   cookieName: '_csrf',
  //   cookieOptions: {
  //     httpOnly: true,
  //     sameSite: 'lax',
  //     secure: process.env.NODE_ENV === 'production',
  //   },
  //   tokenValidFor: 60 * 60 * 24,
  //   ignoreMethods: ['GET', 'HEAD', 'OPTIONS'],
  // });

  // app.use(doubleCsrfProtection);

  app.use(compression()); // Gzip compression for responses

  // Cookies
  app.use(cookieParser());

  // Prefix all routes with /api/v1
  app.setGlobalPrefix('api/v1');

  // Global Pipes for DTO validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true
      }
    })
  );

  // GarceFul ShutDown
  app.enableShutdownHooks();

  const httpAdapter = app.get(HttpAdapterHost);
  app.useGlobalFilters(new AllExceptionsFilter(httpAdapter));

  const port = configService.get<number>('PORT');
  await app.listen(port);
  console.log(`Application is running on: ${port}`);
}
bootstrap();
