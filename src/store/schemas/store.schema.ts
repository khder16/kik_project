import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { CategoryEnum } from 'src/common/enum/category.enum';
import { CountryEnum } from 'src/common/enum/country.enum';

export type StoreDocument = Store & Document;



@Schema({ timestamps: true })
export class Store {

  @Prop({ type: Types.ObjectId, ref: 'User', index: true, required: true })
  owner: Types.ObjectId;


  @Prop({ type: String, required: true, unique: true, index: true })
  name: string;


  @Prop({ type: String })
  description: string;

  @Prop({ type: String })
  address: string;


  @Prop({ type: String })
  phoneNumber: string;


  @Prop({ type: String, unique: true, sparse: true, default: null, })
  email: string;

  @Prop({ type: String, unique: true, sparse: true, default: null, })
  facebook?: string;

  @Prop({ type: String, unique: true, sparse: true, default: null, })
  instagram?: string;

  @Prop({ type: String, unique: true, sparse: true, default: null, })
  whatsApp?: string;



  @Prop({
    type: String,
    enum: CategoryEnum,
    required: true,
    index: true
  })
  category: CategoryEnum;


  @Prop({
    type: String,
    enum: CountryEnum,
    required: true,
    index: true
  })
  country: string;


  @Prop({ type: String, default: '' })
  image?: string;


  @Prop({
    type: String,
    enum: ['paypal', 'stripe', 'bank'],
    default: null
  })
  payoutMethod?: string;

  @Prop({ type: String, select: false }) // PayPal email
  paypalEmail?: string;

  @Prop({ type: String, select: false }) // Stripe account ID
  stripeAccountId?: string;

  @Prop({ type: String, enum: ['pending', 'active'], defult: 'pending' })
  stripeStatus: string;

}


export const StoreSchema = SchemaFactory.createForClass(Store);
