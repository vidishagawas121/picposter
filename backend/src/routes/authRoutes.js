const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { protect } = require('../middlewares/authMiddleware');
const { otpSendLimiter, otpVerifyLimiter, authLimiter } = require('../middlewares/rateLimiter');

router.post('/send-otp', otpSendLimiter, authController.sendOtp);
router.post('/verify-otp', otpVerifyLimiter, authController.verifyOtp);
router.post('/admin-login', authLimiter, authController.adminLogin);
router.post('/admin/login', authLimiter, authController.adminLogin);
router.post('/refresh-token', authLimiter, authController.refreshToken);
router.post('/logout', protect, authController.logout);

module.exports = router;
