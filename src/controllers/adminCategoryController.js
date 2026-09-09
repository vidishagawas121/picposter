const Category = require('../models/Category');
const Poster = require('../models/Poster');
const imageService = require('../services/imageService');
const AppError = require('../utils/appError');
const { sendSuccess } = require('../utils/apiResponse');
const catchAsync = require('../utils/catchAsync');
const { escapeRegex } = require('../utils/sanitizer');

/**
 * @desc    Get all categories for admin with poster count
 * @route   GET /api/v1/admin/categories
 * @access  Admin
 */
const getCategories = catchAsync(async (req, res) => {
    const categories = await Category.find().sort({ sortOrder: 1, name: 1 });

    // Aggregate poster counts per category
    const posterCounts = await Poster.aggregate([
        {
            $group: {
                _id: '$category',
                count: { $sum: 1 },
                activeCount: {
                    $sum: { $cond: [{ $eq: ['$isActive', true] }, 1, 0] },
                },
            },
        },
    ]);

    const countMap = new Map();
    posterCounts.forEach((pc) => {
        if (pc._id) {
            countMap.set(pc._id.toLowerCase(), pc);
        }
    });

    const formattedCategories = categories.map((cat) => {
        const stats = countMap.get(cat.slug.toLowerCase()) || { count: 0, activeCount: 0 };
        return {
            id: cat._id,
            _id: cat._id,
            name: cat.name,
            slug: cat.slug,
            iconUrl: cat.iconUrl,
            sortOrder: cat.sortOrder,
            isActive: cat.isActive,
            posterCount: stats.count,
            activePosterCount: stats.activeCount,
            createdAt: cat.createdAt,
            updatedAt: cat.updatedAt,
        };
    });

    return sendSuccess(res, 200, 'Categories retrieved successfully', formattedCategories);
});

/**
 * @desc    Get single category details
 * @route   GET /api/v1/admin/categories/:id
 * @access  Admin
 */
const getCategoryById = catchAsync(async (req, res, next) => {
    const category = await Category.findById(req.params.id);

    if (!category) {
        return next(new AppError('Category not found', 404, 'CATEGORY_NOT_FOUND'));
    }

    const posterCount = await Poster.countDocuments({
        $or: [{ category: category.slug }, { categoryId: category._id }],
    });

    return sendSuccess(res, 200, 'Category details retrieved successfully', {
        ...category.toJSON(),
        posterCount,
    });
});

/**
 * @desc    Create new category
 * @route   POST /api/v1/admin/categories
 * @access  Admin
 */
const createCategory = catchAsync(async (req, res, next) => {
    const { name, slug, sortOrder, isActive } = req.body;
    let iconUrl = req.body.iconUrl || '';

    if (!name || name.trim().length < 2 || name.trim().length > 50) {
        return next(new AppError('Category name is required and must be between 2 and 50 characters', 400, 'VALIDATION_ERROR'));
    }

    // Generate clean slug
    const generatedSlug = (slug || name)
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '');

    // Check duplicate name or slug
    const escapedName = escapeRegex(name.trim());
    const existing = await Category.findOne({
        $or: [
            { name: new RegExp(`^${escapedName}$`, 'i') },
            { slug: generatedSlug },
        ],
    });

    if (existing) {
        return next(new AppError('A category with this name or slug already exists', 400, 'DUPLICATE_CATEGORY'));
    }

    // Process icon image if uploaded
    if (req.file) {
        iconUrl = await imageService.processCategoryIcon(req.file.buffer, req);
    }

    const category = await Category.create({
        name: name.trim(),
        slug: generatedSlug,
        iconUrl,
        sortOrder: sortOrder !== undefined ? Number(sortOrder) : 0,
        isActive: isActive !== undefined ? (isActive === 'true' || isActive === true) : true,
    });

    return sendSuccess(res, 201, 'Category created successfully', {
        ...category.toJSON(),
        posterCount: 0,
    });
});

/**
 * @desc    Update category metadata/icon
 * @route   PUT /api/v1/admin/categories/:id
 * @access  Admin
 */
