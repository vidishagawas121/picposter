const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const OtpVerification = require('../models/OtpVerification');
const RefreshToken = require('../models/RefreshToken');
const BusinessInfo = require('../models/BusinessInfo');
const smsService = require('./smsService');
const AppError = require('../utils/appError');

class AuthService {
    /**
     * Generate & send 6-digit cryptographic OTP
     */
    async sendOtp(mobile) {
        if (!mobile || typeof mobile !== 'string' || !/^\+[1-9]\d{1,14}$/.test(mobile.trim())) {
            throw new AppError(
                'Please provide a valid E.164 mobile number (e.g. +919876543210)',
                400,
                'INVALID_MOBILE_NUMBER'
            );
        }

        const normalizedMobile = mobile.trim();

        // 60-second cooldown check
        const existingOtp = await OtpVerification.findOne({
            mobile: normalizedMobile,
            isUsed: false,
            createdAt: { $gte: new Date(Date.now() - 60 * 1000) },
        });

        if (existingOtp) {
            const secondsPassed = Math.floor((Date.now() - existingOtp.createdAt.getTime()) / 1000);
            const waitSeconds = Math.max(1, 60 - secondsPassed);
            throw new AppError(
                `Please wait ${waitSeconds} seconds before requesting a new OTP.`,
                429,
                'OTP_COOLDOWN_ACTIVE'
            );
        }

        // Generate cryptographically secure 6-digit numeric OTP
        const otp = crypto.randomInt(100000, 999999).toString();

        // Hash OTP with bcrypt
        const salt = await bcrypt.genSalt(10);
        const otpHash = await bcrypt.hash(otp, salt);

        // Delete any existing OTP records for this mobile number
        await OtpVerification.deleteMany({ mobile: normalizedMobile });

        // Store OTP with 5 minutes TTL
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
        await OtpVerification.create({
            mobile: normalizedMobile,
            otpHash,
            expiresAt,
        });

        // Send OTP via SMS
        const smsMessage = `Your PicPoster login verification code is ${otp}. Valid for 5 minutes.`;
        await smsService.sendSms(normalizedMobile, smsMessage, { otp });

        const result = {
            success: true,
            cooldownSeconds: 60,
        };

        // Log OTP to console in development for testing (never sent in response)
        if (process.env.NODE_ENV !== 'production') {
            console.log(`\n🔑 [DEV OTP] ${normalizedMobile}: ${otp}\n`);
        }

        return result;
    }

    /**
     * Verify OTP, register user if new, and issue JWT tokens
     */
    async verifyOtp(mobile, submittedOtp, deviceId = '', platform = 'android') {
        if (
            !mobile ||
            typeof mobile !== 'string' ||
            !submittedOtp ||
            (typeof submittedOtp !== 'string' && typeof submittedOtp !== 'number')
        ) {
            throw new AppError('Valid mobile number and OTP are required', 400, 'MISSING_FIELDS');
        }

        const normalizedMobile = mobile.trim();

        const record = await OtpVerification.findOne({
            mobile: normalizedMobile,
            isUsed: false,
            expiresAt: { $gt: new Date() },
        });

        if (!record) {
            throw new AppError(
                'OTP expired or not found. Please request a new one.',
                400,
                'INVALID_OTP'
            );
        }

        if (record.attempts >= 5) {
            await OtpVerification.deleteOne({ _id: record._id });
            throw new AppError(
                'Maximum verification attempts exceeded. Please request a new OTP.',
                400,
                'MAX_ATTEMPTS_EXCEEDED'
            );
        }

        const isValid = await bcrypt.compare(submittedOtp.toString().trim(), record.otpHash);
        if (!isValid) {
            record.attempts += 1;
            await record.save();
            const remaining = 5 - record.attempts;
            throw new AppError(
                `Invalid OTP code. ${remaining} attempt(s) remaining.`,
                400,
                'INVALID_OTP'
            );
        }

        // Mark OTP as used
        record.isUsed = true;
        await record.save();

        // Check if user exists or register
        const adminMobiles = (process.env.ADMIN_MOBILES || '+919876543210')
            .split(',')
            .map((m) => m.trim());
        const isAdmin = adminMobiles.includes(normalizedMobile);

        let user = await User.findOne({ mobile: normalizedMobile });
        let isNewUser = false;

        if (!user) {
            isNewUser = true;
            user = await User.create({
                mobile: normalizedMobile,
                isVerified: true,
                role: isAdmin ? 'admin' : 'user',
                name: isAdmin ? 'Admin' : 'User',
                lastLoginAt: new Date(),
            });

            // Create initial business profile for the user
            await BusinessInfo.create({
                userId: user._id,
            });
        } else {
            user.isVerified = true;
            if (isAdmin && user.role !== 'admin') {
                user.role = 'admin';
            }
            user.lastLoginAt = new Date();
            await user.save();

            // Ensure business profile exists
            const existingBusiness = await BusinessInfo.findOne({ userId: user._id });
            if (!existingBusiness) {
                await BusinessInfo.create({ userId: user._id });
            }
        }

        // Generate Access and Refresh Tokens
        const tokens = await this.generateTokens(user._id, deviceId, platform);

        return {
            user,
            tokens,
            isNewUser,
        };
    }

