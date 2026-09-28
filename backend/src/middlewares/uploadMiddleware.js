const multer = require('multer');
const AppError = require('../utils/appError');

// Use memory storage so we can process and optimize images via Sharp
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
    // Permissive image check: allow any image MIME type, application/octet-stream, or standard image extensions
    const isImageMime = file.mimetype && file.mimetype.toLowerCase().startsWith('image/');
    const isOctetStream = file.mimetype === 'application/octet-stream';
    const hasImageExt = /\.(jpe?g|png|webp|gif|bmp|heic|heif|svg)$/i.test(file.originalname || '');

    if (isImageMime || isOctetStream || hasImageExt) {
        cb(null, true);
    } else {
        cb(
            new AppError(
                'Invalid file type. Only JPEG, PNG, and WebP images are allowed.',
                400,
                'INVALID_FILE_TYPE'
            ),
            false
        );
    }
};

const upload = multer({
    storage,
    limits: {
        fileSize: 15 * 1024 * 1024, // 15MB limit
    },
    fileFilter,
});

module.exports = upload;
