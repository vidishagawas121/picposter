const SupportQuery = require('../models/SupportQuery');
const AppError = require('../utils/appError');
const { sendSuccess } = require('../utils/apiResponse');
const catchAsync = require('../utils/catchAsync');

/**
 * @desc    Get all support queries with filtering and pagination
 * @route   GET /api/v1/admin/support
 * @access  Admin
 */
const getSupportQueries = catchAsync(async (req, res) => {
    const {
        status,
        search,
        sortBy = 'createdAt',
        sortOrder = 'desc',
    } = req.query;

    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit, 10) || 20));
    const skip = (page - 1) * limit;

    const filter = {};

    if (status && status.toLowerCase() !== 'all') {
        const normalized = status.toLowerCase();
        // Support matching case-insensitively (e.g. pending, PENDING, in_progress, IN_PROGRESS)
        filter.status = new RegExp(`^${normalized}$`, 'i');
    }

    if (search && search.trim()) {
        const searchRegex = new RegExp(search.trim(), 'i');
        filter.$or = [
            { name: searchRegex },
            { contact: searchRegex },
            { query: searchRegex },
        ];
    }

    const sortDirection = sortOrder.toLowerCase() === 'asc' ? 1 : -1;
    const sortOptions = {};
    sortOptions[sortBy] = sortDirection;

    const [queries, totalCount] = await Promise.all([
        SupportQuery.find(filter)
            .populate('userId', 'name mobile email profilePhoto')
            .sort(sortOptions)
            .skip(skip)
            .limit(limit),
        SupportQuery.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(totalCount / limit) || 1;

    return sendSuccess(
        res,
        200,
        'Support queries retrieved successfully',
        queries,
        { page, totalPages, totalCount }
    );
});

/**
 * @desc    Get single support query details
 * @route   GET /api/v1/admin/support/:id
 * @access  Admin
 */
const getSupportQueryById = catchAsync(async (req, res, next) => {
    const query = await SupportQuery.findById(req.params.id).populate(
        'userId',
        'name mobile email profilePhoto preferredLanguage'
    );

    if (!query) {
        return next(new AppError('Support query not found', 404, 'QUERY_NOT_FOUND'));
    }

    return sendSuccess(res, 200, 'Support query retrieved successfully', query);
});

/**
 * @desc    Update support query status (PENDING -> IN_PROGRESS -> RESOLVED -> CLOSED)
 * @route   PATCH /api/v1/admin/support/:id/status
 * @access  Admin
 */
const updateSupportStatus = catchAsync(async (req, res, next) => {
    const { status } = req.body;

    const allowedStatuses = ['PENDING', 'IN_PROGRESS', 'RESOLVED', 'CLOSED', 'pending', 'in_progress', 'resolved', 'closed'];

    if (!status || !allowedStatuses.includes(status)) {
        return next(
            new AppError(
                'Invalid status. Allowed values: PENDING, IN_PROGRESS, RESOLVED, CLOSED',
                400,
                'INVALID_STATUS'
            )
        );
    }

    const normalizedStatus = status.toLowerCase();

    const query = await SupportQuery.findByIdAndUpdate(
        req.params.id,
        { status: normalizedStatus },
        { returnDocument: 'after' }
    ).populate('userId', 'name mobile email');

    if (!query) {
        return next(new AppError('Support query not found', 404, 'QUERY_NOT_FOUND'));
    }

    return sendSuccess(res, 200, `Support query status updated to "${status.toUpperCase()}"`, query);
});

/**
 * @desc    Delete support query
 * @route   DELETE /api/v1/admin/support/:id
 * @access  Admin
 */
const deleteSupportQuery = catchAsync(async (req, res, next) => {
    const query = await SupportQuery.findById(req.params.id);

    if (!query) {
        return next(new AppError('Support query not found', 404, 'QUERY_NOT_FOUND'));
    }

    await SupportQuery.findByIdAndDelete(req.params.id);

    return sendSuccess(res, 200, 'Support query deleted successfully');
});

module.exports = {
    getSupportQueries,
    getSupportQueryById,
    updateSupportStatus,
    deleteSupportQuery,
};
