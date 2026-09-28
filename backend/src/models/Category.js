const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Category name is required'],
            unique: true,  
            trim: true,
        },
        slug: {
            type: String,
            required: [true, 'Category slug is required'],
            unique: true,
            lowercase: true,
            trim: true,
            index: true,
        },
        iconUrl: {
            type: String,
            default: '',
        },
        sortOrder: {
            type: Number,
            default: 0,
            index: true,
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

module.exports = mongoose.model('Category', categorySchema, 'categories');
