const multer = require('multer');
const AppError = require('../utils/appError');

// Use memory storage so we can process and optimize images via Sharp
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    if (allowedMimeTypes.includes(file.mimetype)) {
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
        fileSize: 10 * 1024 * 1024, // 10MB limit
    },
    fileFilter,
});

module.exports = upload;
