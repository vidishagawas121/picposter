const BusinessInfo = require('../models/BusinessInfo');
const imageService = require('../services/imageService');
const AppError = require('../utils/appError');
const { sendSuccess } = require('../utils/apiResponse');
const catchAsync = require('../utils/catchAsync');

/**
 * @desc    Get business profile for authenticated user
 * @route   GET /api/v1/business
 * @access  Private
 */
const getBusinessInfo = catchAsync(async (req, res) => {
    let business = await BusinessInfo.findOne({ userId: req.user._id });

    if (!business) {
        business = await BusinessInfo.create({
            userId: req.user._id,
        });
    }

    return sendSuccess(res, 200, 'Business details fetched successfully', business);
});

/**
 * @desc    Update business profile
 * @route   PUT /api/v1/business
 * @access  Private
 */
const updateBusinessInfo = catchAsync(async (req, res) => {
    const {
        companyName,
        businessAddress,
        contactNumber,
        businessMail,
        website,
        tagline,
        socialHandles,
    } = req.body;

    const updateData = {};
    if (companyName !== undefined) updateData.companyName = companyName;
    if (businessAddress !== undefined) updateData.businessAddress = businessAddress;
    if (contactNumber !== undefined) updateData.contactNumber = contactNumber;
    if (businessMail !== undefined) updateData.businessMail = businessMail;
    if (website !== undefined) updateData.website = website;
    if (tagline !== undefined) updateData.tagline = tagline;
    if (socialHandles !== undefined) {
        updateData.socialHandles = {
            instagram: socialHandles.instagram || '',
            facebook: socialHandles.facebook || '',
            twitter: socialHandles.twitter || '',
            youtube: socialHandles.youtube || '',
            linkedin: socialHandles.linkedin || '',
            whatsapp: socialHandles.whatsapp || '',
        };
    }

    let business = await BusinessInfo.findOneAndUpdate(
        { userId: req.user._id },
        updateData,
        { returnDocument: 'after', upsert: true, runValidators: true }
    );

    return sendSuccess(res, 200, 'Business profile updated successfully', business);
});

/**
 * @desc    Upload business logo (WebP 85%, preserved transparency)
 * @route   POST /api/v1/business/logo
 * @access  Private
 */
const uploadLogo = catchAsync(async (req, res, next) => {
    if (!req.file) {
        return next(new AppError('Please provide a logo image file', 400, 'NO_FILE_PROVIDED'));
    }

    const logoUrl = await imageService.processBusinessLogo(req.file.buffer, req);

    let business = await BusinessInfo.findOne({ userId: req.user._id });
    if (!business) {
        business = await BusinessInfo.create({
            userId: req.user._id,
            businessLogoUrls: [logoUrl],
        });
    } else {
        business.businessLogoUrls.push(logoUrl);
        await business.save();
    }

    return sendSuccess(res, 200, 'Business logo uploaded successfully', {
        logoUrl,
        businessLogoUrls: business.businessLogoUrls,
    });
});

/**
 * @desc    Delete business logo
 * @route   DELETE /api/v1/business/logo/:logoId (or by query / index / URL)
 * @access  Private
 */
const deleteLogo = catchAsync(async (req, res, next) => {
    const logoIdentifier = req.params.logoId || req.body.logoUrl || req.query.logoUrl;

    if (!logoIdentifier) {
        return next(new AppError('Logo URL or identifier is required', 400, 'MISSING_LOGO_ID'));
    }

    let business = await BusinessInfo.findOne({ userId: req.user._id });
    if (!business) {
        return next(new AppError('Business profile not found', 404, 'BUSINESS_NOT_FOUND'));
    }

    // Filter out by exact URL match or substring (filename match)
    business.businessLogoUrls = business.businessLogoUrls.filter((url, index) => {
        return url !== logoIdentifier && !url.includes(logoIdentifier) && index.toString() !== logoIdentifier;
    });

    await business.save();

    return sendSuccess(res, 200, 'Business logo deleted successfully', {
        businessLogoUrls: business.businessLogoUrls,
    });
});

module.exports = {
    getBusinessInfo,
    updateBusinessInfo,
    uploadLogo,
    deleteLogo,
};
