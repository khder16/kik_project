import { BadRequestException } from '@nestjs/common';
import { memoryStorage } from 'multer';


export const imageStoreOptions = {
    storage: memoryStorage(),

    limits: { fileSize: 1000 * 1000 * 5, files: 4 }, // 5MB per file, max 4 files
    fileFilter: (req, file, callback) => {
        if (!file.originalname) {
            return callback(new BadRequestException('Please select a file to upload'), false);
        }
        if (!file.originalname.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
            return callback(new BadRequestException('Only image files are allowed (jpg, jpeg, png, gif, webp)'), false);
        }
        callback(null, true);
    }

};
