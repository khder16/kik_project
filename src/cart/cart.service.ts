import { BadRequestException, HttpException, Injectable, InternalServerErrorException, Logger, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Cart } from './schemas/cart.schema';
import { Product } from 'src/product/schemas/product.schema';
import { Model, Types } from 'mongoose';
import { ProductService } from 'src/product/product.service';
import { Cron, CronExpression } from '@nestjs/schedule';


@Injectable()
export class CartService {
    constructor(
        @InjectModel(Cart.name) private readonly cartModel: Model<Cart>,
        @InjectModel(Product.name) private readonly productModel: Model<Product>,
    ) { }

    private readonly logger = new Logger(CartService.name);



    async addToCart(userId: string, productId: string, quantity: number) {
        const session = await this.cartModel.db.startSession();
        session.startTransaction();

        try {

            let cart = await this.cartModel.findOne({ user: userId }).session(session).exec();

            if (!cart) {
                cart = new this.cartModel({
                    user: userId,
                    items: [],
                    totalPrice: 0,
                });
            }

            const product = await this.productModel.findById(productId)
            if (!product) {
                throw new NotFoundException('Product with this ID not found')
            }


            if (product.stockQuantity < quantity) {
                throw new BadRequestException('Insufficient stock available');
            }

            const existingItemIndex = cart.items.findIndex(item => item.product.toString() === productId);
            if (existingItemIndex > -1) {
                cart.items[existingItemIndex].quantity += quantity;
            } else {
                cart.items.push({
                    product: product._id,
                    price: product.price,
                    quantity
                })
            }

            product.stockQuantity -= quantity;
            await product.save({ session });


            cart.totalPrice = cart.items.reduce((total: number, item) => {
                return total + (item.price * item.quantity);
            }, 0);

            await cart.save({ session })
            await session.commitTransaction();

            return cart;
        } catch (error) {
            await session.abortTransaction();
            this.logger.error(`Error add items to cart: ${error.message}`, error.stack);
            if (error instanceof HttpException) {
                throw error;
            }
            throw new InternalServerErrorException('Failed to add products to cart due to an unexpected server error.');
        } finally {
            session.endSession();
        }
    }




    async getUserCart(userId: string, page: number = 1, limit: number = 10): Promise<Cart> {
        try {
            const skip = (page - 1) * limit
            let cart = await this.cartModel.findOne({ user: userId })
                .populate({
                    path: 'items.product',
                    select: '_id name_en name_ar name_no price images store category',
                })
                .skip(skip)
                .limit(limit)
                .exec();
            if (!cart) {
                cart = new this.cartModel({
                    user: userId,
                    items: [],
                    totalPrice: 0,
                });
            }
            await cart.save()
            return cart;
        } catch (error) {
            this.logger.error(`Error getting user cart: ${error.message}`, error.stack);
            throw new InternalServerErrorException('Failed to get user cart');
        }
    }


    // Remove item from cart
    async removeFromCart(userId: string, productId: string): Promise<Cart> {
        const session = await this.cartModel.db.startSession();

        try {
            session.startTransaction();

            const cart = await this.cartModel.findOne({ user: userId }).session(session);
            if (!cart) {
                throw new NotFoundException('Cart not found');
            }

            const itemIndex = cart.items.findIndex(
                item => item.product.toString() === productId
            );

            if (itemIndex === -1) {
                throw new NotFoundException('Item not found in cart');
            }

            const product = await this.productModel.findById(productId).session(session);
            if (!product) {
                throw new NotFoundException('Product not found');
            }

            // Restore product stock
            product.stockQuantity += cart.items[itemIndex].quantity;
            await product.save({ session });

            // Store price before removing item for accurate total calculation
            const removedItemPrice = cart.items[itemIndex].price;
            const removedItemQuantity = cart.items[itemIndex].quantity;

            // Remove item from cart
            cart.items.splice(itemIndex, 1);

            // Recalculate total - using stored prices from remaining items
            cart.totalPrice = cart.items.reduce((total: number, item) => {
                return total + (item.price * item.quantity);
            }, 0);

            await cart.save({ session });
            await session.commitTransaction();

            // Return populated cart after transaction
            return await this.cartModel.findById(cart._id).populate('items.product');
        } catch (error) {
            if (session.inTransaction()) {
                await session.abortTransaction();
            }
            this.logger.error(`Error removing item from cart: ${error.message}`, error.stack);
            if (error instanceof HttpException) {
                throw error;
            }
            throw new InternalServerErrorException('Failed to remove item from cart');
        } finally {
            session.endSession();
        }
    }




