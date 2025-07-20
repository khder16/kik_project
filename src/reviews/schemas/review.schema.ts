import { Schema, Prop, SchemaFactory } from "@nestjs/mongoose";
import { Types } from "mongoose";


export type ReviewDocument = Review & Document;

@Schema({ timestamps: true })
export class Review {

    @Prop({ type: Types.ObjectId, ref: 'User', required: true })
    reviewedBy: Types.ObjectId;


    @Prop({ type: Types.ObjectId, ref: 'Product', index: true, required: true })
    productId: Types.ObjectId;


    @Prop({ type: Number, min: 1, max: 5 })
    stars: number

    @Prop({ type: String, maxlength: 1000 })
    comments: string
}


export const ReviewSchema = SchemaFactory.createForClass(Review);

ReviewSchema.index({ product: 1, reviewedBy: 1 }, { unique: true });