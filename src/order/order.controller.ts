import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { OrderService } from './order.service';
import { CreateOrderDto } from './dto/order.dto';
import { User } from '.././user/schemas/user.schema';
import { JwtAuthGuard } from 'src/common/guards/authentication.guard';
import { UserDecorator } from 'src/common/decorators/userId.decorator';

@Controller('order')
@UseGuards(JwtAuthGuard)
export class OrderController {
    constructor(private readonly orderService: OrderService) { }

    // @Post()
    // @UseGuards(JwtAuthGuard)
    // async createOrder(
    //     @Body() createOrderDto: CreateOrderDto,
    //     @UserDecorator('_id') userId: string,
    // ) {
    //     const order = await this.orderService.createOrder({
    //         ...createOrderDto,
    //         // userId.toString()
    //     });

    //     // Process payment immediately after order creation
    //     if (createOrderDto.paymentDetails) {
    //         return this.orderService.processPayment(
    //             order._id.toString(),
    //             createOrderDto.paymentDetails,
    //         );
    //     }

    //     return order;
    // }

    // @Get(':id')
    // @UseGuards(JwtAuthGuard)
    // async getOrder(@Param('id') orderId: string, @UserDecorator('_id') userId: User) {
    //     const order = await this.orderService.getOrderById(orderId);
    //     if (order.userId.toString() !== userId.toString()) {
    //         throw new Error('Unauthorized');
    //     }
    //     return order;
    // }

    // @Get()
    // @UseGuards(JwtAuthGuard)
    // async getUserOrders(@UserDecorator('_id') userId: string) {
    //     return this.orderService.getUserOrders(userId.toString());
    // }
}
