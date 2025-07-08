import { HttpAdapterHost, NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe } from '@nestjs/common';
import * as compression from 'compression';
import helmet from 'helmet';
import * as cookieParser from 'cookie-parser';
import { AllExceptionsFilter } from './common/filters/exceptions.filter';






async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // Security Middlewares
  app.use(helmet());
  app.enableCors({
    origin: configService.get<string>('CORS_ORIGIN').split(','),
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });
  app.use(compression()); // Gzip compression for responses

  // Cookies
  app.use(cookieParser());

  // Prefix all routes with /api/v1
  app.setGlobalPrefix('api/v1');


  // Global Pipes for DTO validation
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true, 
    forbidNonWhitelisted: true,
    transform: true, 
  }));


  // GarceFul ShutDown
  app.enableShutdownHooks();

  const httpAdapter = app.get(HttpAdapterHost);
  app.useGlobalFilters(new AllExceptionsFilter(httpAdapter));

  const port = configService.get<number>('PORT');
  await app.listen(port);
  console.log(`Application is running on: ${port}`);
}
bootstrap();
