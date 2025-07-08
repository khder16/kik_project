import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type PageDocument = Page & Document;

export enum PageType {
    TermsAndConditions = 'terms_and_conditions',
    PrivacyPolicy = 'privacy_policy',
    ReturnPolicy = 'return_policy',
    SupportPolicy = 'support_policy',
    AboutUs = 'about_us',
}

@Schema({ timestamps: true })
export class Page {
    @Prop({
        type: String,
        enum: Object.values(PageType),
        required: true,
        unique: true,
        index: true,
    })
    type: PageType;

    @Prop({ type: String, required: true })
    title_en: string;
    @Prop({ type: String, required: true })
    title_ar: string;
    @Prop({ type: String, required: true })
    title_no: string;

    @Prop({ type: String, required: true })
    content_en: string;
    @Prop({ type: String, required: true })
    content_ar: string;
    @Prop({ type: String, required: true })
    content_no: string;

    @Prop({ type: Boolean, default: true })
    isActive: boolean; // Allow admin to disable pages
}

export const PageSchema = SchemaFactory.createForClass(Page);

PageSchema.index({ type: 1 });