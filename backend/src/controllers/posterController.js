const Category = require('../models/Category');
const Poster = require('../models/Poster');
const imageService = require('../services/imageService');
const AppError = require('../utils/appError');
const { sendSuccess } = require('../utils/apiResponse');
const catchAsync = require('../utils/catchAsync');
const { escapeRegex } = require('../utils/sanitizer');

/**
 * @desc    List active categories sorted by sortOrder
 * @route   GET /api/v1/posters/categories
 * @access  Public
 */
const getCategories = catchAsync(async (req, res) => {
    const categories = await Category.find({ isActive: true }).sort({ sortOrder: 1, name: 1 });

    const formattedData = categories.map((cat) => ({
        id: cat._id,
        _id: cat._id,
        name: cat.name,
        slug: cat.slug,
        iconUrl: cat.iconUrl,
        sortOrder: cat.sortOrder,
    }));

    return sendSuccess(res, 200, 'Categories retrieved successfully', formattedData);
});

/**
 * @desc    Create a category
 * @route   POST /api/v1/posters/categories
 * @access  Public / Admin
 */
const createCategory = catchAsync(async (req, res, next) => {
    const { name, slug, iconUrl, sortOrder, isActive } = req.body;

    if (!name || typeof name !== 'string') {
        return next(new AppError('Category name is required', 400, 'VALIDATION_ERROR'));
    }

    const generatedSlug = (slug || name)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '');

    const category = await Category.create({
        name: name.trim(),
        slug: generatedSlug,
        iconUrl: iconUrl || '',
        sortOrder: sortOrder !== undefined ? Number(sortOrder) : 0,
        isActive: isActive !== undefined ? isActive : true,
    });

    return sendSuccess(res, 201, 'Category created successfully', category);
});

/**
 * @desc    Get filtered posters with pagination
 * @route   GET /api/v1/posters?category=business&language=English&page=1&limit=20&search=sale
 * @access  Public
 */
const getPosters = catchAsync(async (req, res) => {
    const { category, language, search, aspectRatio, isTrending, isPremium } = req.query;

    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit, 10) || 20));
    const skip = (page - 1) * limit;

    const filter = { isActive: true };

    if (category && typeof category === 'string' && category.toLowerCase() !== 'all') {
        filter.category = new RegExp(`^${escapeRegex(category.trim())}$`, 'i');
    }

    if (language && typeof language === 'string') {
        filter.language = new RegExp(`^${escapeRegex(language.trim())}$`, 'i');
    }

    if (aspectRatio && typeof aspectRatio === 'string') {
        filter.aspectRatio = aspectRatio;
    }

    if (isTrending !== undefined) {
        filter.isTrending = isTrending === 'true' || isTrending === true;
    }

    if (isPremium !== undefined) {
        filter.isPremium = isPremium === 'true' || isPremium === true;
    }

    if (search && typeof search === 'string' && search.trim()) {
        const searchRegex = new RegExp(escapeRegex(search.trim()), 'i');
        filter.$or = [
            { title: searchRegex },
            { tags: searchRegex },
            { category: searchRegex },
        ];
    }

    const [posters, totalCount] = await Promise.all([
        Poster.find(filter)
            .sort({ isTrending: -1, createdAt: -1 })
            .skip(skip)
            .limit(limit),
        Poster.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(totalCount / limit) || 1;

    const formattedData = posters.map((p) => ({
        id: p._id,
        _id: p._id,
        title: p.title,
        imageUrl: p.imageUrl,
        thumbnailUrl: p.thumbnailUrl || p.imageUrl,
        aspectRatio: p.aspectRatio,
        category: p.category,
        language: p.language,
        tags: p.tags,
        isTrending: p.isTrending,
        isPremium: p.isPremium,
        downloadsCount: p.downloadsCount,
        sharesCount: p.sharesCount,
        viewsCount: p.viewsCount,
        createdAt: p.createdAt,
    }));

    return sendSuccess(
        res,
        200,
        'Posters retrieved successfully',
        formattedData,
        { page, totalPages, totalCount }
    );
});

/**
 * @desc    Get single poster by ID
 * @route   GET /api/v1/posters/:id
 * @access  Public
 */
const getPosterById = catchAsync(async (req, res, next) => {
    const poster = await Poster.findById(req.params.id);

    if (!poster || !poster.isActive) {
        return next(new AppError('Poster not found', 404, 'POSTER_NOT_FOUND'));
    }

    // Auto-increment view count
    poster.viewsCount += 1;
    await poster.save();

    return sendSuccess(res, 200, 'Poster details retrieved successfully', poster);
});

/**
 * @desc    Upload / create new poster template
 * @route   POST /api/v1/posters
 * @access  Public / Admin
 */
const createPoster = catchAsync(async (req, res, next) => {
    const { title, category, language, tags, aspectRatio, isTrending, isPremium } = req.body;
    let imageUrl = req.body.imageUrl;
    let thumbnailUrl = req.body.thumbnailUrl;

    if (!title || (!imageUrl && !req.file) || !category) {
        return next(new AppError('Title, category, and image are required', 400, 'VALIDATION_ERROR'));
    }

    if (req.file) {
        const processed = await imageService.processPosterImage(req.file.buffer, req);
        imageUrl = processed.imageUrl;
        thumbnailUrl = processed.thumbnailUrl;
    }

    const parsedTags = Array.isArray(tags)
        ? tags
        : typeof tags === 'string'
        ? tags.split(',').map((t) => t.trim().toLowerCase()).filter(Boolean)
        : [];

    const poster = await Poster.create({
        title: title.trim(),
        imageUrl,
        thumbnailUrl: thumbnailUrl || imageUrl,
        category: category.toLowerCase().trim(),
        language: language || 'English',
        tags: parsedTags,
        aspectRatio: aspectRatio || '1:1',
        isTrending: isTrending === 'true' || isTrending === true,
        isPremium: isPremium === 'true' || isPremium === true,
    });

    return sendSuccess(res, 201, 'Poster created successfully', poster);
});

/**
 * @desc    Increment download / share / view counter
 * @route   POST /api/v1/posters/:id/action
 * @access  Public
 */
const recordAction = catchAsync(async (req, res, next) => {
    const { id } = req.params;
    const { action } = req.body;

    const poster = await Poster.findById(id);
    if (!poster) {
        return next(new AppError('Poster not found', 404, 'POSTER_NOT_FOUND'));
    }

    const normalizedAction = (action || '').toLowerCase().trim();

    if (normalizedAction === 'download') {
        poster.downloadsCount += 1;
    } else if (normalizedAction === 'share') {
        poster.sharesCount += 1;
    } else if (normalizedAction === 'view') {
        poster.viewsCount += 1;
    } else {
        return next(new AppError('Invalid action. Must be download, share, or view.', 400, 'INVALID_ACTION'));
    }

    await poster.save();

    return sendSuccess(res, 200, `${normalizedAction} recorded successfully`, {
        id: poster._id,
        downloadsCount: poster.downloadsCount,
        sharesCount: poster.sharesCount,
        viewsCount: poster.viewsCount,
    });
});

module.exports = {
    getCategories,
    createCategory,
    getPosters,
    getPosterById,
    createPoster,
    recordAction,
};
