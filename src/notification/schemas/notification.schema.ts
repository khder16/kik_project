import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type NotificationDocument = Notification & Document;

export enum NotificationType {
    OrderUpdate = 'order_update',
    NewProduct = 'new_product',
    Promotion = 'promotion',
    AccountActivity = 'account_activity',
    AdminMessage = 'admin_message',
}

@Schema({ timestamps: true })
export class Notification {
    @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
    recipient: Types.ObjectId; // User ID who receives the notification

    @Prop({
        type: String,
        enum: Object.values(NotificationType),
        required: true,
        index: true,
    })
    type: NotificationType;

    @Prop({ type: String, required: true })
    title_en: string;
    @Prop({ type: String, required: true })
    title_ar: string;
    @Prop({ type: String, required: true })
    title_no: string;

    @Prop({ type: String, required: true })
    message_en: string;
    @Prop({ type: String, required: true })
    message_ar: string;
    @Prop({ type: String, required: true })
    message_no: string;

    @Prop({ type: Boolean, default: false, index: true })
    isRead: boolean;

    @Prop({ type: Types.ObjectId })
    relatedEntityId?: Types.ObjectId; // E.g., Order ID, Product ID

    @Prop({ type: String })
    link?: string; // URL to navigate to when notification is clicked
}

export const NotificationSchema = SchemaFactory.createForClass(Notification);

NotificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });
NotificationSchema.index({ type: 1 });