    /**
     * Issue Access Token (15m) and Refresh Token (30d)
     */
    async generateTokens(userId, deviceId = '', platform = 'android') {
        const accessSecret = process.env.JWT_ACCESS_SECRET;
        if (!accessSecret) {
            throw new AppError('Server configuration error.', 500, 'CONFIG_ERROR');
        }
        const accessExpiry = process.env.JWT_ACCESS_EXPIRY || '15m';

        const accessToken = jwt.sign({ userId }, accessSecret, {
            expiresIn: accessExpiry,
        });

        // Cryptographically secure refresh token
        const rawRefreshToken = crypto.randomBytes(40).toString('hex');
        const tokenHash = crypto.createHash('sha256').update(rawRefreshToken).digest('hex');

        const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

        await RefreshToken.create({
            userId,
            tokenHash,
            deviceId: deviceId || '',
            platform: platform || 'android',
            expiresAt,
        });

        return {
            accessToken,
            refreshToken: rawRefreshToken,
            expiresIn: 900, // 15 minutes in seconds
        };
    }

    /**
     * Refresh access token with Single-Use Refresh Token Rotation
     */
    async refreshTokens(rawRefreshToken, deviceId = '') {
        if (!rawRefreshToken) {
            throw new AppError('Refresh token is required', 400, 'MISSING_REFRESH_TOKEN');
        }

        const tokenHash = crypto.createHash('sha256').update(rawRefreshToken).digest('hex');

        const storedToken = await RefreshToken.findOne({
            tokenHash,
            expiresAt: { $gt: new Date() },
        });

        if (!storedToken) {
            throw new AppError(
                'Invalid or expired refresh token. Please log in again.',
                401,
                'INVALID_REFRESH_TOKEN'
            );
        }

        const user = await User.findById(storedToken.userId);
        if (!user || !user.isActive) {
            await RefreshToken.deleteMany({ userId: storedToken.userId });
            throw new AppError('User not found or account deactivated.', 401, 'USER_INACTIVE');
        }

        // Single-use token rotation: remove old token
        await RefreshToken.deleteOne({ _id: storedToken._id });

        // Issue new access token + new rotated refresh token
        const newTokens = await this.generateTokens(
            user._id,
            deviceId || storedToken.deviceId,
            storedToken.platform
        );

        return newTokens;
    }

    /**
     * Admin login with Username/Email/Mobile and Password
     * @param {string} username - Admin username (e.g. 'admin'), email, or mobile
     * @param {string} password - Admin password (e.g. 'admin@123')
     * @param {string} deviceId
     * @param {string} platform
     */
    async adminPasswordLogin(username, password, deviceId = 'web_dashboard', platform = 'web') {
        if (!username || typeof username !== 'string' || !password || typeof password !== 'string') {
            throw new AppError('Username and password are required', 400, 'MISSING_FIELDS');
        }

        const cleanUsername = username.trim();
        const cleanPassword = password.trim();

        // Check if admin user exists by username, email, or mobile (include password field)
        let adminUser = await User.findOne({
            $or: [
                { username: cleanUsername.toLowerCase() },
                { email: cleanUsername.toLowerCase() },
                { mobile: cleanUsername },
            ],
        }).select('+password');

        // If 'admin' user doesn't exist yet, seed/auto-provision default admin
        if (!adminUser && cleanUsername.toLowerCase() === 'admin') {
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash('admin@123', salt);

            let existingAdmin = await User.findOne({
                $or: [{ mobile: '+919999999999' }, { email: 'admin@picposter.com' }, { mobile: '+919876543210' }],
            });

            if (existingAdmin) {
                existingAdmin.username = 'admin';
                existingAdmin.password = hashedPassword;
                existingAdmin.role = 'admin';
                existingAdmin.isVerified = true;
                existingAdmin.isActive = true;
                await existingAdmin.save();
                adminUser = existingAdmin;
            } else {
                adminUser = await User.create({
                    username: 'admin',
                    password: hashedPassword,
                    mobile: '+919999999999',
                    name: 'Administrator',
                    email: 'admin@picposter.com',
                    role: 'admin',
                    isVerified: true,
                    isActive: true,
                });
            }
        }

        if (!adminUser) {
            throw new AppError('Invalid username or password', 401, 'INVALID_CREDENTIALS');
        }

        if (adminUser.role !== 'admin') {
            throw new AppError('Access denied. Administrator privileges required.', 403, 'FORBIDDEN_ADMIN_ONLY');
        }

        if (!adminUser.isActive) {
            throw new AppError('Admin account is deactivated. Please contact support.', 403, 'ACCOUNT_DEACTIVATED');
        }

        // Verify password
        let isMatch = false;
        if (adminUser.password) {
            isMatch = await bcrypt.compare(cleanPassword, adminUser.password);
        }

        // Allow fallback if cleanPassword is admin@123 for default admin
        if (!isMatch && cleanUsername.toLowerCase() === 'admin' && cleanPassword === 'admin@123') {
            const salt = await bcrypt.genSalt(10);
            adminUser.password = await bcrypt.hash('admin@123', salt);
            await adminUser.save();
            isMatch = true;
        }

        if (!isMatch) {
            throw new AppError('Invalid username or password', 401, 'INVALID_CREDENTIALS');
        }

        // Update last login
        adminUser.lastLoginAt = new Date();
        await adminUser.save();

        // Issue JWT tokens
        const tokens = await this.generateTokens(adminUser._id, deviceId, platform);

        return {
            user: adminUser,
            tokens,
        };
    }

    /**
     * Revoke refresh token on logout
     */
    async logout(userId, rawRefreshToken = '') {
        if (rawRefreshToken) {
            const tokenHash = crypto.createHash('sha256').update(rawRefreshToken).digest('hex');
            await RefreshToken.deleteOne({ tokenHash });
        } else if (userId) {
            await RefreshToken.deleteMany({ userId });
        }
        return { success: true };
    }
}

module.exports = new AuthService();
