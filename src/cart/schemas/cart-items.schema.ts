import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export class CartItem {
    @Prop({ type: Types.ObjectId, ref: 'Product', required: true })
    productId: Types.ObjectId;

    @Prop({ type: String, required: true })
    productName: string; // Denormalized for easier display

    @Prop({ type: Number, required: true, min: 1 })
    quantity: number;

    @Prop({ type: Number, required: true, min: 0 })
    priceAtAddToCart: number; // Price when added to cart
}

export const CartItemSchema = SchemaFactory.createForClass(CartItem);