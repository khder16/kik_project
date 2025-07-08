import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { CartItem, CartItemSchema } from './cart-items.schema'; // Assuming cart-item.schema.ts

export type CartDocument = Cart & Document;

@Schema({ timestamps: true })
export class Cart {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  user: Types.ObjectId;

  @Prop({ type: [CartItemSchema], default: [] })
  items: CartItem[];

  @Prop({ type: Number, default: 0, min: 0 })
  totalPrice: number; // Calculated field, but can be stored for quick access

  @Prop({ type: Boolean, default: false })
  isConvertedToOrder: boolean; // Flag to indicate if cart has been ordered
}

export const CartSchema = SchemaFactory.createForClass(Cart);

CartSchema.index({ user: 1 });