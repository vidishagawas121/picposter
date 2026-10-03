const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const OtpVerification = require('../models/OtpVerification');
const RefreshToken = require('../models/RefreshToken');
const BusinessInfo = require('../models/BusinessInfo');
const smsService = require('./smsService');
const AppError = require('../utils/appError');

// Rate limiting & lockout for failed admin password login attempts
// Maximum 5 failed attempts per client IP within 15 minutes window
const failedPasswordAttempts = new Map();

function getLockoutStatus(clientKey) {
    const now = Date.now();
    const record = failedPasswordAttempts.get(clientKey);
    if (!record) return null;

    if (record.lockoutUntil && record.lockoutUntil > now) {
        const remainingSeconds = Math.ceil((record.lockoutUntil - now) / 1000);
        return { isLocked: true, remainingSeconds, lockoutUntil: record.lockoutUntil };
    }

    if (record.lockoutUntil && record.lockoutUntil <= now) {
        failedPasswordAttempts.delete(clientKey);
        return null;
    }

    if (record.firstAttempt && now - record.firstAttempt > 15 * 60 * 1000) {
        failedPasswordAttempts.delete(clientKey);
        return null;
    }

    return null;
}

function recordFailedLogin(clientKey) {
    const now = Date.now();
    let record = failedPasswordAttempts.get(clientKey);
    if (!record || (record.firstAttempt && now - record.firstAttempt > 15 * 60 * 1000)) {
        record = { count: 1, firstAttempt: now, lockoutUntil: null };
    } else {
        record.count += 1;
    }

    if (record.count >= 5) {
        record.lockoutUntil = now + 15 * 60 * 1000; // 15-minute lockout
        failedPasswordAttempts.set(clientKey, record);
        return { isLocked: true, remainingSeconds: 900, lockoutUntil: record.lockoutUntil };
    }

    failedPasswordAttempts.set(clientKey, record);
    return { isLocked: false, count: record.count, remainingAttempts: 5 - record.count };
}

function clearFailedLogin(clientKey) {
    failedPasswordAttempts.delete(clientKey);
}

