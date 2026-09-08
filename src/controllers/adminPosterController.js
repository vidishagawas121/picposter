const mongoose = require('mongoose');
const Poster = require('../models/Poster');
const Category = require('../models/Category');
const imageService = require('../services/imageService');
const AppError = require('../utils/appError');
const { sendSuccess } = require('../utils/apiResponse');
const catchAsync = require('../utils/catchAsync');

/**
 * @desc    Get all posters for admin with full filters and pagination
 * @route   GET /api/v1/admin/posters
 * @access  Admin
 */
const getPosters = catchAsync(async (req, res) => {
    const {
        category,
        language,
        search,
        aspectRatio,
        isTrending,
        isPremium,
        isActive,
        sortBy = 'createdAt',
        sortOrder = 'desc',
    } = req.query;

    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit, 10) || 20));
    const skip = (page - 1) * limit;

    const filter = {};

    // Filter by isActive
    if (isActive !== undefined && isActive !== '') {
        filter.isActive = isActive === 'true' || isActive === true;
    }

    // Filter by Category (slug or ObjectId)
    if (category && category.toLowerCase() !== 'all') {
        if (mongoose.Types.ObjectId.isValid(category)) {
            filter.$or = [{ categoryId: category }, { category: category }];
        } else {
            filter.category = new RegExp(`^${category.trim()}$`, 'i');
        }
    }

    // Filter by Language
    if (language && language.toLowerCase() !== 'all') {
        filter.language = new RegExp(`^${language.trim()}$`, 'i');
    }

    // Filter by Aspect Ratio
    if (aspectRatio && aspectRatio.toLowerCase() !== 'all') {
        filter.aspectRatio = aspectRatio;
    }

    // Filter by Trending
    if (isTrending !== undefined && isTrending !== '') {
        filter.isTrending = isTrending === 'true' || isTrending === true;
    }

    // Filter by Premium
    if (isPremium !== undefined && isPremium !== '') {
        filter.isPremium = isPremium === 'true' || isPremium === true;
    }

    // Search by title or tags
    if (search && search.trim()) {
        const searchRegex = new RegExp(search.trim(), 'i');
        const searchConditions = [
            { title: searchRegex },
            { tags: searchRegex },
            { category: searchRegex },
        ];
        if (filter.$or) {
            filter.$and = [{ $or: filter.$or }, { $or: searchConditions }];
            delete filter.$or;
        } else {
            filter.$or = searchConditions;
        }
    }

    const sortDirection = sortOrder.toLowerCase() === 'asc' ? 1 : -1;
    const sortOptions = {};
    sortOptions[sortBy] = sortDirection;

    const [posters, totalCount] = await Promise.all([
        Poster.find(filter)
            .populate('categoryId', 'name slug iconUrl')
            .sort(sortOptions)
            .skip(skip)
            .limit(limit),
        Poster.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(totalCount / limit) || 1;

    return sendSuccess(
        res,
        200,
        'Posters retrieved successfully',
        posters,
        { page, totalPages, totalCount }
    );
});

/**
 * @desc    Get single poster by ID for admin
 * @route   GET /api/v1/admin/posters/:id
 * @access  Admin
 */
const getPosterById = catchAsync(async (req, res, next) => {
    const poster = await Poster.findById(req.params.id).populate('categoryId', 'name slug iconUrl');

    if (!poster) {
        return next(new AppError('Poster not found', 404, 'POSTER_NOT_FOUND'));
    }

    return sendSuccess(res, 200, 'Poster details retrieved successfully', poster);
});

/**
 * @desc    Create a new poster (multipart/form-data or json)
 * @route   POST /api/v1/admin/posters
 * @access  Admin
 */
