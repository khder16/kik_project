import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Transform } from 'class-transformer';

export type ProductDocument = Product & Document;

export enum ProductCategory {
  CARS = 'cars',
  PLANTS = 'plants',
  BUILDINGS = 'buildings',
  OTHER = 'other'
}

export enum CountryEnum {
  SYRIA = 'syria',
  NORWAY = 'norway'
}


@Schema({ timestamps: true })
export class Product {
  @Prop({ type: String, index: true, sparse: true })
  name_en: string; // English product name
  @Prop({ type: String, index: true, sparse: true })
  name_ar: string; // Arabic product name
  @Prop({ type: String, index: true, sparse: true })
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

  @Prop({
    type: String,
    enum: ProductCategory,
    required: true,
    index: true
  })
  category: string;


  @Prop({
    type: String,
    enum: CountryEnum,
    required: true,
    index: true
  })
  country: string;



  @Prop({ type: Types.ObjectId, ref: 'Store', required: true, index: true })
  store: Types.ObjectId;

  @Prop([String])
  images: string[];

}

export const ProductSchema = SchemaFactory.createForClass(Product);
ProductSchema.index({ country: 1, category: 1, createdAt: -1 });
ProductSchema.index({
  name_en: 'text',
  name_ar: 'text',
  name_no: 'text',
  description_en: 'text',
  description_ar: 'text',
  description_no: 'text'
}, {
  weights: {
    name_en: 3,
    name_ar: 3,
    name_no: 3,
    description_en: 1,
    description_ar: 1,
    description_no: 1
  },
  name: 'product_search_index'
});