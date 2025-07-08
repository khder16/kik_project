import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class Otp extends Document {
    @Prop({ type: String, required: true, index: true })
    email: string;

    @Prop({ required: true, index: true })
    code: string;

    @Prop({ required: true })
    expiresAt: Date;

    @Prop({
        type: Boolean,
        default: false,
        index: true
    })
    used: boolean;
}

export const OtpSchema = SchemaFactory.createForClass(Otp);

OtpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

OtpSchema.index({ email: 1, code: 1, used: 1 });