const createPoster = catchAsync(async (req, res, next) => {
    const {
        title,
        category,
        language = 'English',
        tags,
        aspectRatio = '1:1',
        isTrending,
        isPremium,
        isActive,
    } = req.body;

    let imageUrl = req.body.imageUrl;
    let thumbnailUrl = req.body.thumbnailUrl;

    // Validation
    if (!title || title.trim().length < 3 || title.trim().length > 120) {
        return next(new AppError('Title is required and must be between 3 and 120 characters', 400, 'VALIDATION_ERROR'));
    }

    if (!category) {
        return next(new AppError('Category is required', 400, 'VALIDATION_ERROR'));
    }

    if (!req.file && !imageUrl) {
        return next(new AppError('Poster image is required', 400, 'IMAGE_REQUIRED'));
    }

    // Process image file if uploaded
    if (req.file) {
        const processed = await imageService.processPosterImage(req.file.buffer, req);
        imageUrl = processed.imageUrl;
        thumbnailUrl = processed.thumbnailUrl;
    }

    // Resolve category name and ID
    let categorySlug = category.trim().toLowerCase();
    let categoryDoc = null;

    if (mongoose.Types.ObjectId.isValid(category)) {
        categoryDoc = await Category.findById(category);
        if (categoryDoc) {
            categorySlug = categoryDoc.slug;
        }
    } else {
        categoryDoc = await Category.findOne({
            $or: [{ slug: categorySlug }, { name: new RegExp(`^${category.trim()}$`, 'i') }],
        });
    }

    // Parse tags
    const parsedTags = Array.isArray(tags)
        ? tags
        : typeof tags === 'string'
        ? tags.split(',').map((t) => t.trim().toLowerCase()).filter(Boolean)
        : [];

    const poster = await Poster.create({
        title: title.trim(),
        imageUrl,
        thumbnailUrl: thumbnailUrl || imageUrl,
        category: categorySlug,
        categoryId: categoryDoc ? categoryDoc._id : null,
        language: language || 'English',
        tags: parsedTags,
        aspectRatio: ['1:1', '4:5', '9:16', '16:9'].includes(aspectRatio) ? aspectRatio : '1:1',
        isTrending: isTrending === 'true' || isTrending === true,
        isPremium: isPremium === 'true' || isPremium === true,
        isActive: isActive !== undefined ? (isActive === 'true' || isActive === true) : true,
    });

    return sendSuccess(res, 201, 'Poster created successfully', poster);
});

/**
 * @desc    Update an existing poster
 * @route   PUT /api/v1/admin/posters/:id
 * @access  Admin
 */
const updatePoster = catchAsync(async (req, res, next) => {
    const poster = await Poster.findById(req.params.id);

    if (!poster) {
        return next(new AppError('Poster not found', 404, 'POSTER_NOT_FOUND'));
    }

    const {
        title,
        category,
        language,
        tags,
        aspectRatio,
        isTrending,
        isPremium,
        isActive,
        downloadsCount,
        sharesCount,
        viewsCount,
    } = req.body;

    if (title !== undefined) {
        if (title.trim().length < 3 || title.trim().length > 120) {
            return next(new AppError('Title must be between 3 and 120 characters', 400, 'VALIDATION_ERROR'));
        }
        poster.title = title.trim();
    }

    // Handle new image upload
    if (req.file) {
        // Delete old image files if they were local
        await imageService.deleteLocalFile(poster.imageUrl);
        await imageService.deleteLocalFile(poster.thumbnailUrl);

        const processed = await imageService.processPosterImage(req.file.buffer, req);
        poster.imageUrl = processed.imageUrl;
        poster.thumbnailUrl = processed.thumbnailUrl;
    } else if (req.body.imageUrl) {
        poster.imageUrl = req.body.imageUrl;
        if (req.body.thumbnailUrl) {
            poster.thumbnailUrl = req.body.thumbnailUrl;
        }
    }

    if (category !== undefined) {
        let categorySlug = category.trim().toLowerCase();
        let categoryDoc = null;
        if (mongoose.Types.ObjectId.isValid(category)) {
            categoryDoc = await Category.findById(category);
            if (categoryDoc) categorySlug = categoryDoc.slug;
        } else {
            categoryDoc = await Category.findOne({
                $or: [{ slug: categorySlug }, { name: new RegExp(`^${category.trim()}$`, 'i') }],
            });
        }
        poster.category = categorySlug;
        poster.categoryId = categoryDoc ? categoryDoc._id : poster.categoryId;
    }

    if (language !== undefined) poster.language = language;
    if (aspectRatio !== undefined && ['1:1', '4:5', '9:16', '16:9'].includes(aspectRatio)) {
        poster.aspectRatio = aspectRatio;
    }

    if (tags !== undefined) {
        poster.tags = Array.isArray(tags)
            ? tags
            : typeof tags === 'string'
            ? tags.split(',').map((t) => t.trim().toLowerCase()).filter(Boolean)
            : [];
    }

    if (isTrending !== undefined) poster.isTrending = isTrending === 'true' || isTrending === true;
    if (isPremium !== undefined) poster.isPremium = isPremium === 'true' || isPremium === true;
    if (isActive !== undefined) poster.isActive = isActive === 'true' || isActive === true;
    if (downloadsCount !== undefined) poster.downloadsCount = Number(downloadsCount);
    if (sharesCount !== undefined) poster.sharesCount = Number(sharesCount);
    if (viewsCount !== undefined) poster.viewsCount = Number(viewsCount);

    await poster.save();

    return sendSuccess(res, 200, 'Poster updated successfully', poster);
});

