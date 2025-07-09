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
import { WishlistService } from './wishlist/wishlist.service';
import { WishlistModule } from './wishlist/wishlist.module';
import { NotificationModule } from './notification/notification.module';
import { SystempagesController } from './systempages/systempages.controller';
import { SystempagesService } from './systempages/systempages.service';
import { SystempagesModule } from './systempages/systempages.module';
import { APP_GUARD } from '@nestjs/core';
import { minutes, ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { OtpModule } from './otp/otp.module';
import configuration from './config/configuration';

@Module({
  imports: [AuthModule,
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration]
    }),
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
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>('database.MONGO_URI'),
        maxPoolSize: 10,
        retryAttempts: 3,
        retryDelay: 1000,
      }),
      inject: [ConfigService],
    }),
    ThrottlerModule.forRoot({
      throttlers: [
        {
          name: 'default',
          ttl: 60000,
          limit: 100,
        },
        {
          name: 'signup',
          ttl: minutes(60),
          limit: 5
        },
        {
          name: 'login',
          ttl: minutes(5),
          limit: 5
        },
        {
          name: "passwordReset",
          ttl: 86400000,  // 24h
          limit: 4
        },
        {
          name: "validateCode",
          ttl: minutes(60),  // 1h
          limit: 6
        },
        {
          name: "passwordUpdate",
          ttl: 86400000,
          limit: 4
        },
        {
          name: "userController",
          ttl: 60000,
          limit: 100
        }
      ]
    }),
    UserModule,
    StoreModule,
    ProductModule,
    CartModule,
    OrderModule,
    WishlistModule,
    NotificationModule,
    SystempagesModule,
    OtpModule],
  controllers: [AppController, WishlistController, SystempagesController],
  providers: [AppService, WishlistService, SystempagesService, {
    provide: APP_GUARD,
    useClass: ThrottlerGuard,

  },],
})
export class AppModule { }
