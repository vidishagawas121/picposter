const User = require('../models/User');
const UserCreation = require('../models/UserCreation');
const Poster = require('../models/Poster');
const imageService = require('../services/imageService');
const AppError = require('../utils/appError');
const { sendSuccess } = require('../utils/apiResponse');
const catchAsync = require('../utils/catchAsync');

/**
 * @desc    Get current user profile
 * @route   GET /api/v1/user/profile
 * @access  Private
 */
const getProfile = catchAsync(async (req, res) => {
    const user = await User.findById(req.user._id);

    return sendSuccess(res, 200, 'User profile fetched successfully', {
        id: user._id,
        _id: user._id,
        mobile: user.mobile,
        name: user.name,
        email: user.email,
        profilePhoto: user.profilePhoto,
        preferredLanguage: user.preferredLanguage,
        isVerified: user.isVerified,
        role: user.role,
        savedTemplates: user.savedTemplates,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
    });
});

/**
 * @desc    Update user profile details (Self-service profile edit)
 * @route   PUT /api/v1/user/profile
 * @access  Private (Normal authenticated user via JWT)
 */
const updateProfile = catchAsync(async (req, res, next) => {
    const { name, email, preferredLanguage, profilePhoto } = req.body;
    const updateData = {};

    // Validate and sanitize allowed fields
    if (name !== undefined) {
        if (typeof name !== 'string' || name.trim().length === 0) {
            return next(new AppError('Name cannot be empty', 400, 'VALIDATION_ERROR'));
        }
        if (name.trim().length > 100) {
            return next(new AppError('Name cannot exceed 100 characters', 400, 'VALIDATION_ERROR'));
        }
        updateData.name = name.trim();
    }

    if (email !== undefined) {
        updateData.email = typeof email === 'string' ? email.trim().toLowerCase() : '';
    }

    if (preferredLanguage !== undefined) {
        const allowedLanguages = ['English', 'Hindi', 'Marathi', 'Gujarati', 'Punjabi', 'Tamil', 'Telugu', 'Bengali'];
        if (!allowedLanguages.includes(preferredLanguage)) {
            return next(
                new AppError(
                    `Invalid preferredLanguage. Allowed values: ${allowedLanguages.join(', ')}`,
                    400,
                    'VALIDATION_ERROR'
                )
            );
        }
        updateData.preferredLanguage = preferredLanguage;
    }

    if (profilePhoto !== undefined && typeof profilePhoto === 'string') {
        updateData.profilePhoto = profilePhoto.trim();
    }

    // Security: STRICTLY update only req.user._id (derived from validated JWT).
    // Disallows client tampering with userId or protected fields (role, isActive, isVerified, mobile).
    const user = await User.findByIdAndUpdate(req.user._id, updateData, {
        returnDocument: 'after',
        runValidators: true,
    });

    if (!user) {
        return next(new AppError('User not found', 404, 'USER_NOT_FOUND'));
    }

    return sendSuccess(res, 200, 'User profile updated successfully', {
        id: user._id,
        _id: user._id,
        mobile: user.mobile,
        name: user.name,
        email: user.email,
        profilePhoto: user.profilePhoto,
        preferredLanguage: user.preferredLanguage,
        isVerified: user.isVerified,
        role: user.role,
        updatedAt: user.updatedAt,
    });
});

/**
 * @desc    Upload / update user avatar photo
 * @route   POST /api/v1/user/photo
 * @access  Private
 */
const uploadPhoto = catchAsync(async (req, res, next) => {
    if (!req.file) {
        return next(new AppError('Please upload an image file', 400, 'NO_FILE_PROVIDED'));
    }

    const photoUrl = await imageService.processProfilePhoto(req.file.buffer, req);

    const user = await User.findByIdAndUpdate(
        req.user._id,
        { profilePhoto: photoUrl },
        { returnDocument: 'after' }
    );

    return sendSuccess(res, 200, 'Profile photo updated successfully', {
        photoUrl,
        user: {
            id: user._id,
            _id: user._id,
            profilePhoto: user.profilePhoto,
        },
    });
});

/**
 * @desc    Get user customized / saved creations
 * @route   GET /api/v1/user/creations
 * @access  Private
 */
const getCreations = catchAsync(async (req, res) => {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const skip = (page - 1) * limit;

    const [creations, totalCount] = await Promise.all([
        UserCreation.find({ userId: req.user._id })
            .populate('posterId')
            .sort({ savedAt: -1 })
            .skip(skip)
            .limit(limit),
        UserCreation.countDocuments({ userId: req.user._id }),
    ]);

    const totalPages = Math.ceil(totalCount / limit) || 1;

    return sendSuccess(
        res,
        200,
        'User creations fetched successfully',
        creations,
        { page, totalPages, totalCount }
    );
});

/**
 * @desc    Save customized banner / creation
 * @route   POST /api/v1/user/creations
 * @access  Private
 */
const createCreation = catchAsync(async (req, res, next) => {
    let customizedImageUrl = req.body.customizedImageUrl;

    // If an image file is uploaded
    if (req.file) {
        customizedImageUrl = await imageService.processUserCreation(req.file.buffer, req);
    }

    if (!customizedImageUrl) {
        return next(new AppError('Customized image URL or image file is required', 400, 'NO_IMAGE_PROVIDED'));
    }

    const { posterId, customText } = req.body;

    const creation = await UserCreation.create({
        userId: req.user._id,
        posterId: posterId || null,
        customizedImageUrl,
        customText: customText || '',
        savedAt: new Date(),
    });

    return sendSuccess(res, 201, 'Creation saved successfully', creation);
});

/**
 * @desc    Get user bookmarked / saved templates
 * @route   GET /api/v1/user/saved-templates
 * @access  Private
 */
const getSavedTemplates = catchAsync(async (req, res) => {
    const user = await User.findById(req.user._id).populate({
        path: 'savedTemplates',
        match: { isActive: true },
    });

    return sendSuccess(res, 200, 'Saved templates fetched successfully', user.savedTemplates || []);
});

/**
 * @desc    Save / bookmark a template
 * @route   POST /api/v1/user/saved-templates/:id
 * @access  Private
 */
const saveTemplate = catchAsync(async (req, res, next) => {
    const posterId = req.params.id;

    const poster = await Poster.findById(posterId);
    if (!poster) {
        return next(new AppError('Poster template not found', 404, 'POSTER_NOT_FOUND'));
    }

    const user = await User.findById(req.user._id);

    if (!user.savedTemplates.includes(posterId)) {
        user.savedTemplates.push(posterId);
        await user.save();
    }

    return sendSuccess(res, 200, 'Template saved to bookmarks', {
        savedTemplates: user.savedTemplates,
    });
});

/**
 * @desc    Unsave / remove bookmark template
 * @route   DELETE /api/v1/user/saved-templates/:id
 * @access  Private
 */
const unsaveTemplate = catchAsync(async (req, res) => {
    const posterId = req.params.id;

    const user = await User.findByIdAndUpdate(
        req.user._id,
        { $pull: { savedTemplates: posterId } },
        { new: true }
    );

    return sendSuccess(res, 200, 'Template removed from bookmarks', {
        savedTemplates: user.savedTemplates,
    });
});

module.exports = {
    getProfile,
    updateProfile,
    uploadPhoto,
    getCreations,
    createCreation,
    getSavedTemplates,
    saveTemplate,
    unsaveTemplate,
};
