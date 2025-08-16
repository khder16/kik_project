import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Types } from 'mongoose';

export enum UserRole {
    NORMAL_USER = 'normal_user',
    SELLER = 'seller',
    ADMIN = 'admin',
    SUPER_ADMIN = 'super_admin',
}

export enum CountryEnum {
    SYRIA = 'syria',
    NORWAY = 'norway'
}

@Schema({ timestamps: true })
export class User extends Document {
    @Prop({ required: true, unique: true, index: true, lowercase: true, match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, })
    email: string;

    @Prop({ required: true, min: 8 })
    password: string;

    @Prop({ required: false, unique: true, index: true })
    phoneNumber?: string;

    @Prop({ required: true, enum: UserRole, default: UserRole.NORMAL_USER, index: true })
    role: string;

    @Prop({ default: '' })
    otpCode: string;

    @Prop({ enum: CountryEnum })
    country: string;

    @Prop()
    googleId?: string;

    @Prop()
    facebookId?: string;

    @Prop()
    firstName?: string;

    @Prop()
    lastName?: string;

    @Prop()
    createdAt: Date;

    @Prop({ type: Types.ObjectId, ref: 'Store', index: true })
    store: Types.ObjectId[];
}

export const UserSchema = SchemaFactory.createForClass(User);