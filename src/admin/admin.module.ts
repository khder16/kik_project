import { Module } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { UserModule } from 'src/user/user.module';
import { AuthModule } from 'src/auth/auth.module';
import { StoreModule } from 'src/store/store.module';

@Module({
  imports: [UserModule, AuthModule, StoreModule],
  providers: [AdminService],
  controllers: [AdminController]
})
export class AdminModule { }
