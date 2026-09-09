const analyticsService = require('../services/analyticsService');
const { sendSuccess } = require('../utils/apiResponse');
const catchAsync = require('../utils/catchAsync');

/**
 * @desc    Get dashboard analytics overview
 * @route   GET /api/v1/admin/analytics/overview
 * @access  Admin
 */
const getOverview = catchAsync(async (req, res) => {
    const data = await analyticsService.getOverview();
    return sendSuccess(res, 200, 'Analytics overview retrieved successfully', data);
});

/**
 * @desc    Get user growth metrics (last N days)
 * @route   GET /api/v1/admin/analytics/users/growth
 * @access  Admin
 */
const getUserGrowth = catchAsync(async (req, res) => {
    const days = req.query.days || 30;
    const data = await analyticsService.getUserGrowth(days);
    return sendSuccess(res, 200, 'User growth analytics retrieved successfully', data);
});

/**
 * @desc    Get top downloaded / shared posters
 * @route   GET /api/v1/admin/analytics/posters/top
 * @access  Admin
 */
const getTopPosters = catchAsync(async (req, res) => {
    const limit = req.query.limit || 10;
    const data = await analyticsService.getTopPosters(limit);
    return sendSuccess(res, 200, 'Top posters retrieved successfully', data);
});

/**
 * @desc    Get poster distribution across categories
 * @route   GET /api/v1/admin/analytics/categories/distribution
 * @access  Admin
 */
const getCategoryDistribution = catchAsync(async (req, res) => {
    const data = await analyticsService.getCategoryDistribution();
    return sendSuccess(res, 200, 'Category distribution retrieved successfully', data);
});

/**
 * @desc    Get poster downloads / shares distribution across languages
 * @route   GET /api/v1/admin/analytics/languages/distribution
 * @access  Admin
 */
const getLanguageDistribution = catchAsync(async (req, res) => {
    const data = await analyticsService.getLanguageDistribution();
    return sendSuccess(res, 200, 'Language distribution retrieved successfully', data);
});

module.exports = {
    getOverview,
    getUserGrowth,
    getTopPosters,
    getCategoryDistribution,
    getLanguageDistribution,
};
