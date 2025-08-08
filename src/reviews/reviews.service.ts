import { BadRequestException, ConflictException, ForbiddenException, HttpException, Inject, Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { CreateReviewDto } from './dto/create-review.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Review } from './schemas/review.schema';
import { Model, Types } from 'mongoose';
import { UserService } from 'src/user/user.service';
import { ProductService } from 'src/product/product.service';
import { Cache } from 'cache-manager'
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { CACHE_TTLS } from 'src/common/constant/cache.constants';
@Injectable()

export class ReviewsService {

    constructor(@InjectModel(Review.name) private reviewModel: Model<Review>,
        private readonly productsService: ProductService,
        private readonly userService: UserService,
        @Inject(CACHE_MANAGER) private cacheManager: Cache) { }

    private readonly logger = new Logger(ReviewsService.name);


    async createReview(createReviewDto: CreateReviewDto, productId: string, userId: string): Promise<Review> {
        if (!productId) {
            throw new NotFoundException('Product ID is required');
        }
        if (!userId) {
            throw new NotFoundException('User ID is required');
        }
        try {
            const product = await this.productsService.findOneById(productId);

            if (!product) {
                throw new NotFoundException('Product not found');
            }
            const user = await this.userService.findById(userId);
            if (!user) {
                throw new NotFoundException('User not found');
            }

            const existingReview = await this.reviewModel.findOne({
                productId: productId,
                reviewedBy: userId,
            }).exec();


            if (existingReview) {
                throw new ConflictException('You have already reviewed this product');
            }

            const newReview = new this.reviewModel({
                ...createReviewDto,
                productId: productId,
                reviewedBy: userId,
            });
            const savedReview = await newReview.save();
            return savedReview;
        } catch (error) {
            this.logger.error(`Error create review: ${error.message}`, error.stack);
            if (error instanceof HttpException) {
                throw error;
            }
            throw new InternalServerErrorException('Failed to create review due to an unexpected server error.');
        }
    }




    async deleteReviewComment(reviewId: string, userId: string): Promise<Review> {
        try {
            if (!Types.ObjectId.isValid(reviewId)) {
                throw new NotFoundException('Invalid review ID');
            }
            const review = await this.reviewModel.findById(reviewId);
            if (!review) {
                throw new NotFoundException('Review not found');
            }
            if (review.reviewedBy.toString() !== userId) {
                throw new ForbiddenException('You can only modify your own reviews');
            }
            if (!review.comments) {
                throw new NotFoundException('No comment exists on this review');
            }
            return await this.reviewModel.findByIdAndUpdate(
                reviewId,
                { $unset: { comments: 1 } },
                { new: true }
            ).exec();
        }
        catch (error) {
            this.logger.error(`Error delete review: ${error.message}`, error.stack);
            if (error instanceof HttpException) {
                throw error;
            }
            throw new InternalServerErrorException('Failed to delete review due to an unexpected server error.');
        }
    }



    async updateReview(
        updateDto: CreateReviewDto,
        reviewId: string,
        userId: string,
    ): Promise<Review> {
        try {
            if (!Types.ObjectId.isValid(reviewId)) {
                throw new NotFoundException('Invalid review ID');
            }

            const review = await this.reviewModel.findById(reviewId).exec();
            if (!review) {
                throw new NotFoundException('Review not found');
            }

            if (review.reviewedBy.toString() !== userId) {
                throw new ForbiddenException('You can only update your own reviews');
            }

            const updatedReview = await this.reviewModel.findByIdAndUpdate(reviewId, updateDto, { new: true }).exec()
            if (!updatedReview) {
                throw new NotFoundException('Review not found');
            }
            return updatedReview
        } catch (error) {
            this.logger.error(`Error update review: ${error.message}`, error.stack);
            if (error instanceof HttpException) {
                throw error;
            }
            throw new InternalServerErrorException('Failed to update review due to an unexpected server error.');
        }
    }

    async getAllReviewsForProduct(
        productId: string,
        page: number = 1,
        limit: number = 10
    ): Promise<{
        data: Review[];
        meta: {
            currentPage: number;
            itemsPerPage: number;
            totalItems: number;
            totalPages: number;
            hasNextPage: boolean;
            hasPreviousPage: boolean;
        };
        summary: {
            averageStarsRating: number;
            totalStars: number;
            totalComments: number;
            starDistribution?: Record<number, number>; // Optional: Add star distribution
        };
    }> {
        type CachedReviews = {
            reviews: Review[];
            summary: {
                averageStarsRating: number;
                totalStars: number;
                totalComments: number;
            };
        };
        if (limit > 50) throw new BadRequestException('Maximum limit is 50');

        try {
            const cacheKey = `reviews:${productId}:page${page}:limit${limit}`;
            const cacheCountKey = `reviews_count:${productId}`;
            const cacheSummaryKey = `reviews_summary:${productId}`;
            const cached = await this.cacheManager.get<{
                data: Review[];
                meta: any;
                summary: any;
            }>(cacheKey);


            if (cached) return cached;


            const skip = (page - 1) * limit;

            if (!productId) {
                throw new NotFoundException('Product ID not provided');
            }

            const product = await this.productsService.findOneById(productId);
            if (!product) {
                throw new NotFoundException('Product not found');
            }

            const [reviews, totalCount, summaryResult] = await Promise.all([
                this.reviewModel.find({ productId })
                    .populate({
                        path: 'reviewedBy',
                        select: 'firstName lastName avatar',
                        model: 'User',
                        options: { lean: true }
                    })
                    .select('comments stars createdAt reviewedBy')
                    .skip(skip)
                    .limit(limit)
                    .sort({ createdAt: -1 })
                    .lean()
                    .exec(),
                this.reviewModel.countDocuments({ productId }),
                this.reviewModel.aggregate([
                    { $match: { productId } },
                    {
                        $group: {
                            _id: null,
                            averageStarsRating: { $avg: '$stars' },
                            totalStars: { $sum: 1 },
                            totalComments: {
                                $sum: {
                                    $cond: [{ $ifNull: ['$comments', false] }, 1, 0]
                                }
                            },
                            // Optional: Star distribution
                            starDistribution: {
                                $push: '$stars'
                            }
                        }
                    }
                ])
            ]);


            const totalPages = Math.ceil(totalCount / limit);
            const hasNextPage = page < totalPages;
            const hasPreviousPage = page > 1;

            // Process summary data
            const summary = summaryResult[0] || {
                averageStarsRating: 0,
                totalStars: 0,
                totalComments: 0
            };

            const response = {
                data: reviews,
                meta: {
                    currentPage: page,
                    itemsPerPage: limit,
                    totalItems: totalCount,
                    totalPages,
                    hasNextPage,
                    hasPreviousPage
                },
                summary: {
                    averageStarsRating: parseFloat((summary.averageStarsRating || 0).toFixed(1)),
                    totalStars: summary.totalStars,
                    totalComments: summary.totalComments
                }
            };
            await Promise.all([
                this.cacheManager.set(cacheKey, response, CACHE_TTLS.DETAILS),
                this.cacheManager.set(cacheCountKey, totalCount, CACHE_TTLS.DETAILS),
                this.cacheManager.set(cacheSummaryKey, response.summary, CACHE_TTLS.DETAILS)
            ]);
            return response;
        } catch (error) {
            this.logger.error(
                `Error fetching reviews for product ${productId}: ${error.message}`,
                error.stack
            );

            if (error instanceof HttpException) {
                throw error;
            }

            throw new InternalServerErrorException(
                'Failed to retrieve reviews due to a server error.'
            );
        }
    }


    async deleteReview(reviewId: string, productId: string, userId: string): Promise<boolean> {
        // 1. Validate all required IDs
        if (!reviewId || !Types.ObjectId.isValid(reviewId)) {
            throw new NotFoundException('Valid review ID is required');
        }
        if (!productId || !Types.ObjectId.isValid(productId)) {
            throw new NotFoundException('Valid product ID is required');
        }
        if (!userId || !Types.ObjectId.isValid(userId)) {
            throw new NotFoundException('Valid user ID is required');
        }

        try {
            // 2. Find the review with ownership check
            const review = await this.reviewModel.findOne({
                _id: reviewId,
                productId: productId,
                reviewedBy: userId
            }).select('reviewedBy _id').exec();

            if (!review) {
                throw new NotFoundException('Review not found or you are not authorized');
            }

            if (userId !== review.reviewedBy.toString()) {
                throw new ForbiddenException('You can only delete your own reviews');
            }

            await this.reviewModel.deleteOne({ _id: reviewId });
            return true;

        } catch (error) {
            this.logger.error(`Failed to delete review: ${error.message}`, error.stack);
            if (error instanceof HttpException) {
                throw error;
            }
            throw new InternalServerErrorException('Failed to delete review');
        }
    }
}