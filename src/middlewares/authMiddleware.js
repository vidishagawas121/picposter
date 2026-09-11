const jwt = require('jsonwebtoken');
const User = require('../models/User');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');

/**
 * Protect routes: verifies access token in Authorization: Bearer <token>
 */
const protect = catchAsync(async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
        return next(new AppError('Authentication required. Please provide a valid bearer token.', 401, 'UNAUTHORIZED'));
    }

    const secret = process.env.JWT_ACCESS_SECRET;
    if (!secret) {
        return next(new AppError('Server configuration error. Please contact support.', 500, 'CONFIG_ERROR'));
    }

    const decoded = jwt.verify(token, secret);

    const currentUser = await User.findById(decoded.userId);
    if (!currentUser) {
        return next(new AppError('The user belonging to this token no longer exists.', 401, 'USER_NOT_FOUND'));
    }

    if (!currentUser.isActive) {
        return next(new AppError('Your account has been deactivated. Please contact support.', 403, 'ACCOUNT_DEACTIVATED'));
    }

    req.user = currentUser;
    next();
});

/**
 * Optional authentication: extracts user if token is provided, otherwise leaves req.user undefined.
 */
const optionalAuth = catchAsync(async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
        return next();
    }

    try {
        const secret = process.env.JWT_ACCESS_SECRET;
        if (!secret) {
            return next();
        }
        const decoded = jwt.verify(token, secret);
        const currentUser = await User.findById(decoded.userId);
        if (currentUser && currentUser.isActive) {
            req.user = currentUser;
        }
    } catch (err) {
        // Silently ignore invalid tokens in optional auth mode
    }

    next();
});

/**
 * Role-based authorization
 */
const restrictTo = (...roles) => {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return next(new AppError('You do not have permission to perform this action.', 403, 'FORBIDDEN'));
        }
        next();
    };
};

module.exports = {
    protect,
    optionalAuth,
    restrictTo,
};
