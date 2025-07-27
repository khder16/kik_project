import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type StoreDocument = Store & Document;


export enum StoreCategory {
  PLANTS = 'plants',
  CARS = 'cars',
  BUILDINGS = 'buildings',
  OTHER = 'other',
}


@Schema({ timestamps: true })
export class Store {

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  owner: Types.ObjectId;



  @Prop({ type: String, required: true, unique: true, index: true })
  name: string;


  @Prop({ type: String })
  description: string;

  @Prop({ type: String })
  address: string;


  @Prop({ type: String })
  phoneNumber: string;


  @Prop({ type: String, unique: true, sparse: true })
  email: string;

  @Prop({ type: String, unique: true, sparse: true })
  facebook?: string;

  @Prop({ type: String, unique: true, sparse: true })
  instagram?: string;

  @Prop({ type: String, unique: true, sparse: true })
  whatsApp?: string;


  @Prop({
    type: String,
    enum: StoreCategory,
    required: true,
    index: true
  })
  category: StoreCategory;


  @Prop({
    type: String,
    enum: ['syria', 'norway'],
    required: true,
    index: true
  })
  country: string;


  @Prop({ type: String, default: '' })
  image?: string;


}

export const StoreSchema = SchemaFactory.createForClass(Store);
