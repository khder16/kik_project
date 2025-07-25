import { Module } from '@nestjs/common';
import { CartController } from './cart.controller';
import { CartService } from './cart.service';
import { Cart, CartSchema } from './schemas/cart.schema';
import { MongooseModule } from '@nestjs/mongoose';
import { UserModule } from 'src/user/user.module';
import { ProductModule } from 'src/product/product.module';

@Module({
  imports: [MongooseModule.forFeature([{ name: Cart.name, schema: CartSchema }]), ProductModule,
    UserModule],
  controllers: [CartController],
  providers: [CartService],
  exports: [CartService],
})
export class CartModule { }
