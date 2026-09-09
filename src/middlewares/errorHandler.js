const { sendError } = require('../utils/apiResponse');

const errorHandler = (err, req, res, next) => {
    let statusCode = err.statusCode || 500;
    let message = err.message || 'Internal server error';
    let errorCode = err.errorCode || 'INTERNAL_SERVER_ERROR';
    let errors = err.errors || [];

    // Body parser JSON Syntax Error
    if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
        statusCode = 400;
        errorCode = 'INVALID_JSON';
        message = 'Malformed JSON payload in request body';
    }

    // Mongoose Validation Error
    else if (err.name === 'ValidationError') {
        statusCode = 400;
        errorCode = 'VALIDATION_ERROR';
        message = 'Invalid request payload';
        errors = Object.keys(err.errors).map((key) => ({
            field: key,
            message: err.errors[key].message,
        }));
    }

    // Mongoose Duplicate Key Error (E11000)
    else if (err.code === 11000) {
        statusCode = 409;
        errorCode = 'DUPLICATE_KEY_ERROR';
        const field = Object.keys(err.keyValue || {})[0] || 'field';
        message = `${field} already exists.`;
        errors = [{ field, message: `${field} must be unique.` }];
    }

    // Mongoose CastError (Invalid ObjectId)
    else if (err.name === 'CastError') {
        statusCode = 400;
        errorCode = 'INVALID_ID';
        message = `Invalid format for resource ID: ${err.value}`;
        errors = [{ field: err.path, message: `Invalid identifier` }];
    }

    // JWT Errors
    else if (err.name === 'JsonWebTokenError') {
        statusCode = 401;
        errorCode = 'INVALID_TOKEN';
        message = 'Invalid authentication token. Please log in again.';
    } else if (err.name === 'TokenExpiredError') {
        statusCode = 401;
        errorCode = 'TOKEN_EXPIRED';
        message = 'Authentication token has expired. Please refresh your session.';
    }

    // Multer Upload Errors
    else if (err.name === 'MulterError') {
        statusCode = 400;
        errorCode = 'UPLOAD_ERROR';
        if (err.code === 'LIMIT_FILE_SIZE') {
            message = 'Uploaded file is too large. Maximum size is 10MB.';
        } else {
            message = err.message || 'File upload failed';
        }
    }

    // Sharp Image Processing Errors (Unsupported or corrupted image)
    else if (err.message && (err.message.includes('unsupported image format') || err.message.includes('Input buffer'))) {
        statusCode = 400;
        errorCode = 'INVALID_IMAGE_FILE';
        message = 'Uploaded image is corrupted or in an unsupported format. Please upload a valid JPEG, PNG, or WebP image.';
    }

    // Mask non-operational 500 errors in production to prevent information leakage
    if (statusCode === 500 && process.env.NODE_ENV === 'production' && !err.isOperational) {
        message = 'Internal server error. Please try again later.';
        errorCode = 'INTERNAL_SERVER_ERROR';
        errors = [];
    }

    if (process.env.NODE_ENV === 'development' && statusCode === 500) {
        console.error(`[SERVER ERROR ${statusCode}]`, err);
    }

    return sendError(res, statusCode, message, errorCode, errors);
};

module.exports = errorHandler;