const updateCategory = catchAsync(async (req, res, next) => {
    const category = await Category.findById(req.params.id);

    if (!category) {
        return next(new AppError('Category not found', 404, 'CATEGORY_NOT_FOUND'));
    }

    const { name, slug, sortOrder, isActive } = req.body;

    if (name !== undefined) {
        if (typeof name !== 'string' || name.trim().length < 2 || name.trim().length > 50) {
            return next(new AppError('Category name must be between 2 and 50 characters', 400, 'VALIDATION_ERROR'));
        }

        const escapedUpdateName = escapeRegex(name.trim());
        const duplicateName = await Category.findOne({
            _id: { $ne: category._id },
            name: new RegExp(`^${escapedUpdateName}$`, 'i'),
        });
        if (duplicateName) {
            return next(new AppError('A category with this name already exists', 400, 'DUPLICATE_CATEGORY_NAME'));
        }
        category.name = name.trim();
    }

    if (slug !== undefined) {
        const formattedSlug = slug.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
        const duplicateSlug = await Category.findOne({
            _id: { $ne: category._id },
            slug: formattedSlug,
        });
        if (duplicateSlug) {
            return next(new AppError('A category with this slug already exists', 400, 'DUPLICATE_CATEGORY_SLUG'));
        }
        category.slug = formattedSlug;
    }

    if (req.file) {
        await imageService.deleteLocalFile(category.iconUrl);
        category.iconUrl = await imageService.processCategoryIcon(req.file.buffer, req);
    } else if (req.body.iconUrl !== undefined) {
        category.iconUrl = req.body.iconUrl;
    }

    if (sortOrder !== undefined) category.sortOrder = Number(sortOrder);
    if (isActive !== undefined) category.isActive = isActive === 'true' || isActive === true;

    await category.save();

    const posterCount = await Poster.countDocuments({
        $or: [{ category: category.slug }, { categoryId: category._id }],
    });

    return sendSuccess(res, 200, 'Category updated successfully', {
        ...category.toJSON(),
        posterCount,
    });
});

/**
 * @desc    Toggle category active status
 * @route   PATCH /api/v1/admin/categories/:id/status
 * @access  Admin
 */
const updateCategoryStatus = catchAsync(async (req, res, next) => {
    const { isActive } = req.body;

    if (isActive === undefined) {
        return next(new AppError('isActive field is required', 400, 'VALIDATION_ERROR'));
    }

    const category = await Category.findByIdAndUpdate(
        req.params.id,
        { isActive: isActive === true || isActive === 'true' },
        { returnDocument: 'after' }
    );

    if (!category) {
        return next(new AppError('Category not found', 404, 'CATEGORY_NOT_FOUND'));
    }

    return sendSuccess(res, 200, `Category ${category.isActive ? 'activated' : 'deactivated'} successfully`, category);
});

/**
 * @desc    Reorder categories in batch (for Drag and Drop)
 * @route   PATCH /api/v1/admin/categories/reorder
 * @access  Admin
 */
const reorderCategories = catchAsync(async (req, res, next) => {
    const { items } = req.body; // Array of { id: string, sortOrder: number } or array of ids [id1, id2, ...]

    if (!Array.isArray(items) || items.length === 0) {
        return next(new AppError('Items array is required for reordering', 400, 'VALIDATION_ERROR'));
    }

    const updatePromises = items.map((item, index) => {
        if (typeof item === 'string') {
            return Category.findByIdAndUpdate(item, { sortOrder: index + 1 });
        } else if (item && (item.id || item._id)) {
            const id = item.id || item._id;
            const sortOrder = item.sortOrder !== undefined ? Number(item.sortOrder) : index + 1;
            return Category.findByIdAndUpdate(id, { sortOrder });
        }
        return Promise.resolve();
    });

    await Promise.all(updatePromises);

    const categories = await Category.find().sort({ sortOrder: 1, name: 1 });

    return sendSuccess(res, 200, 'Categories reordered successfully', categories);
});

/**
 * @desc    Delete category (only if no posters are linked)
 * @route   DELETE /api/v1/admin/categories/:id
 * @access  Admin
 */
const deleteCategory = catchAsync(async (req, res, next) => {
    const category = await Category.findById(req.params.id);

    if (!category) {
        return next(new AppError('Category not found', 404, 'CATEGORY_NOT_FOUND'));
    }

    // Check linked posters
    const linkedPostersCount = await Poster.countDocuments({
        $or: [{ category: category.slug }, { categoryId: category._id }],
    });

    if (linkedPostersCount > 0) {
        return next(
            new AppError(
                `Cannot delete category "${category.name}". It currently has ${linkedPostersCount} poster(s) linked to it. Please reassign or delete the posters first.`,
                400,
                'CATEGORY_HAS_POSTERS'
            )
        );
    }

    await imageService.deleteLocalFile(category.iconUrl);
    await Category.findByIdAndDelete(req.params.id);

    return sendSuccess(res, 200, 'Category deleted successfully');
});

module.exports = {
    getCategories,
    getCategoryById,
    createCategory,
    updateCategory,
    updateCategoryStatus,
    reorderCategories,
    deleteCategory,
};
