import * as sharp from 'sharp';
import * as path from 'path';
import * as fs from 'fs';

export async function compressImage(inputPath: string): Promise<string> {
    const outputPath = inputPath.replace(/(\.\w+)$/, '-compressed$1');

    await sharp(inputPath)
        .resize(1200, 1200, { // Adjust max dimensions as needed
            fit: 'inside',
            withoutEnlargement: true
        })
        .jpeg({
            quality: 80,
            progressive: true
        })
        .png({
            quality: 80,
            progressive: true
        })
        .webp({
            quality: 80
        })
        .toFile(outputPath);

    // Remove original and rename compressed file
    fs.unlinkSync(inputPath);
    fs.renameSync(outputPath, inputPath);

    return inputPath;
}