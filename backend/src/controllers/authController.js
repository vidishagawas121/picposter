const authService = require('../services/authService');
const { sendSuccess } = require('../utils/apiResponse');
const catchAsync = require('../utils/catchAsync');

/**
 * @desc    Send 6-digit OTP to mobile
 * @route   POST /api/v1/auth/send-otp
 * @access  Public
 */
const sendOtp = catchAsync(async (req, res) => {
    const { mobile } = req.body;
    const result = await authService.sendOtp(mobile);

    return sendSuccess(res, 200, `OTP sent successfully to ${mobile}`, {
        cooldownSeconds: result.cooldownSeconds,
    });
});

/**
 * @desc    Verify OTP, register/login user, issue tokens
 * @route   POST /api/v1/auth/verify-otp
 * @access  Public
 */
const verifyOtp = catchAsync(async (req, res) => {
    const { mobile, otp, deviceId, platform } = req.body;
    const result = await authService.verifyOtp(mobile, otp, deviceId, platform);

    return sendSuccess(res, 200, result.isNewUser ? 'Registration successful' : 'Login successful', {
        user: {
            id: result.user._id,
            _id: result.user._id,
            mobile: result.user.mobile,
            name: result.user.name,
            email: result.user.email,
            profilePhoto: result.user.profilePhoto,
            preferredLanguage: result.user.preferredLanguage,
            isVerified: result.user.isVerified,
            role: result.user.role,
        },
        tokens: result.tokens,
        isNewUser: result.isNewUser,
    });
});

/**
 * @desc    Refresh access token with refresh token rotation
 * @route   POST /api/v1/auth/refresh-token
 * @access  Public
 */
const refreshToken = catchAsync(async (req, res) => {
    const { refreshToken: token, deviceId } = req.body;
    const tokens = await authService.refreshTokens(token, deviceId);

    return sendSuccess(res, 200, 'Token refreshed successfully', tokens);
});

/**
 * @desc    Admin username & password login
 * @route   POST /api/v1/auth/admin-login
 * @access  Public
 */
const adminLogin = catchAsync(async (req, res) => {
    const { username, password, deviceId, platform } = req.body;
    const result = await authService.adminPasswordLogin(username, password, deviceId, platform);

    return sendSuccess(res, 200, 'Admin login successful', {
        user: {
            id: result.user._id,
            _id: result.user._id,
            username: result.user.username,
            mobile: result.user.mobile,
            name: result.user.name,
            email: result.user.email,
            profilePhoto: result.user.profilePhoto,
            role: result.user.role,
        },
        tokens: result.tokens,
    });
});

/**
 * @desc    Logout and revoke active device refresh token
 * @route   POST /api/v1/auth/logout
 * @access  Private
 */
const logout = catchAsync(async (req, res) => {
    const { refreshToken: token } = req.body;
    await authService.logout(req.user ? req.user._id : null, token);

    return sendSuccess(res, 200, 'Logged out successfully');
});

module.exports = {
    sendOtp,
    verifyOtp,
    adminLogin,
    refreshToken,
    logout,
};
