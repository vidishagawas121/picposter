const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
    {
        mobile: {
            type: String,
            required: [true, 'Mobile number is required'],
            unique: true,
            index: true,
            trim: true,
            match: [/^\+[1-9]\d{1,14}$/, 'Please provide a valid E.164 phone number (e.g. +919876543210)'],
        },
        username: {
            type: String,
            unique: true,
            sparse: true,
            trim: true,
            lowercase: true,
        },
        password: {
            type: String,
            select: false,
        },
        name: {
            type: String,
            default: 'User',
            trim: true,
            maxlength: [100, 'Name cannot exceed 100 characters'],
        },
        email: {
            type: String,
            default: '',
            trim: true,
            lowercase: true,
        },
        profilePhoto: {
            type: String,
            default: '',
        },
        preferredLanguage: {
            type: String,
            enum: ['English', 'Hindi', 'Marathi', 'Gujarati', 'Punjabi', 'Tamil', 'Telugu', 'Bengali'],
            default: 'English',
        },
        isVerified: {
            type: Boolean,
            default: false,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
        role: {
            type: String,
            enum: ['user', 'admin'],
            default: 'user',
        },
        savedTemplates: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Poster',
            },
        ],
        lastLoginAt: {
            type: Date,
            default: Date.now,
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

module.exports = mongoose.model('User', userSchema, 'users');
