import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Transform } from 'class-transformer';

export type ProductDocument = Product & Document;

@Schema({ timestamps: true })
export class Product {
  @Prop({ type: String, index: true })
  name_en: string; // English product name
  @Prop({ type: String, index: true })
  name_ar: string; // Arabic product name
  @Prop({ type: String, index: true })
  name_no: string; // Norwegian product name

  @Prop({ type: String })
  description_en: string;
  @Prop({ type: String })
  description_ar: string;
  @Prop({ type: String })
  description_no: string;

  @Transform(({ value }) => Number(value))
  @Prop({ type: Number, required: true, min: 0 })
  price: number;

  @Transform(({ value }) => Number(value))
  @Prop({ type: Number, required: true, min: 0 })
  stockQuantity: number;

  get isInStock(): boolean {
    return this.stockQuantity > 0;
  }

  @Prop({ type: Types.ObjectId, ref: 'Category', required: true, index: true })
  category: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Store', required: true, index: true })
  store: Types.ObjectId;

  @Prop([String])
  images: string[];

}

export const ProductSchema = SchemaFactory.createForClass(Product);
ProductSchema.index({
  'store._id': 1,
  'store.country': 1
}, {
  name: 'store_country_index'
});