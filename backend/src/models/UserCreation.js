const mongoose = require('mongoose');

const userCreationSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'User ID is required'],
            index: true,
        },
        posterId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Poster',
            default: null,
        },
        customizedImageUrl: {
            type: String,
            required: [true, 'Customized image URL is required'],
        },
        customText: {
            type: String,
            default: '',
        },
        savedAt: {
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

module.exports = mongoose.model('UserCreation', userCreationSchema, 'user_creations');
