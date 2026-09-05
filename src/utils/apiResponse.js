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
const sendError = (res, statusCode = 500, message = 'An error occurred', errorCode = 'INTERNAL_ERROR', errors = []) => {
    return res.status(statusCode).json({
        success: false,
        message,
        errorCode,
        errors,
    });
};

module.exports = {
    sendSuccess,
    sendError,
};
