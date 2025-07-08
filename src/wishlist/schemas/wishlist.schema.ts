import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type WishlistDocument = Wishlist & Document;

@Schema({ timestamps: true })
export class Wishlist {
    @Prop({ type: Types.ObjectId, ref: 'User', required: true, unique: true, index: true })
    user: Types.ObjectId; // One wishlist per user

    @Prop([{ type: Types.ObjectId, ref: 'Product', index: true }])
    products: Types.ObjectId[]; // Array of product IDs

    @Prop([{ type: Types.ObjectId, ref: 'Store', index: true }])
    stores: Types.ObjectId[]; // Array of store IDs
}

export const WishlistSchema = SchemaFactory.createForClass(Wishlist);

WishlistSchema.index({ user: 1 });
WishlistSchema.index({ 'products': 1 });
WishlistSchema.index({ 'stores': 1 });