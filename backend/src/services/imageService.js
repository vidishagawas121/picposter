const sharp = require('sharp');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

class ImageService {
    constructor() {
        this.baseUploadDir = path.join(__dirname, '../../uploads');
        this.ensureDirectories();
    }

    ensureDirectories() {
        const subdirs = ['users', 'business', 'posters', 'creations', 'categories', 'icons'];
        if (!fs.existsSync(this.baseUploadDir)) {
            fs.mkdirSync(this.baseUploadDir, { recursive: true });
        }
        for (const dir of subdirs) {
            const targetPath = path.join(this.baseUploadDir, dir);
            if (!fs.existsSync(targetPath)) {
                fs.mkdirSync(targetPath, { recursive: true });
            }
        }
    }

    getBaseUrl(req) {
        if (process.env.API_BASE_URL) {
            return process.env.API_BASE_URL;
        }
        if (req) {
            return `${req.protocol}://${req.get('host')}`;
        }
        return 'http://localhost:5000';
    }

    /**
     * Process user avatar / profile photo (WebP 85%, max 500x500)
     */
    async processProfilePhoto(fileBuffer, req) {
        const filename = `avatar_${Date.now()}_${crypto.randomBytes(4).toString('hex')}.webp`;
        const outputPath = path.join(this.baseUploadDir, 'users', filename);

        await sharp(fileBuffer)
            .rotate()
            .resize(500, 500, {
                fit: 'cover',
                withoutEnlargement: true,
            })
            .webp({ quality: 85 })
            .toFile(outputPath);

        const baseUrl = this.getBaseUrl(req);
        return `${baseUrl}/uploads/users/${filename}`;
    }

    /**
     * Process business logo (WebP 85%, max 800x800 with transparency preserved)
     */
    async processBusinessLogo(fileBuffer, req) {
        const filename = `logo_${Date.now()}_${crypto.randomBytes(4).toString('hex')}.webp`;
        const outputPath = path.join(this.baseUploadDir, 'business', filename);

        await sharp(fileBuffer)
            .rotate()
            .resize(800, 800, {
                fit: 'inside',
                withoutEnlargement: true,
            })
            .webp({ quality: 85, alphaQuality: 90 })
            .toFile(outputPath);

        const baseUrl = this.getBaseUrl(req);
        return `${baseUrl}/uploads/business/${filename}`;
    }

    /**
     * Process poster template image + generate thumbnail
     * Standard: WebP 85% max 1200x1200, thumbnail 400x400 WebP 70%
     */
    async processPosterImage(fileBuffer, req) {
        const idStr = `${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
        const mainFilename = `poster_${idStr}.webp`;
        const thumbFilename = `thumb_${idStr}.webp`;

        const mainOutputPath = path.join(this.baseUploadDir, 'posters', mainFilename);
        const thumbOutputPath = path.join(this.baseUploadDir, 'posters', thumbFilename);

        await sharp(fileBuffer)
            .rotate() // Auto-orient according to EXIF before stripping
            .resize(1200, 1200, {
                fit: 'inside',
                withoutEnlargement: true,
            })
            .webp({ quality: 85 })
            .toFile(mainOutputPath);

        await sharp(fileBuffer)
            .rotate()
            .resize(400, 400, {
                fit: 'inside',
                withoutEnlargement: true,
            })
            .webp({ quality: 70 })
            .toFile(thumbOutputPath);

        const baseUrl = this.getBaseUrl(req);
        return {
            imageUrl: `${baseUrl}/uploads/posters/${mainFilename}`,
            thumbnailUrl: `${baseUrl}/uploads/posters/${thumbFilename}`,
        };
    }

    /**
     * Process category icon image (WebP 90%, max 200x200)
     */
    async processCategoryIcon(fileBuffer, req) {
        const filename = `icon_${Date.now()}_${crypto.randomBytes(4).toString('hex')}.webp`;
        const outputPath = path.join(this.baseUploadDir, 'categories', filename);

        await sharp(fileBuffer)
            .rotate()
            .resize(200, 200, {
                fit: 'inside',
                withoutEnlargement: true,
            })
            .webp({ quality: 90 })
            .toFile(outputPath);

        const baseUrl = this.getBaseUrl(req);
        return `${baseUrl}/uploads/categories/${filename}`;
    }

    /**
     * Process customized user creation poster
     */
    async processUserCreation(fileBuffer, req) {
        const filename = `creation_${Date.now()}_${crypto.randomBytes(4).toString('hex')}.webp`;
        const outputPath = path.join(this.baseUploadDir, 'creations', filename);

        await sharp(fileBuffer)
            .rotate()
            .webp({ quality: 85 })
            .toFile(outputPath);

        const baseUrl = this.getBaseUrl(req);
        return `${baseUrl}/uploads/creations/${filename}`;
    }

    /**
     * Safely delete local file from disk if URL belongs to /uploads/
     */
    async deleteLocalFile(fileUrl) {
        if (!fileUrl || typeof fileUrl !== 'string') return;
        try {
            const match = fileUrl.match(/\/uploads\/([a-zA-Z0-9_\-\/]+\.[a-zA-Z0-9]+)/);
            if (match && match[1]) {
                const relativePath = match[1];
                const resolvedBase = path.resolve(this.baseUploadDir);
                const fullPath = path.resolve(this.baseUploadDir, relativePath);

                // Strictly ensure target file resides inside base uploads directory
                if (fullPath.startsWith(resolvedBase) && fs.existsSync(fullPath)) {
                    fs.unlinkSync(fullPath);
                }
            }
        } catch (err) {
            console.error('Error deleting local file:', err.message);
        }
    }
}

module.exports = new ImageService();
