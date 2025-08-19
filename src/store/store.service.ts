import {
  BadRequestException,
  ConflictException,
  HttpException,
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  UnauthorizedException
} from '@nestjs/common';
import { CreateStoreDto } from './dto/create-store.dto';
import { Store } from './schemas/store.schema';
import { Model, Types } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { UpdateStoreDto } from './dto/updateStore.dto';
import { unlink, rm } from 'fs/promises';
import { join } from 'path';
import { Product } from 'src/product/schemas/product.schema';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { GetStoresFilterDto } from './dto/get-stores-by-country.dto';
import { CACHE_TTLS } from 'src/common/constant/cache.constants';
@Injectable()
export class StoreService {
  constructor(
    @InjectModel(Store.name) private readonly storeModel: Model<Store>,
    @InjectModel(Product.name) private readonly productModel: Model<Product>,
    @Inject(CACHE_MANAGER) private cacheManager: Cache
  ) {}

  private readonly logger = new Logger(StoreService.name);

  async createStore(
    storeData: CreateStoreDto,
    ownerId: string,
    imagePath?: string
  ): Promise<Store> {
    try {
      // Check for existing store with the same name
      const storeWithSameName = await this.storeModel.findOne({
        name: storeData.name
      });

      if (storeWithSameName) {
        throw new ConflictException('Store name already exists');
      }
      if (storeData.email) {
        const storeWithSameEmail = await this.storeModel.findOne({
          email: storeData.email
        });
        if (storeWithSameEmail) {
          throw new ConflictException('Email already exists');
        }
      }

      const newStore = {
        ...storeData,
        owner: ownerId,
        image: imagePath
      };
      const createdStore = new this.storeModel(newStore);
      return await createdStore.save();
    } catch (error) {
      this.logger.error(`Error creating store: ${error.message}`, error.stack);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Failed to create store due to an unexpected server error.'
      );
    }
  }

  async updateStore(
    storeId: string,
    storeData: UpdateStoreDto,
    ownerId: string,
    imagePath?: string
  ): Promise<Store> {
    try {
      const store = await this.storeModel.findById(storeId);
      if (!store) {
        throw new NotFoundException('Store not found');
      }

      if (ownerId !== store.owner.toString()) {
        throw new UnauthorizedException('Only Owner Can Update this Store');
      }

      // 3. Update store data
      if (imagePath) {
        // Delete old image if it exists and is being replaced
        if (store.image) {
          try {
            await unlink(join(process.cwd(), store.image));
          } catch (err) {
            this.logger.warn(
              `Failed to delete old store image: ${store.image}`
            );
          }
        }
        storeData.image = imagePath;
      }

      store.set(storeData);
      return await store.save();
    } catch (error) {
      this.logger.error(`Error update store: ${error.message}`, error.stack);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Failed to update store due to an unexpected server error.'
      );
    }
  }
  async deleteStore(
    storeId: string,
    userId?: string,
    isAdmin: boolean = false
  ) {
    const session = await this.storeModel.startSession();
    session.startTransaction();
    try {
      const storeObjectId = new Types.ObjectId(storeId);

      const store = await this.storeModel
        .findById(storeId)
        .select('owner')
        .lean()
        .session(session);

      if (!store) {
        throw new NotFoundException('Store not found');
      }

      // Only check ownership if not an admin
      if (!isAdmin && userId !== store.owner.toString()) {
        throw new UnauthorizedException(
          'Only the owner or admin can delete this store'
        );
      }

      // Rest of the deletion logic
      await this.productModel
        .deleteMany({ store: storeObjectId }, { session })
        .exec();

      await this.storeModel
        .deleteOne({ _id: storeObjectId }, { session })
        .exec();

      await session.commitTransaction();

      return { message: 'Store and all related products deleted successfully' };
    } catch (error) {
      await session.abortTransaction();
      this.logger.error(`Error deleting store: ${error.message}`, error.stack);
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException('Failed to delete store');
    } finally {
      session.endSession();
    }
  }

  async getAllStoresByFilters(
    allStoresFiltersQuery: GetStoresFilterDto
  ): Promise<{ data: Store[]; meta: any }> {
    try {
      const { country, category, page, limit } = allStoresFiltersQuery;
      const skip = (page - 1) * limit;
      if (limit > 50) throw new BadRequestException('Maximum limit is 50');

      // Queries
      const query: any = {};

      const [stores, totalCount] = await Promise.all([
        this.storeModel.find(query).skip(skip).limit(limit).lean().exec(),
        this.storeModel.countDocuments(query)
      ]);

      const totalPages = Math.ceil(totalCount / limit);
      const hasNextPage = page < totalPages;
      const hasPreviousPage = page > 1;

      const response = {
        data: stores,
        meta: {
          currentPage: page,
          itemsPerPage: limit,
          totalItems: totalCount,
          totalPages,
          hasNextPage,
          hasPreviousPage
        }
      };

      return response;
    } catch (error) {
      this.logger.error(
        `Failed to fetch stores: ${error.message}`,
        error.stack
      );
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to retrieve stores');
    }
  }

  async getStoresByOwnerId(ownerId: string) {
    try {
      const store = await this.storeModel
        .find({ owner: ownerId })
        .lean()
        .exec();
      if (!store) {
        throw new NotFoundException('Store not found');
      }
      return store;
    } catch (error) {
      this.logger.error(
        `Failed to fetch store for this ownerId ${ownerId}: ${error.message}`,
        error.stack
      );
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to retrieve store');
    }
  }

  async getStoresBySellerId(ownerId: string) {
    try {
      const store = await this.storeModel
        .find({ owner: ownerId })
        .lean()
        .exec();
      if (!store) {
        throw new NotFoundException('Store not found');
      }

      return store;
    } catch (error) {
      this.logger.error(
        `Failed to fetch store for this ownerId ${ownerId}: ${error.message}`,
        error.stack
      );
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to retrieve store');
    }
  }

  async getStoreById(storeId: string): Promise<Store> {
    try {
      const cachedStore = await this.cacheManager.get<Store>(
        `store_${storeId}`
      );
      if (cachedStore) return cachedStore;
      const store = await this.storeModel
        .findById(storeId)
        .populate('owner', 'name email phoneNumber')
        .lean()
        .exec();
      if (!store) {
        throw new NotFoundException(`Store with ID ${storeId} not found`);
      }
      await this.cacheManager.set<Store>(`store_${storeId}`, store, 10 * 60000);
      return store;
    } catch (error) {
      this.logger.error(
        `Failed to fetch store ${storeId}: ${error.message}`,
        error.stack
      );
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
      this.logger.warn(
        `Failed to delete store folder ${folderPath}: ${error.message}`
      );
      if (error instanceof HttpException) {
        throw error;
      }
    }
  }
}
