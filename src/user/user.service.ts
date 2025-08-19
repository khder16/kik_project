import {
  BadRequestException,
  HttpException,
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User, UserRole } from './schemas/user.schema';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto, UpdateUserInformationDto } from './dto/update-user.dto';
import * as bcrypt from 'bcryptjs';
import { CountryEnum } from 'src/auth/dto/signup.dto';
import { CACHE_TTLS } from 'src/common/constant/cache.constants';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { CreateAdminsDto } from 'src/admin/dto/create-admins.dto';
import { Redis } from 'ioredis';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    @Inject(CACHE_MANAGER) private cacheManager: Cache
  ) {}

  private readonly logger = new Logger(UserService.name);
  async create(userData: CreateUserDto): Promise<User> {
    try {
      const createdUser = new this.userModel(userData);
      return await createdUser.save();
    } catch (error) {
      this.logger.error(`Error creating user: ${error.message}`, error.stack);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Failed to create user due to an unexpected server error.'
      );
    }
  }

  async createAdmins(adminsDto: CreateAdminsDto): Promise<User> {
    try {
      const createdUser = new this.userModel(adminsDto);
      return await createdUser.save();
    } catch (error) {
      this.logger.error(`Error creating user: ${error.message}`, error.stack);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Failed to create user due to an unexpected server error.'
      );
    }
  }

  async findSellerById(sellerId: string): Promise<User> {
    try {
      const seller = await this.userModel
        .findById({ _id: sellerId })
        .select('_id firstName lastName role email phoneNumber country store')
        .lean()
        .exec();
      if (!seller) {
        throw new NotFoundException('User not found.');
      }
      if (seller.role !== 'seller') {
        throw new BadRequestException('The requested user is not a seller.');
      }

      return seller;
    } catch (error) {
      this.logger.error(
        `Error finding seller by ID (${sellerId}): ${error.message}`,
        error.stack
      );
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Failed to retrieve seller by ID due to an unexpected server error.'
      );
    }
  }

  async findAllSellers(page: number, limit: number): Promise<User[]> {
    try {
      const skip = (page - 1) * limit;

      const sellers = await this.userModel
        .find({ role: 'seller' })
        .select('_id firstName lastName role email phoneNumber country')
        .skip(skip)
        .limit(limit)
        .lean()
        .exec();
      if (!sellers) {
        throw new NotFoundException('Sellers not found.');
      }

      return sellers;
    } catch (error) {
      this.logger.error(`Error finding sellers: ${error.message}`, error.stack);
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Failed to retrieve sellers due to an unexpected server error.'
      );
    }
  }

  async findAllUsers(
    usersType: string,
    page: number,
    limit: number
  ): Promise<{ data: User[]; meta: any }> {
    try {
      const skip = (page - 1) * limit;
     

      // Queries
      const [users, totalCount] = await Promise.all([
        this.userModel
          .find({ role: usersType })
          .select('_id firstName lastName role email phoneNumber country')
          .skip(skip)
          .limit(limit)
          .lean()
          .exec(),
        this.userModel.countDocuments({ role: usersType })
      ]);

      if (!users || users.length === 0) {
        throw new NotFoundException(`${usersType} not found.`);
      }

      const totalPages = Math.ceil(totalCount / limit);
      const hasNextPage = page < totalPages;
      const hasPreviousPage = page > 1;

      const response = {
        data: users,
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
      this.logger.error(`Error finding users: ${error.message}`, error.stack);
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Failed to retrieve users due to an unexpected server error.'
      );
    }
  }

  async findById(userId: string): Promise<User> {
    try {
      const user = await this.userModel
        .findById({ _id: userId })
        .select('_id firstName lastName email role phoneNumber country')
        .lean()
        .exec();
      if (!user) {
        throw new NotFoundException('User not found.');
      }
      return user;
    } catch (error) {
      this.logger.error(
        `Error finding user by ID (${userId}): ${error.message}`,
        error.stack
      );
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Failed to retrieve user by ID due to an unexpected server error.'
      );
    }
  }

  async findByEmail(email: string): Promise<User | null> {
    try {
      email = email.toString().toLowerCase();
      return await this.userModel.findOne({ email }).exec();
    } catch (error) {
      this.logger.error(
        `Error finding user by email (${email}): ${error.message}`,
        error.stack
      );
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Failed to retrieve user by email due to an unexpected server error.'
      );
    }
  }

  async findByPhoneNumber(phoneNumber: string): Promise<User | null> {
    try {
      return await this.userModel.findOne({ phoneNumber }).exec();
    } catch (error) {
      this.logger.error(
        `Error finding user by phone number (${phoneNumber}): ${error.message}`,
        error.stack
      );
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Failed to retrieve user by phone number due to an unexpected server error.'
      );
    }
  }

  async findByGoogleId(googleId: string): Promise<User | null> {
    try {
      return await this.userModel.findOne({ googleId }).exec();
    } catch (error) {
      this.logger.error(
        `Error finding user by Google ID (${googleId}): ${error.message}`,
        error.stack
      );
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Failed to retrieve user by Google ID due to an unexpected server error.'
      );
    }
  }

  async findByFacebookId(facebookId: string): Promise<User | null> {
    try {
      return await this.userModel.findOne({ facebookId }).exec();
    } catch (error) {
      this.logger.error(
        `Error finding user by Facebook ID (${facebookId}): ${error.message}`,
        error.stack
      );
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Failed to retrieve user by Facebook ID due to an unexpected server error.'
      );
    }
  }

  async update(id: string, updateData: UpdateUserDto): Promise<User> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid user ID format.');
    }
    try {
      const updatedUser = await this.userModel
        .findByIdAndUpdate(id, updateData, { new: true })
        .exec();
      if (!updatedUser) {
        throw new NotFoundException('User not found.');
      }
      return updatedUser;
    } catch (error) {
      this.logger.error(
        `Error updating user (${id}): ${error.message}`,
        error.stack
      );
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Failed to update user due to an unexpected server error.'
      );
    }
  }

  async updateUserInfo(
    id: string,
    updateData: UpdateUserInformationDto
  ): Promise<User> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid user ID format.');
    }
    try {
      const updatedUser = await this.userModel
        .findByIdAndUpdate(id, updateData, { new: true })
        .exec();
      if (!updatedUser) {
        throw new NotFoundException('User not found.');
      }
      return updatedUser;
    } catch (error) {
      this.logger.error(
        `Error updating user (${id}): ${error.message}`,
        error.stack
      );
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Failed to update user due to an unexpected server error.'
      );
    }
  }

  async delete(id: string): Promise<User> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid user ID format.');
    }
    try {
      const deletedUser = await this.userModel
        .findByIdAndDelete(id)
        .select('_id firstName lastName role email phoneNumber country')
        .exec();

      if (!deletedUser) {
        throw new NotFoundException('User not found.');
      }
      return deletedUser;
    } catch (error) {
      this.logger.error(
        `Error deleting user (${id}): ${error.message}`,
        error.stack
      );
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Failed to delete user due to an unexpected server error.'
      );
    }
  }

  async updatePasswordUser(userId: string, password: string): Promise<boolean> {
    try {
      const hashedPassword = await bcrypt.hash(password, 10);

      const result = await this.userModel.findOneAndUpdate(
        { _id: userId },
        { password: hashedPassword },
        { new: true }
      );

      if (!result) {
        throw new NotFoundException('User not found');
      }

      return true;
    } catch (error) {
      this.logger.error(
        `Failed to update password for user with ID: ${userId}: ${error.message}`,
        error.stack
      );

      if (error instanceof HttpException) {
        throw error;
      }

      throw new InternalServerErrorException(
        'Unable to update password due to a server error.'
      );
    }
  }

  async findByIdAndUpdateCountry(
    userId: string,
    country: CountryEnum
  ): Promise<User> {
    try {
      if (!userId) {
        throw new NotFoundException('User ID NotFound');
      }
      if (!country) {
        throw new NotFoundException('Country NotFound');
      }
      const updatedUser = await this.userModel.findByIdAndUpdate(
        userId,
        { country },
        { new: true }
      );
      if (!updatedUser) {
        throw new NotFoundException('User NotFound');
      }

      return updatedUser;
    } catch (error) {
      this.logger.error(
        `Error updating user (${userId}): ${error.message}`,
        error.stack
      );
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Failed to update user due to an unexpected server error.'
      );
    }
  }

  private async clearUserCache(
    role: string,
    page: number,
    limit: number
  ): Promise<void> {
    const cacheKey = `users:${role}:${page}:${limit}`;
    const cacheCountKey = `users_count:${role}`;
    await this.cacheManager.del(cacheKey);
    await this.cacheManager.del(cacheCountKey);
  }
}