/**
 * @desc    Toggle poster active status
 * @route   PATCH /api/v1/admin/posters/:id/status
 * @access  Admin
 */
const updatePosterStatus = catchAsync(async (req, res, next) => {
    const { isActive } = req.body;

    if (isActive === undefined) {
        return next(new AppError('isActive field is required', 400, 'VALIDATION_ERROR'));
    }

    const poster = await Poster.findByIdAndUpdate(
        req.params.id,
        { isActive: isActive === true || isActive === 'true' },
        { returnDocument: 'after' }
    );

    if (!poster) {
        return next(new AppError('Poster not found', 404, 'POSTER_NOT_FOUND'));
    }

    return sendSuccess(res, 200, `Poster ${poster.isActive ? 'activated' : 'deactivated'} successfully`, poster);
});

/**
 * @desc    Delete poster and remove associated images
 * @route   DELETE /api/v1/admin/posters/:id
 * @access  Admin
 */
const deletePoster = catchAsync(async (req, res, next) => {
    const poster = await Poster.findById(req.params.id);

    if (!poster) {
        return next(new AppError('Poster not found', 404, 'POSTER_NOT_FOUND'));
    }

    // Clean up local media files
    await imageService.deleteLocalFile(poster.imageUrl);
    await imageService.deleteLocalFile(poster.thumbnailUrl);

    await Poster.findByIdAndDelete(req.params.id);

    return sendSuccess(res, 200, 'Poster deleted successfully');
});

/**
 * @desc    Get aggregate poster statistics
 * @route   GET /api/v1/admin/posters/stats
 * @access  Admin
 */
const getPosterStats = catchAsync(async (req, res) => {
    const [total, active, inactive, trending, premium, aggregations] = await Promise.all([
        Poster.countDocuments(),
        Poster.countDocuments({ isActive: true }),
        Poster.countDocuments({ isActive: false }),
        Poster.countDocuments({ isTrending: true }),
        Poster.countDocuments({ isPremium: true }),
        Poster.aggregate([
            {
                $group: {
                    _id: null,
                    totalDownloads: { $sum: '$downloadsCount' },
                    totalShares: { $sum: '$sharesCount' },
                    totalViews: { $sum: '$viewsCount' },
                },
            },
        ]),
    ]);

    const totalDownloads = aggregations.length > 0 ? aggregations[0].totalDownloads : 0;
    const totalShares = aggregations.length > 0 ? aggregations[0].totalShares : 0;
    const totalViews = aggregations.length > 0 ? aggregations[0].totalViews : 0;

    return sendSuccess(res, 200, 'Poster statistics retrieved successfully', {
        total,
        active,
        inactive,
        trending,
        premium,
        totalDownloads,
        totalShares,
        totalViews,
    });
});

module.exports = {
    getPosters,
    getPosterById,
    createPoster,
    updatePoster,
    updatePosterStatus,
    deletePoster,
    getPosterStats,
};
