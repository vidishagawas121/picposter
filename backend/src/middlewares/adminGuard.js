/**
 * Middleware to restrict access to users with role === 'admin'.
 * Returns 403 FORBIDDEN_ADMIN_ONLY if the user is not an administrator.
 */
const adminGuard = (req, res, next) => {
    if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({
            success: false,
            message: 'Access denied. Admin privileges required.',
            errorCode: 'FORBIDDEN_ADMIN_ONLY',
        });
    }
    next();
};

module.exports = adminGuard;
