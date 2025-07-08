import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { CartItem, CartItemSchema } from '../../cart/schemas/cart-items.schema'; // Reuse CartItemSchema

export type OrderDocument = Order & Document;

export enum OrderStatus {
  Pending = 'pending',
  Processing = 'processing',
  Shipped = 'shipped',
  Delivered = 'delivered',
  Cancelled = 'cancelled',
  Failed = 'failed',
}

export class ShippingAddress {
  @Prop({ type: String, required: true })
  fullName: string;

  @Prop({ type: String, required: true })
  addressLine1: string;

  @Prop({ type: String })
  addressLine2?: string;

  @Prop({ type: String, required: true })
  city: string;

  @Prop({ type: String, required: true })
  stateProvince: string;

  @Prop({ type: String, required: true })
  postalCode: string;

  @Prop({ type: String, required: true })
  country: string;

  @Prop({ type: String })
  phoneNumber: string;

  @Prop({ type: String })
  email: string;

  @Prop({
    type: {
      latitude: { type: Number },
      longitude: { type: Number },
    },
    _id: false,
  })
  coordinates?: { latitude: number; longitude: number }; // For map-based selection
}

export const ShippingAddressSchema =
  SchemaFactory.createForClass(ShippingAddress);

@Schema({ timestamps: true })
export class Order {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  user: Types.ObjectId;

  @Prop({ type: [CartItemSchema], required: true })
  items: CartItem[];

  @Prop({ type: Number, required: true, min: 0 })
  totalAmount: number;

  @Prop({
    type: String,
    enum: Object.values(OrderStatus),
    default: OrderStatus.Pending,
    required: true,
    index: true,
  })
  status: OrderStatus;

  @Prop({ type: ShippingAddressSchema, required: true })
  shippingAddress: ShippingAddress;

  @Prop({ type: String, required: true })
  paymentMethod: string; // e.g., 'Bank Transfer'

  @Prop({ type: String })
  paymentTransactionId?: string; // Reference to bank transaction ID

  @Prop({ type: Date })
  paymentDate?: Date;

  @Prop({ type: String, unique: true, index: true })
  orderNumber: string; // Unique, auto-generated for tracking

  @Prop({ type: String })
  trackingNumber?: string; // From shipping carrier

  // Consider adding a history of status changes for tracking
  @Prop([
    {
      status: { type: String, enum: Object.values(OrderStatus) },
      timestamp: { type: Date, default: Date.now },
      _id: false,
    },
  ])
  statusHistory: { status: OrderStatus; timestamp: Date }[];
}

export const OrderSchema = SchemaFactory.createForClass(Order);

OrderSchema.index({ user: 1 });
OrderSchema.index({ status: 1 });
OrderSchema.index({ orderNumber: 1 });
OrderSchema.index({ createdAt: -1 }); // For recent orders