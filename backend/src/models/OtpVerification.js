const mongoose = require('mongoose');

const otpVerificationSchema = new mongoose.Schema(
    {
        mobile: {
            type: String,
            required: [true, 'Mobile number is required for OTP verification'],
            index: true,
            trim: true,
        },
        otpHash: {
            type: String,
            required: [true, 'OTP hash is required'],
        },
        attempts: {
            type: Number,
            default: 0,
            max: 5,
        },
        isUsed: {
            type: Boolean,
            default: false,
        },
        expiresAt: {
            type: Date,
            required: true,
            index: { expires: 0 }, // Auto-delete document when expiresAt timestamp arrives
        },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model('OtpVerification', otpVerificationSchema, 'otps');
