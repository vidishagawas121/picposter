const { sendError } = require('../utils/apiResponse');

const errorHandler = (err, req, res, next) => {
    let statusCode = err.statusCode || 500;
    let message = err.message || 'Internal server error';
    let errorCode = err.errorCode || 'INTERNAL_SERVER_ERROR';
    let errors = err.errors || [];

    // Mongoose Validation Error
    if (err.name === 'ValidationError') {
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

    if (process.env.NODE_ENV === 'development' && statusCode === 500) {
        console.error('Unhandled Error:', err);
    }

    return sendError(res, statusCode, message, errorCode, errors);
};

module.exports = errorHandler;
