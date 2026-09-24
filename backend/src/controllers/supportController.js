const SupportQuery = require('../models/SupportQuery');
const AppError = require('../utils/appError');
const { sendSuccess } = require('../utils/apiResponse');
const catchAsync = require('../utils/catchAsync');

/**
 * @desc    Submit support / contact us form query
 * @route   POST /api/v1/support/contact
 * @access  Public
 */
const submitContactQuery = catchAsync(async (req, res, next) => {
    const { name, contact, query } = req.body;

    if (!name || !contact || !query) {
        return next(
            new AppError(
                'Please provide your name, contact information, and query description.',
                400,
                'MISSING_FIELDS'
            )
        );
    }

    const userId = req.user ? req.user._id : null;

    const newQuery = await SupportQuery.create({
        name: name.trim(),
        contact: contact.trim(),
        query: query.trim(),
        userId,
        status: 'pending',
    });

    return sendSuccess(
        res,
        201,
        'Your query has been submitted successfully.',
        {
            id: newQuery._id,
            status: newQuery.status,
            createdAt: newQuery.createdAt,
        }
    );
});

/**
 * @desc    Get support queries (admin / user)
 * @route   GET /api/v1/support/queries
 * @access  Private
 */
const getSupportQueries = catchAsync(async (req, res) => {
    const filter = req.user && req.user.role === 'admin' ? {} : { userId: req.user._id };
    const queries = await SupportQuery.find(filter).sort({ createdAt: -1 });

    return sendSuccess(res, 200, 'Support queries retrieved successfully', queries);
});

module.exports = {
    submitContactQuery,
    getSupportQueries,
};
