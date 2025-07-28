import { Module } from '@nestjs/common';
import { SellerService } from './seller.service';
import { SellerController } from './seller.controller';
import { UserModule } from 'src/user/user.module';
import { ProductModule } from 'src/product/product.module';
import { StoreModule } from 'src/store/store.module';

@Module({
  imports:[UserModule,ProductModule,StoreModule],
  providers: [SellerService],
  controllers: [SellerController],
  exports:[SellerService]
})
export class SellerModule {}
