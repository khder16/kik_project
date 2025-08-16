import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Product } from 'src/product/schemas/product.schema';

export type CartDocument = Cart & Document;

@Schema({ timestamps: true })
export class Cart {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  user: Types.ObjectId;


  @Prop({
    type: [
      {
        product: { type: Types.ObjectId, ref: 'Product', required: true },
        price: { type: Number, required: true, min: 0 },
        quantity: { type: Number, required: true, min: 1 },
        store: { type: Types.ObjectId, ref: 'Store', required: true }
      }],
    default: []
  })
  items: {
    product: Types.ObjectId,
    price: number
      quantity: number,
      store: Types.ObjectId
  }[];



  @Prop({ type: Number, default: 0, min: 0 })
  totalPrice: number;

}

export const CartSchema = SchemaFactory.createForClass(Cart);

CartSchema.index({ user: 1 });