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
// import { OrderModule } from './order/order.module';
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
import { SellerModule } from './seller/seller.module';
import { AdminModule } from './admin/admin.module';
import * as redisStore from 'cache-manager-redis-store';




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
    CacheModule.registerAsync({
      isGlobal: true,
      useFactory: () => ({
        store: redisStore,
        host: 'localhost',
        port: 6379,
        ttl: 5 * 60 * 1000, // Cache for 5 minutes
        retry_delay_on_failover: 100,
        maxRetriesPerRequest: 3,
      }),
    }),

    // Schedule for sheduling tasks
    ScheduleModule.forRoot(),
    SellerModule,
    UserModule,
    StoreModule,
    ProductModule,
    CartModule,
    // OrderModule,
    WishlistModule,
    NotificationModule,
    SystempagesModule,
    OtpModule,
    ReviewsModule,
    AdminModule
  ],
  controllers: [AppController, WishlistController, SystempagesController],
  providers: [AppService, SystempagesService, JwtService, ImageProcessingService,
    // Register ThrottlerGuard
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    // Register RolesGuard
    // {
    //   provide: APP_GUARD,
    //   useClass: RolesGuard,
    // },
  ],

})
export class AppModule { }
