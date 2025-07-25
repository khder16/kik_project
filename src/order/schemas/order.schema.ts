import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export enum OrderStatus {
    PENDING = 'pending',
    PAID = 'paid',
    SHIPPED = 'shipped',
    DELIVERED = 'delivered',
    CANCELLED = 'cancelled',
    FAILED = 'failed',
}

export enum PaymentMethod {
    CREDIT_CARD = 'credit_card',
    PAYPAL = 'paypal',
}

@Schema({ timestamps: true })
export class Order extends Document {
    @Prop({ type: Types.ObjectId, required: true })
    userId: Types.ObjectId;

    @Prop({ type: Object, required: true })
    billingDetails: {
        firstName: string;
        lastName: string;
        email: string;
        address: string;
        country: string;
        state?: string;
        phone: string;
    };

    @Prop({ type: Array, required: true })
    items: Array<{
        productId: Types.ObjectId;
        name: string;
        price: number;
        quantity: number;
        image?: string;
    }>;

    @Prop({ required: true })
    subtotal: number;

    @Prop({ required: true })
    shippingCost: number;

    @Prop({ required: true })
    total: number;

    @Prop({ enum: OrderStatus, default: OrderStatus.PENDING })
    status: OrderStatus;

    @Prop({ enum: PaymentMethod, required: true })
    paymentMethod: PaymentMethod;

    @Prop({ type: Object })
    paymentDetails?: {
        paymentIntentId?: string;
        paypalOrderId?: string;
        cardLast4?: string;
    };

    @Prop()
    shippingTracking?: string;

    @Prop()
    notes?: string;
}

export const OrderSchema = SchemaFactory.createForClass(Order);