    async updateCartItem(
        userId: string,
        productId: string,
        newQuantity: number
    ): Promise<Cart> {
        if (newQuantity <= 0) {
            return this.removeFromCart(userId, productId);
        }

        const session = await this.cartModel.db.startSession();

        try {
            session.startTransaction();

            const cart = await this.cartModel.findOne({ user: userId }).session(session);
            if (!cart) {
                throw new NotFoundException('Cart not found');
            }

            const itemIndex = cart.items.findIndex(
                item => item.product.toString() === productId
            );

            if (itemIndex === -1) {
                throw new NotFoundException('Item not found in cart');
            }

            const product = await this.productModel.findById(productId).session(session);
            if (!product) {
                throw new NotFoundException('Product not found');
            }

            const quantityDifference = newQuantity - cart.items[itemIndex].quantity;

            if (product.stockQuantity < quantityDifference) {
                throw new BadRequestException('Insufficient stock available');
            }

            // Update product stock
            product.stockQuantity -= quantityDifference;
            await product.save({ session });

            // Update cart item quantity
            cart.items[itemIndex].quantity = newQuantity;

            // Recalculate total using stored price
            cart.totalPrice = cart.items.reduce((total: number, item) => {
                return total + (item.price * item.quantity);
            }, 0);

            await cart.save({ session });
            await session.commitTransaction();

            return await this.cartModel.findById(cart._id).populate('items.product');
        } catch (error) {
            if (session.inTransaction()) {
                await session.abortTransaction();
            }
            this.logger.error(`Error updating cart item: ${error.message}`, error.stack);
            if (error instanceof HttpException) {
                throw error;
            }
            throw new InternalServerErrorException('Failed to update cart item');
        } finally {
            session.endSession();
        }
    }







    @Cron(CronExpression.EVERY_30_MINUTES)
    async cleanupExpiredCarts() {

        const session = await this.cartModel.db.startSession();
        try {
            session.startTransaction();

            const now = new Date();
            const expiredCarts = await this.cartModel.find({ expiresAt: { $lte: now } }).limit(500).session(session);;

            this.logger.log(`Found ${expiredCarts.length} expired carts to process`);


            const productBulkOps = [];
            const cartBulkOps = [];


            for (const cart of expiredCarts) {
                for (const item of cart.items) {
                    productBulkOps.push({
                        updateOne: {
                            filter: { _id: item.product },
                            update: { $inc: { stockQuantity: item.quantity } },
                            session,
                        },
                    });
                }

                // Mark cart for deletion
                cartBulkOps.push({
                    deleteOne: {
                        filter: { _id: cart._id },
                        session,
                    },
                });
            }

            if (productBulkOps.length > 0) {
                await this.productModel.bulkWrite(productBulkOps);
                this.logger.log(`Restored stock for ${productBulkOps.length} product items`);
            }

            if (cartBulkOps.length > 0) {
                await this.cartModel.bulkWrite(cartBulkOps);
                this.logger.log(`Removed ${cartBulkOps.length} expired carts`);
            }

            await session.commitTransaction();
            this.logger.log('Successfully completed cart cleanup');

        } catch (error) {
            await session.abortTransaction();
            this.logger.error('Failed to cleanup expired carts', error.stack);
            if (error instanceof HttpException) {
                throw error;
            }
            throw new InternalServerErrorException('Failed to cleanup carts due to an unexpected server error.');
        } finally {
            session.endSession();
        }
    }




}