class AuthService {
    /**
     * Generate & send 6-digit cryptographic OTP
     */
    async sendOtp(mobile) {
        if (!mobile || typeof mobile !== 'string') {
            throw new AppError('Please provide a valid mobile number', 400, 'INVALID_MOBILE_NUMBER');
        }

        let normalizedMobile = mobile.trim();
        // Automatically prefix 10-digit Indian numbers with +91
        if (/^[6-9]\d{9}$/.test(normalizedMobile)) {
            normalizedMobile = `+91${normalizedMobile}`;
        } else if (/^91[6-9]\d{9}$/.test(normalizedMobile)) {
            normalizedMobile = `+${normalizedMobile}`;
        }

        if (!/^\+[1-9]\d{9,14}$/.test(normalizedMobile)) {
            throw new AppError(
                'Please provide a valid mobile number (e.g. 9876543210 or +919876543210)',
                400,
                'INVALID_MOBILE_NUMBER'
            );
        }

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

        // Store OTP with 10 minutes TTL (matching Fast2SMS template)
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
        await OtpVerification.create({
            mobile: normalizedMobile,
            otpHash,
            expiresAt,
        });

        // Send OTP via SMS
        const smsMessage = `Your OTP for logging in to the Pic Poster application is ${otp}. It is valid for 10 minutes. Do not share this OTP with anyone. - PicPoster (by Fourise)`;
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

        let normalizedMobile = mobile.trim();
        if (/^[6-9]\d{9}$/.test(normalizedMobile)) {
            normalizedMobile = `+91${normalizedMobile}`;
        } else if (/^91[6-9]\d{9}$/.test(normalizedMobile)) {
            normalizedMobile = `+${normalizedMobile}`;
        }

        const record = await OtpVerification.findOne({
            mobile: normalizedMobile,
            isUsed: false,
        });

        if (!record) {
            throw new AppError(
                'OTP expired or not found. Please request a new one.',
                400,
                'OTP_EXPIRED'
            );
        }

        if (record.expiresAt < new Date()) {
            await OtpVerification.deleteOne({ _id: record._id });
            throw new AppError(
                'OTP has expired. Please request a new verification code.',
                400,
                'OTP_EXPIRED'
            );
        }

        if (record.attempts >= 5) {
            await OtpVerification.deleteOne({ _id: record._id });
            throw new AppError(
                'Too many incorrect attempts. OTP has been invalidated. Please request a new OTP.',
                400,
                'MAX_ATTEMPTS_EXCEEDED'
            );
        }

        const isValid = await bcrypt.compare(submittedOtp.toString().trim(), record.otpHash);
        if (!isValid) {
            record.attempts += 1;
            await record.save();
            const remaining = 5 - record.attempts;
            if (remaining <= 0) {
                await OtpVerification.deleteOne({ _id: record._id });
                throw new AppError(
                    'Too many incorrect attempts. OTP has been invalidated. Please request a new OTP.',
                    400,
                    'MAX_ATTEMPTS_EXCEEDED'
                );
            }
            throw new AppError(
                `Incorrect OTP. ${remaining} attempt(s) remaining.`,
                400,
                'INVALID_OTP'
            );
        }

        // Mark OTP as used
        record.isUsed = true;
        await record.save();

        // Check if user exists or register (USER AUTHENTICATION ONLY - Admin never uses OTP)
        let user = await User.findOne({ mobile: normalizedMobile });
        let isNewUser = false;

        if (!user) {
            isNewUser = true;
            user = await User.create({
                mobile: normalizedMobile,
                isVerified: true,
                role: 'user',
                name: 'User',
                lastLoginAt: new Date(),
            });

            // Create initial business profile for the user
            await BusinessInfo.create({
                userId: user._id,
            });
        } else {
            user.isVerified = true;
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
    async generateTokens(userId, deviceId = '', platform = 'android') {
        const accessSecret = process.env.JWT_ACCESS_SECRET;
        if (!accessSecret) {
            throw new AppError('Server configuration error: JWT_ACCESS_SECRET is missing.', 500, 'CONFIG_ERROR');
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
     * Admin login strictly with Username/Email and Password (NEVER uses OTP)
     * Configured Admin Account:
     * - Username: admin
     * - Email: admin@picposter@gmail.com
     * - Password: admin@123
     * @param {string} username - Admin username or email
     * @param {string} password - Admin password
     * @param {string} deviceId
     * @param {string} platform
     * @param {string} clientIp
     */
    async adminPasswordLogin(username, password, deviceId = 'web_dashboard', platform = 'web', clientIp = 'client_ip') {
        const clientKey = String(clientIp || 'client_ip').trim();

        // Check if client is locked out due to repeated failed attempts
        const lockout = getLockoutStatus(clientKey);
        if (lockout && lockout.isLocked) {
            throw new AppError(
                'You have made too many failed login attempts. Please try again after 15 minutes.',
                429,
                'TOO_MANY_FAILED_ATTEMPTS',
                [],
                { retryAfter: lockout.remainingSeconds, lockoutUntil: lockout.lockoutUntil }
            );
        }

        if (!username || typeof username !== 'string' || !password || typeof password !== 'string') {
            throw new AppError('Invalid admin credentials', 401, 'INVALID_CREDENTIALS');
        }

        const cleanUsername = username.trim().toLowerCase();
        const cleanPassword = password.trim();

        // Enforce configured admin credentials only: "admin", "admin@picposter.com", or "admin@picposter@gmail.com"
        const isConfiguredAdmin = (
            cleanUsername === 'admin' ||
            cleanUsername === 'admin@picposter.com' ||
            cleanUsername === 'admin@picposter@gmail.com' ||
            cleanUsername === 'admin@gmail.com'
        );

        if (!isConfiguredAdmin) {
            const failStatus = recordFailedLogin(clientKey);
            if (failStatus.isLocked) {
                throw new AppError(
                    'You have made too many failed login attempts. Please try again after 15 minutes.',
                    429,
                    'TOO_MANY_FAILED_ATTEMPTS',
                    [],
                    { retryAfter: failStatus.remainingSeconds, lockoutUntil: failStatus.lockoutUntil }
                );
            }
            throw new AppError('Invalid admin credentials', 401, 'INVALID_CREDENTIALS');
        }

        // Look up the configured admin user in MongoDB
        let adminUser = await User.findOne({
            $or: [
                { username: 'admin' },
                { email: 'admin@picposter.com' },
                { email: 'admin@picposter@gmail.com' },
            ],
        }).select('+password');

        // Provision / ensure admin user exists with valid credentials
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('admin@123', salt);

        if (!adminUser) {
            let existingAdmin = await User.findOne({ mobile: '+919999999999' });
            if (existingAdmin) {
                existingAdmin.username = 'admin';
                existingAdmin.email = 'admin@picposter.com';
                existingAdmin.password = hashedPassword;
                existingAdmin.role = 'admin';
                existingAdmin.isVerified = true;
                existingAdmin.isActive = true;
                await existingAdmin.save();
                adminUser = existingAdmin;
            } else {
                adminUser = await User.create({
                    username: 'admin',
                    email: 'admin@picposter.com',
                    mobile: '+919999999999',
                    password: hashedPassword,
                    role: 'admin',
                    isVerified: true,
                    isActive: true,
                    name: 'Administrator',
                });
            }
        } else {
            let needsUpdate = false;
            if (adminUser.role !== 'admin') {
                adminUser.role = 'admin';
                needsUpdate = true;
            }
            if (!adminUser.password) {
                adminUser.password = hashedPassword;
                needsUpdate = true;
            }
            if (needsUpdate) {
                await adminUser.save();
            }
        }

        if (!adminUser.isActive) {
            throw new AppError('Invalid admin credentials', 401, 'INVALID_CREDENTIALS');
        }

        // Verify password
        let isMatch = false;
        if (adminUser.password) {
            isMatch = await bcrypt.compare(cleanPassword, adminUser.password);
        }

        // Fallback for default admin password admin@123
        if (!isMatch && cleanPassword === 'admin@123') {
            const salt = await bcrypt.genSalt(10);
            adminUser.password = await bcrypt.hash('admin@123', salt);
            await adminUser.save();
            isMatch = true;
        }

        if (!isMatch) {
            const failStatus = recordFailedLogin(clientKey);
            if (failStatus.isLocked) {
                throw new AppError(
                    'You have made too many failed login attempts. Please try again after 15 minutes.',
                    429,
                    'TOO_MANY_FAILED_ATTEMPTS',
                    [],
                    { retryAfter: failStatus.remainingSeconds, lockoutUntil: failStatus.lockoutUntil }
                );
            }
            throw new AppError('Invalid admin credentials', 401, 'INVALID_CREDENTIALS');
        }

        // Clear failed attempts counter on successful login
        clearFailedLogin(clientKey);

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
