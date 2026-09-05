const mongoose = require('mongoose');

const posterSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: [true, 'Poster title is required'],
            trim: true,
        },
        imageUrl: {
            type: String,
            required: [true, 'Poster image URL is required'],
        },
        thumbnailUrl: {
            type: String,
            default: '',
        },
        category: {
            type: String,
            required: [true, 'Category slug is required'],
            index: true,
        },
        categoryId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Category',
            default: null,
        },
        language: {
            type: String,
            default: 'English',
            index: true,
        },
        tags: [
            {
                type: String,
                lowercase: true,
                trim: true,
            },
        ],
        aspectRatio: {
            type: String,
            enum: ['1:1', '4:5', '9:16', '16:9'],
            default: '1:1',
        },
        isTrending: {
            type: Boolean,
            default: false,
            index: true,
        },
        isPremium: {
            type: Boolean,
            default: false,
        },
        downloadsCount: {
            type: Number,
            default: 0,
        },
        sharesCount: {
            type: Number,
            default: 0,
        },
        viewsCount: {
            type: Number,
            default: 0,
        },
        isActive: {
            type: Boolean,
            default: true,
            index: true,
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

// Compound index for high-speed filtered queries
posterSchema.index({ category: 1, language: 1, isActive: 1, createdAt: -1 });

module.exports = mongoose.model('Poster', posterSchema, 'posters');
