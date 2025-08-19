import { Injectable } from '@nestjs/common';
import * as sharp from 'sharp';
import * as path from 'path';
import * as fs from 'fs';

@Injectable()
export class ImageProcessingService {
    async processAndSaveImages(images: Express.Multer.File[], storeId: string): Promise<string[]> {
        const publicImageDir = path.join(process.cwd(), 'public', 'images', storeId);
        fs.mkdirSync(publicImageDir, { recursive: true });

        const savedImagePaths: string[] = [];

        for (const image of images) {
            try {
                const originalName = path.parse(image.originalname).name;
                const outputFilename = `${originalName}-${Date.now()}.webp`;
                const outputPath = path.join(publicImageDir, outputFilename);
                const publicPath = `public/images/${storeId}/${outputFilename}`;

                // Process directly from memory buffer
                await sharp(image.buffer)
                    .resize(1200, 1200, {
                        fit: 'inside',
                        withoutEnlargement: true
                    })
                    .webp({ quality: 80 })
                    .toFile(outputPath);

                savedImagePaths.push(publicPath);
            } catch (error) {
                // Cleanup any saved files if error occurs
                this.cleanupFailedImages(savedImagePaths, publicImageDir);
                throw new Error(`Failed to process images: ${error.message}`);
            }
        }

        return savedImagePaths;
    }

    async processAndSaveSingleImage(image: Express.Multer.File, subfolder: string = 'stores'): Promise<string> {
        const publicImageDir = path.join(process.cwd(), 'public', 'images', subfolder);
        fs.mkdirSync(publicImageDir, { recursive: true });

        try {
            const originalName = path.parse(image.originalname).name;
            const outputFilename = `${originalName}-${Date.now()}.webp`;
            const outputPath = path.join(publicImageDir, outputFilename);
            const publicPath = `/images/${subfolder}/${outputFilename}`;

            // Process directly from memory buffer
            await sharp(image.buffer)
                .resize(1200, 1200, {
                    fit: 'inside',
                    withoutEnlargement: true
                })
                .webp({ quality: 80 })
                .toFile(outputPath);

            return publicPath;
        } catch (error) {
            throw new Error(`Failed to process image: ${error.message}`);
        }
    }

    private cleanupFailedImages(savedPaths: string[], directory: string): void {
        savedPaths.forEach(imagePath => {
            const fullPath = path.join(directory, path.basename(imagePath));
            if (fs.existsSync(fullPath)) {
                fs.unlinkSync(fullPath);
            }
        });
    }
}