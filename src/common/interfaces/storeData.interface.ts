import { Types } from "mongoose";

export interface SimpleStore {
    facebook?: string | null;
    instagram?: string | null;
    whatsApp?: string | null;
    owner?: Types.ObjectId;
    name?: string;
    description?: string;
    address?: string;
    phoneNumber?: string;
    country?: string
}