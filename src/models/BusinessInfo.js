const mongoose = require('mongoose');

const businessInfoSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'User ID is required'],
            unique: true,
            index: true,
        },
        companyName: {
            type: String,
            default: '',
            trim: true,
            maxlength: [120, 'Company name cannot exceed 120 characters'],
        },
        businessAddress: {
            type: String,
            default: '',
            trim: true,
            maxlength: [250, 'Business address cannot exceed 250 characters'],
        },
        contactNumber: {
            type: String,
            default: '',
            trim: true,
        },
        businessMail: {
            type: String,
            default: '',
            trim: true,
            lowercase: true,
        },
        website: {
            type: String,
            default: '',
            trim: true,
        },
        tagline: {
            type: String,
            default: '',
            trim: true,
        },
        businessLogoUrls: [
            {
                type: String,
            },
        ],
        socialHandles: {
            instagram: { type: String, default: '' },
            facebook: { type: String, default: '' },
            twitter: { type: String, default: '' },
            youtube: { type: String, default: '' },
            linkedin: { type: String, default: '' },
            whatsapp: { type: String, default: '' },
        },
    },
    {
        timestamps: true,
        toJSON: {
            transform: (doc, ret) => {
                ret.id = ret._id;
                return ret;
            },
        },
    }
);

module.exports = mongoose.model('BusinessInfo', businessInfoSchema, 'business_profiles');
