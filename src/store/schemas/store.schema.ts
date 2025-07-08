import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ProductDocument = Product & Document;

@Schema({ timestamps: true })
export class Product {
  @Prop({ type: String, required: true, index: true })
  name_en: string; // English product name
  @Prop({ type: String, required: true })
  name_ar: string; // Arabic product name
  @Prop({ type: String, required: true })
  name_no: string; // Norwegian product name

  @Prop({ type: String, unique: true, index: true })
  slug: string;

  @Prop({ type: String })
  description_en: string;
  @Prop({ type: String })
  description_ar: string;
  @Prop({ type: String })
  description_no: string;

  @Prop({ type: Number, required: true, min: 0 })
  price: number;

  @Prop({ type: Number, required: true, min: 0 })
  stockQuantity: number;

  @Prop({ type: Types.ObjectId, ref: 'Category', required: true, index: true })
  category: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Store', required: true, index: true })
  store: Types.ObjectId; 

  @Prop([String])
  imageUrls: string[]; // Array of image URLs

  @Prop({ type: Boolean, default: true })
  isAvailable: boolean; // Product visibility

  @Prop({ type: Boolean, default: false })
  isNewArrival: boolean; // For new arrivals section

  @Prop({ type: Boolean, default: false })
  isBestSeller: boolean; // For best sellers section (consider dynamic calculation)

  // Additional fields for filtering/details
  @Prop({ type: String })
  brand?: string;

  @Prop({ type: Object }) // For additional flexible attributes
  attributes?: Record<string, any>;
}

export const ProductSchema = SchemaFactory.createForClass(Product);

ProductSchema.index({ category: 1 });
ProductSchema.index({ store: 1 });
ProductSchema.index({ price: 1, stockQuantity: 1, weight: 1 }); // For filtering
ProductSchema.index({ isNewArrival: 1 });
ProductSchema.index({ isBestSeller: 1 });