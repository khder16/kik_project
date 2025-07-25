import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { UserModule } from './user/user.module';
import { StoreModule } from './store/store.module';
import { ProductModule } from './product/product.module';
import { CartModule } from './cart/cart.module';
import { OrderModule } from './order/order.module';
import { MailerModule } from '@nestjs-modules/mailer';
import { WishlistController } from './wishlist/wishlist.controller';
import { WishlistModule } from './wishlist/wishlist.module';
import { NotificationModule } from './notification/notification.module';
import { SystempagesController } from './systempages/systempages.controller';
import { SystempagesService } from './systempages/systempages.service';
import { SystempagesModule } from './systempages/systempages.module';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { OtpModule } from './otp/otp.module';
import configuration from './config/configuration';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { ImageProcessingService } from './product/image-process.service';
import { CacheModule } from '@nestjs/cache-manager';
import { ReviewsModule } from './reviews/reviews.module';
import { ScheduleModule } from '@nestjs/schedule';




@Module({
  imports: [AuthModule,
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration]
    }),

    // JWT Config Setup
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('jwt.secret'),
        signOptions: { expiresIn: configService.get<string>('jwt.expiresIn') },
      }),
      inject: [ConfigService],
    }),

    // NodeMailer Config Setup
    MailerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        transport: {
          service: 'gmail',
          auth: {
            user: configService.get<string>('nodemailer.emailUser'),
            pass: configService.get<string>('nodemailer.emailAppPassword'),
          },
        },
      }),
    }),

    // MongoDB Configusing mongoose Config Setup
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>('database.MONGO_URI'),
        // uri: 'mongodb://localhost:27017/kikapp',
        maxPoolSize: 10,
        retryAttempts: 3,
        retryDelay: 1000,
      }),
      inject: [ConfigService],
    }),

    // Throttler for rate limit Config Setup
    ThrottlerModule.forRoot({
      throttlers: [
        {
          ttl: 60000,
          limit: 100,
        }
      ]
    }),
    // Cache Config Setup
    CacheModule.register({
      isGlobal: true
    }),
    // Schedule for sheduling tasks
    ScheduleModule.forRoot(),

    UserModule,
    StoreModule,
    ProductModule,
    CartModule,
    OrderModule,
    WishlistModule,
    NotificationModule,
    SystempagesModule,
    OtpModule,
    ReviewsModule
  ],
  controllers: [AppController, WishlistController, SystempagesController],
  providers: [AppService, SystempagesService, JwtService, ImageProcessingService, {
    provide: APP_GUARD,
    useClass: ThrottlerGuard,
  }],
})
export class AppModule { }
