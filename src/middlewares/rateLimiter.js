const rateLimit = require('express-rate-limit');
const { sendError } = require('../utils/apiResponse');

/**
 * General API rate limiter: 120 requests per minute
 */
const apiLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 120,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        return sendError(res, 429, 'Too many requests. Please slow down.', 'RATE_LIMIT_EXCEEDED');
    },
});

/**
 * OTP send rate limiter: Max 5 requests per hour per IP / endpoint
 */
const otpSendLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        return sendError(res, 429, 'Too many OTP requests from this IP. Please try again after 1 hour.', 'OTP_RATE_LIMIT_EXCEEDED');
    },
});

module.exports = {
    apiLimiter,
    otpSendLimiter,
};
