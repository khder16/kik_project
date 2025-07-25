import { BadRequestException, ConflictException, HttpException, Inject, Injectable, InternalServerErrorException, Logger, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { CreateStoreDto } from './dto/create-store.dto';
import { Store } from './schemas/store.schema';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { UpdateStoreDto } from './dto/updateStore.dto';
import { unlink, rm } from 'fs/promises';
import { join } from 'path';
import { Product } from 'src/product/schemas/product.schema';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import * as fs from 'fs'
@Injectable()
export class StoreService {

    constructor(
        @InjectModel(Store.name) private readonly storeModel: Model<Store>,
        @InjectModel(Product.name) private readonly productModel: Model<Product>,
        @Inject(CACHE_MANAGER) private cacheManager: Cache
    ) { }


    private readonly logger = new Logger(StoreService.name);

    async createStore(storeData: CreateStoreDto, ownerId: string, imagePath?: string): Promise<Store> {
        try {
            // Check for existing store with the same name
            const storeWithSameName = await this.storeModel.findOne({ name: storeData.name });
            if (storeWithSameName) {
                throw new ConflictException('Store name already exists');
            }

            // Check for existing store with the same email if email is provided
            if (storeData.email) {
                const storeWithSameEmail = await this.storeModel.findOne({ email: storeData.email });
                if (storeWithSameEmail) {
                    throw new ConflictException('Email already exists');
                }
            }

            // Check social media handles sequentially
            if (storeData.facebook) {
                const storeWithSameFacebook = await this.storeModel.findOne({ facebook: storeData.facebook });
                if (storeWithSameFacebook) {
                    throw new ConflictException('Facebook handle already in use');
                }
            }

            if (storeData.instagram) {
                const storeWithSameInstagram = await this.storeModel.findOne({ instagram: storeData.instagram });
                if (storeWithSameInstagram) {
                    throw new ConflictException('Instagram handle already in use');
                }
            }

            if (storeData.whatsApp) {
                const storeWithSameWhatsApp = await this.storeModel.findOne({ whatsApp: storeData.whatsApp });
                if (storeWithSameWhatsApp) {
                    throw new ConflictException('WhatsApp number already in use');
                }
            }
            const newStore = {
                ...storeData,
                owner: ownerId,
                image: imagePath
            };
            const createdStore = new this.storeModel(newStore)
            return await createdStore.save()
        } catch (error) {
            this.logger.error(`Error creating store: ${error.message}`, error.stack);
            if (error instanceof HttpException) {
                throw error;
            }
            throw new InternalServerErrorException('Failed to create store due to an unexpected server error.');
        }
    }

    async updateStore(storeId: string, storeData: UpdateStoreDto, ownerId: string, imagePath?: string): Promise<Store> {
        try {
            const store = await this.storeModel.findById(storeId)
            if (!store) {
                throw new NotFoundException('Store not found');
            }

            if (ownerId !== store.owner.toString()) {
                throw new UnauthorizedException('Only Owner Cat=n Update this Store')
            }

            // 3. Update store data
            if (imagePath) {
                // Delete old image if it exists and is being replaced
                if (store.image) {
                    try {
                        await unlink(join(process.cwd(), store.image));
                    } catch (err) {
                        this.logger.warn(`Failed to delete old store image: ${store.image}`);
                    }
                }
                storeData.image = imagePath;
            }

            store.set(storeData)
            return await store.save();
        } catch (error) {
            this.logger.error(`Error update store: ${error.message}`, error.stack);
            if (error instanceof HttpException) {
                throw error;
            }
            throw new InternalServerErrorException('Failed to update store due to an unexpected server error.');
        }
    }


    async deleteStore(storeId: string, ownerId: string, isSuperAdmin?: boolean) {
        const session = await this.storeModel.startSession();
        session.startTransaction();
        try {
            // 1. Verify store exists and check ownership
            const store = await this.storeModel.findById(storeId).session(session);
            if (!store) {
                throw new NotFoundException('Store not found');
            }
            if (ownerId !== store.owner.toString() && !isSuperAdmin) {
                throw new UnauthorizedException('Only the owner or super admin can delete this store');
            }

            // 2. Delete all related products (with their images if needed)
            const products = await this.productModel.find({ store: storeId }).session(session);

            // 3. Delete the store folder and its contents
            const storeImagePath = join(process.cwd(), 'public', 'images', storeId);
            await this.deleteStoreFolder(storeImagePath);



            await this.productModel.deleteMany({ store: storeId }).session(session);

            await this.storeModel.deleteOne({ _id: storeId }).session(session);

            await session.commitTransaction();

            return { message: 'Store and all related products deleted successfully' };

        } catch (error) {
            await session.abortTransaction();
            this.logger.error(`Error delete store: ${error.message}`, error.stack);
            if (error instanceof HttpException) {
                throw error;
            }
            throw new InternalServerErrorException('Failed to delete store due to an unexpected server error.');
        }
        finally {
            session.endSession();
        }
    }



    async getAllStores(page: number = 1, limit: number = 10): Promise<Store[]> {
        try {
            const skip = (page - 1) * limit;

            const stores = await this.storeModel.find({}).skip(skip).limit(limit)

            if (stores.length === 0) {
                this.logger.log('No stores found in database');
                return [];
            }
            return stores;
        } catch (error) {
            this.logger.error(`Failed to fetch stores: ${error.message}`, error.stack);
            if (error instanceof HttpException) {
                throw error;
            }
            throw new InternalServerErrorException('Failed to retrieve stores');
        }
    }

    async getStoresByOwnerId(ownerId: string) {
        try {
            const stores = await this.storeModel.countDocuments({ owner: ownerId }).lean().exec();
            return stores
        } catch (error) {
            this.logger.error(`Failed to fetch stores for this ownerId ${ownerId}: ${error.message}`, error.stack);
            if (error instanceof HttpException) {
                throw error;
            }
            throw new InternalServerErrorException('Failed to retrieve store');
        }
    }

    async getStoreById(storeId: string): Promise<Store> {
        try {
            const cachedStore = await this.cacheManager.get<Store>(`store_${storeId}`);
            if (cachedStore) return cachedStore;
            const store = await this.storeModel.findById(storeId).populate('owner', 'name email phoneNumber')
                .lean()
                .exec();
            if (!store) {
                throw new NotFoundException(`Store with ID ${storeId} not found`);
            }
            await this.cacheManager.set<Store>(`store_${storeId}`, store, 10 * 60000);
            return store;
        } catch (error) {
            this.logger.error(`Failed to fetch store ${storeId}: ${error.message}`, error.stack);
            if (error instanceof HttpException) {
                throw error;
            }
            throw new InternalServerErrorException('Failed to retrieve store');
        }
    }



    private async deleteStoreFolder(folderPath: string) {
        try {
            await rm(folderPath, { recursive: true, force: true });
            this.logger.log(`Successfully deleted store folder: ${folderPath}`);
        } catch (error) {
            // Don't fail the entire operation if folder deletion fails
            this.logger.warn(`Failed to delete store folder ${folderPath}: ${error.message}`);
            if (error instanceof HttpException) {
                throw error;
            }
        }
    }
}