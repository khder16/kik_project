import { Injectable } from '@nestjs/common';
import * as sharp from 'sharp';
import * as path from 'path';
import * as fs from 'fs';

@Injectable()
export class ImageProcessingService {
    async processAndSaveImages(images: Express.Multer.File[], storeId: string) {
        const publicImageDir = path.join(process.cwd(), 'public', 'images', `${storeId}`);
        fs.mkdirSync(publicImageDir, { recursive: true });

        const savedImagePaths = [];

        for (const image of images) {
            try {
                const originalName = path.parse(image.filename).name;
                const outputFilename = `${originalName}.webp`;
                const outputPath = path.join(publicImageDir, outputFilename);

                await sharp(image.path)
                    .resize(1200, 1200, {
                        fit: 'inside',
                        withoutEnlargement: true
                    })
                    .webp({ quality: 80 })
                    .toFile(outputPath);

                savedImagePaths.push(`public/images/${storeId}/${outputFilename}`);

                // Remove temporary file
                fs.unlinkSync(image.path);
            } catch (error) {
                // Cleanup any processed files if error occurs
                savedImagePaths.forEach(imagePath => {
                    const fullPath = path.join(publicImageDir, path.basename(imagePath));
                    if (fs.existsSync(fullPath)) {
                        fs.unlinkSync(fullPath);
                    }
                });
                throw new Error(`Failed to process image: ${error.message}`);
            }
        }

        return savedImagePaths;
    }

    async processAndSaveSingleImage(image: Express.Multer.File): Promise<string> {
        const publicImageDir = path.join(process.cwd(), 'public', 'images', 'stores');

        try {
            // Create directory if it doesn't exist
            fs.mkdirSync(publicImageDir, { recursive: true });

            // Process filename
            const originalName = path.parse(image.originalname).name;
            const outputFilename = `${originalName}-${Date.now()}.webp`;
            const outputPath = path.join(publicImageDir, outputFilename);

            // Process image with sharp
            await sharp(image.path)
                .resize(1200, 1200, {
                    fit: 'inside',
                    withoutEnlargement: true
                })
                .webp({ quality: 80 })
                .toFile(outputPath);

            // Remove temporary file
            fs.unlinkSync(image.path);

            // Return relative path
            return `public/images/stores/${outputFilename}`;

        } catch (error) {
            // Cleanup if error occurs
            if (fs.existsSync(image.path)) {
                fs.unlinkSync(image.path);
            }
            throw new Error(`Failed to process image: ${error.message}`);
        }
    }
}