// src/scripts/generateProducts.ts
import mongoose, { Types } from 'mongoose';
import { ProductSchema } from '../schemas/product.schema'; // Import the schema


// Register the Product model
const ProductModel = mongoose.model('Product', ProductSchema);

// Product interface
interface IProduct {
    name_en: string;
    name_ar: string;
    description_en: string;
    description_ar: string;
    price: number;
    stockQuantity: number;
    category: string;
    country: string;
    store: Types.ObjectId;
    images: string[];
    createdAt: Date;
    updatedAt: Date;
}

function getRandomCategory(): string {
    const categories = ['cars', 'plants', 'buildings', 'other'];
    return categories[Math.floor(Math.random() * categories.length)];
}

async function generateProducts(count: number): Promise<void> {
    try {
        // Connect to MongoDB
        await mongoose.connect('mongodb+srv://khder16:6195432@khder.eklqwu6.mongodb.net/kikapp');
        console.log('Connected to MongoDB');
        // Generate products
        const products: IProduct[] = [];
        for (let i = 0; i < count; i++) {
            products.push({
                name_en: `Product ${i + 1}`,
                name_ar: ` منتج سوري ${i + 1}`,
                description_en: `Description for product ${i + 1}`,
                description_ar: ` وصف منتج سوري ${i + 1}`,
                price: Math.floor(Math.random() * 1000) + 1,
                stockQuantity: Math.floor(Math.random() * 500),
                category: getRandomCategory(),
                country: 'syria',
                store: new Types.ObjectId("68878a41b0394779acf4fa9f"),
                images: [`/images/68878a41b0394779acf4fa9f/product-${i + 1}.webp`],
                createdAt: new Date(),
                updatedAt: new Date()
            });
        }

        // Insert all products at once
        await ProductModel.insertMany(products);
        console.log(`Successfully inserted ${count} products`);

    } catch (error) {
        console.error('Error generating products:', error);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
}

// Generate exactly 3000 products
generateProducts(3000);