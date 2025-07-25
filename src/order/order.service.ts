import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Order, OrderStatus, PaymentMethod } from './schemas/order.schema';
import { CreateOrderDto } from './dto/order.dto';
import Stripe from 'stripe';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class OrderService {
    // private readonly logger = new Logger(OrderService.name);
    // private stripe: Stripe;

    // constructor(
    //     @InjectModel(Order.name) private orderModel: Model<Order>,
    //     private configService: ConfigService,
    // ) {
    //     this.stripe = new Stripe(this.configService.get('stripePayment.'));
    // }

    // // Create new order
    // async createOrder(createOrderDto: CreateOrderDto): Promise<Order> {
    //     const order = new this.orderModel({
    //         ...createOrderDto,
    //         status: OrderStatus.PENDING,
    //     });

    //     const savedOrder = await order.save();
    //     this.logger.log(`Order created: ${savedOrder._id}`);
    //     return savedOrder;
    // }

    // // Process payment based on method
    // async processPayment(orderId: string, paymentDetails: any): Promise<Order> {
    //     const order = await this.orderModel.findById(orderId);
    //     if (!order) {
    //         throw new Error('Order not found');
    //     }

    //     try {
    //         if (order.paymentMethod === PaymentMethod.CREDIT_CARD) {
    //             return this.processCreditCardPayment(order, paymentDetails);
    //         } else if (order.paymentMethod === PaymentMethod.PAYPAL) {
    //             return this.processPaypalPayment(order, paymentDetails);
    //         }
    //     } catch (error) {
    //         this.logger.error(`Payment failed for order ${orderId}: ${error.message}`);
    //         await this.updateOrderStatus(orderId, OrderStatus.FAILED);
    //         throw error;
    //     }
    // }

    // private async processCreditCardPayment(order: Order, paymentDetails: any): Promise<Order> {
    //     const paymentIntent = await this.stripe.paymentIntents.create({
    //         amount: Math.round(order.total * 100), // Convert to cents
    //         currency: 'usd',
    //         payment_method: paymentDetails.paymentMethodId,
    //         confirm: true,
    //         metadata: { orderId: order._id.toString() },
    //     });

    //     return this.orderModel.findByIdAndUpdate(
    //         order._id,
    //         {
    //             status: OrderStatus.PAID,
    //             paymentDetails: {
    //                 paymentIntentId: paymentIntent.id,
    //                 // cardLast4: paymentIntent.payment_method?.card?.last4,
    //             },
    //         },
    //         { new: true },
    //     );
    // }

    // private async processPaypalPayment(order: Order, paymentDetails: any): Promise<Order> {
    //     // In a real implementation, you would call PayPal API here
    //     // This is a simplified version
    //     return this.orderModel.findByIdAndUpdate(
    //         order._id,
    //         {
    //             status: OrderStatus.PAID,
    //             paymentDetails: {
    //                 paypalOrderId: paymentDetails.orderID,
    //             },
    //         },
    //         { new: true },
    //     );
    // }

    // // Update order status
    // async updateOrderStatus(orderId: string, status: OrderStatus): Promise<Order> {
    //     return this.orderModel.findByIdAndUpdate(
    //         orderId,
    //         { status },
    //         { new: true },
    //     );
    // }

    // // Get order by ID
    // async getOrderById(orderId: string): Promise<Order> {
    //     return this.orderModel.findById(orderId).exec();
    // }

    // // Get user's orders
    // async getUserOrders(userId: string): Promise<Order[]> {
    //     return this.orderModel.find({ userId }).sort({ createdAt: -1 }).exec();
    // }
}