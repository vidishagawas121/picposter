const mongoose = require('mongoose');

const refreshTokenSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'User ID is required'],
            index: true,
        },
        tokenHash: {
            type: String,
            required: [true, 'Token hash is required'],
            unique: true,
            index: true,
        },
        deviceId: {
            type: String,
            default: '',
        },
        platform: {
            type: String,
            enum: ['android', 'ios', 'web', 'other'],
            default: 'android',
        },
        expiresAt: {
            type: Date,
            required: true,
            index: { expires: 0 }, // 30-day TTL expiry
        },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model('RefreshToken', refreshTokenSchema, 'refresh_tokens');
