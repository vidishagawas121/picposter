const User = require('../models/User');
const BusinessInfo = require('../models/BusinessInfo');
const UserCreation = require('../models/UserCreation');
const AppError = require('../utils/appError');
const { sendSuccess } = require('../utils/apiResponse');
const catchAsync = require('../utils/catchAsync');
const { escapeRegex } = require('../utils/sanitizer');

/**
 * @desc    Get all users with filtering, search, and pagination
 * @route   GET /api/v1/admin/users
 * @access  Admin
 */
const getUsers = catchAsync(async (req, res) => {
    const {
        search,
        isVerified,
        isActive,
        role,
        startDate,
        endDate,
        sortBy = 'createdAt',
        sortOrder = 'desc',
    } = req.query;

    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit, 10) || 20));
    const skip = (page - 1) * limit;

    const filter = {};

    if (isVerified !== undefined && isVerified !== '') {
        filter.isVerified = isVerified === 'true' || isVerified === true;
    }

    if (isActive !== undefined && isActive !== '') {
        filter.isActive = isActive === 'true' || isActive === true;
    }

    if (role && typeof role === 'string' && role.toLowerCase() !== 'all') {
        filter.role = role.toLowerCase().trim();
    }

    if (startDate || endDate) {
        filter.createdAt = {};
        if (startDate) filter.createdAt.$gte = new Date(startDate);
        if (endDate) {
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);
            filter.createdAt.$lte = end;
        }
    }

    if (search && typeof search === 'string' && search.trim()) {
        const escaped = escapeRegex(search.trim());
        const searchRegex = new RegExp(escaped, 'i');
        filter.$or = [
            { name: searchRegex },
            { mobile: searchRegex },
            { email: searchRegex },
        ];
    }

    const sortDirection = sortOrder.toLowerCase() === 'asc' ? 1 : -1;
    const sortOptions = {};
    sortOptions[sortBy] = sortDirection;

    const [users, totalCount] = await Promise.all([
        User.find(filter)
            .select('-savedTemplates')
            .sort(sortOptions)
            .skip(skip)
            .limit(limit),
        User.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(totalCount / limit) || 1;

    return sendSuccess(
        res,
        200,
        'Users retrieved successfully',
        users,
        { page, totalPages, totalCount }
    );
});

/**
 * @desc    Get user profile with business info and creations count
 * @route   GET /api/v1/admin/users/:id
 * @access  Admin
 */
const getUserById = catchAsync(async (req, res, next) => {
    const user = await User.findById(req.params.id);

    if (!user) {
        return next(new AppError('User not found', 404, 'USER_NOT_FOUND'));
    }

    const [businessProfile, totalCreations] = await Promise.all([
        BusinessInfo.findOne({ userId: user._id }),
        UserCreation.countDocuments({ userId: user._id }),
    ]);

    return sendSuccess(res, 200, 'User details retrieved successfully', {
        user,
        businessProfile: businessProfile || null,
        totalCreations,
    });
});

/**
 * @desc    Toggle user active/deactive status
 * @route   PATCH /api/v1/admin/users/:id/status
 * @access  Admin
 */
const updateUserStatus = catchAsync(async (req, res, next) => {
    const { isActive } = req.body;

    if (isActive === undefined) {
        return next(new AppError('isActive field is required', 400, 'VALIDATION_ERROR'));
    }

    if (req.user && req.user._id.toString() === req.params.id && (isActive === false || isActive === 'false')) {
        return next(new AppError('You cannot deactivate your own admin account.', 400, 'CANNOT_DEACTIVATE_SELF'));
    }

    const user = await User.findByIdAndUpdate(
        req.params.id,
        { isActive: isActive === true || isActive === 'true' },
        { returnDocument: 'after' }
    );

    if (!user) {
        return next(new AppError('User not found', 404, 'USER_NOT_FOUND'));
    }

    return sendSuccess(
        res,
        200,
        `User account ${user.isActive ? 'activated' : 'deactivated'} successfully`,
        user
    );
});

/**
 * @desc    Change user role (user <-> admin)
 * @route   PATCH /api/v1/admin/users/:id/role
 * @access  Admin
 */
const updateUserRole = catchAsync(async (req, res, next) => {
    const { role } = req.body;

    if (!role || !['user', 'admin'].includes(role.toLowerCase())) {
        return next(new AppError('Valid role ("user" or "admin") is required', 400, 'INVALID_ROLE'));
    }

    if (
        req.user &&
        req.user._id.toString() === req.params.id &&
        role.toLowerCase() === 'user'
    ) {
        return next(new AppError('You cannot revoke your own admin role.', 400, 'CANNOT_DEMOTE_SELF'));
    }

    const user = await User.findByIdAndUpdate(
        req.params.id,
        { role: role.toLowerCase() },
        { returnDocument: 'after' }
    );

    if (!user) {
        return next(new AppError('User not found', 404, 'USER_NOT_FOUND'));
    }

    return sendSuccess(res, 200, `User role updated to "${user.role}" successfully`, user);
});

/**
 * @desc    Get user creation history
 * @route   GET /api/v1/admin/users/:id/creations
 * @access  Admin
 */
const getUserCreations = catchAsync(async (req, res, next) => {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit, 10) || 20));
    const skip = (page - 1) * limit;

    const user = await User.findById(req.params.id);
    if (!user) {
        return next(new AppError('User not found', 404, 'USER_NOT_FOUND'));
    }

    const [creations, totalCount] = await Promise.all([
        UserCreation.find({ userId: req.params.id })
            .populate('posterId', 'title category language imageUrl')
            .sort({ savedAt: -1 })
            .skip(skip)
            .limit(limit),
        UserCreation.countDocuments({ userId: req.params.id }),
    ]);

    const totalPages = Math.ceil(totalCount / limit) || 1;

    return sendSuccess(
        res,
        200,
        'User creations retrieved successfully',
        creations,
        { page, totalPages, totalCount }
    );
});

module.exports = {
    getUsers,
    getUserById,
    updateUserStatus,
    updateUserRole,
    getUserCreations,
};
