/**
 * Sends a standardized success response.
 */
const sendSuccess = (res, statusCode = 200, message = 'Operation completed successfully', data = null, meta = {}) => {
    const responsePayload = {
        success: true,
        message,
    };

    if (data !== null && data !== undefined) {
        responsePayload.data = data;
    }

    if (meta.page !== undefined) responsePayload.page = meta.page;
    if (meta.totalPages !== undefined) responsePayload.totalPages = meta.totalPages;
    if (meta.totalCount !== undefined) responsePayload.totalCount = meta.totalCount;

    return res.status(statusCode).json(responsePayload);
};

/**
 * Sends a standardized error response.
 */
const sendError = (res, statusCode = 500, message = 'An error occurred', errorCode = 'INTERNAL_ERROR', errors = [], data = null) => {
    const responsePayload = {
        success: false,
        message,
        errorCode,
        errors,
    };

    if (data !== null && data !== undefined) {
        responsePayload.data = data;
    }

    return res.status(statusCode).json(responsePayload);
};

module.exports = {
    sendSuccess,
    sendError,
};
