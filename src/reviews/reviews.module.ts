import { forwardRef, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Review, ReviewSchema } from './schemas/review.schema';
import { ReviewsService } from './reviews.service';
import { ProductModule } from 'src/product/product.module';
import { UserModule } from 'src/user/user.module';
import { CacheModule } from '@nestjs/cache-manager';

@Module({
    imports: [MongooseModule.forFeature([{ name: Review.name, schema: ReviewSchema }]),
    forwardRef(() => ProductModule),
    forwardRef(() => UserModule),
        CacheModule.register()
    ],
    providers: [ReviewsService],
    controllers: [],
    exports: [ReviewsService]
})
export class ReviewsModule { }


