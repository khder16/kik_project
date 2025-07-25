import { IsArray, IsEmail, IsEnum, IsNotEmpty, IsNumber, IsObject, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { PaymentMethod } from '../schemas/order.schema';

class OrderItemDto {
    @IsNotEmpty()
    productId: string;

    @IsNotEmpty()
    @IsString()
    name: string;

    @IsNotEmpty()
    @IsNumber()
    price: number;

    @IsNotEmpty()
    @IsNumber()
    quantity: number;

    @IsOptional()
    @IsString()
    image?: string;
}

class BillingDetailsDto {
    @IsNotEmpty()
    @IsString()
    firstName: string;

    @IsNotEmpty()
    @IsString()
    lastName: string;

    @IsNotEmpty()
    @IsEmail()
    email: string;

    @IsNotEmpty()
    @IsString()
    address: string;

    @IsNotEmpty()
    @IsString()
    country: string;

    @IsOptional()
    @IsString()
    state?: string;

    @IsNotEmpty()
    @IsString()
    phone: string;
}

export class CreateOrderDto {
    @IsNotEmpty()
    @IsObject()
    @ValidateNested()
    @Type(() => BillingDetailsDto)
    billingDetails: BillingDetailsDto;

    @IsNotEmpty()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => OrderItemDto)
    items: OrderItemDto[];

    @IsNotEmpty()
    @IsNumber()
    subtotal: number;

    @IsNotEmpty()
    @IsNumber()
    shippingCost: number;

    @IsNotEmpty()
    @IsNumber()
    total: number;

    @IsNotEmpty()
    @IsEnum(PaymentMethod)
    paymentMethod: PaymentMethod;

    @IsOptional()
    paymentDetails?: object;

    @IsOptional()
    @IsString()
    notes?: string;
}