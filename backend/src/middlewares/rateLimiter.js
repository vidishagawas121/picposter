const rateLimit = require('express-rate-limit');
const { sendError } = require('../utils/apiResponse');

/**
 * General API rate limiter: 120 requests per minute
 */
const apiLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: process.env.NODE_ENV === 'production' ? 120 : 1000,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        return sendError(res, 429, 'Too many requests. Please slow down.', 'RATE_LIMIT_EXCEEDED');
    },
});

/**
 * OTP send rate limiter: Max 10 requests per hour per IP
 */
const otpSendLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: process.env.NODE_ENV === 'production' ? 10 : 200,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        return sendError(res, 429, 'Too many OTP requests from this IP. Please try again after 1 hour.', 'OTP_RATE_LIMIT_EXCEEDED');
    },
});

/**
 * OTP verify rate limiter: Max 10 requests per 15 minutes per IP
 * Prevents brute-force OTP guessing attacks
 */
const otpVerifyLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: process.env.NODE_ENV === 'production' ? 10 : 200,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        return sendError(res, 429, 'Too many verification attempts. Please try again later.', 'OTP_VERIFY_RATE_LIMIT');
    },
});

/**
 * Auth endpoint rate limiter: Max 20 requests per minute per IP
 * Covers refresh-token and other auth endpoints
 */
const authLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: process.env.NODE_ENV === 'production' ? 20 : 500,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        return sendError(res, 429, 'Too many authentication requests. Please wait a moment.', 'AUTH_RATE_LIMIT_EXCEEDED');
    },
});

module.exports = {
    apiLimiter,
    otpSendLimiter,
    otpVerifyLimiter,
    authLimiter,
};
