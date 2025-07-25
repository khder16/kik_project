import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type WishlistDocument = Wishlist & Document;

@Schema({ timestamps: true })
export class Wishlist {
    @Prop({ type: Types.ObjectId, ref: 'User', required: true, unique: true, index: true })
    user: Types.ObjectId; // One wishlist per user

    @Prop({ type: [{ type: Types.ObjectId, ref: 'Product' }], index: true, default: [] })
    products: Types.ObjectId[];

}


export const WishlistSchema = SchemaFactory.createForClass(Wishlist);

WishlistSchema.index({ user: 1 });
WishlistSchema.index({ products: 1 });
WishlistSchema.index({ user: 1, products: 1 }); 
