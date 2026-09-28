const http = require('http');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
const connectDB = require('../src/config/db');
const OtpVerification = require('../src/models/OtpVerification');

const BASE_URL = 'http://127.0.0.1:5000';

const request = (path, method = 'GET', body = null, token = null) => {
    return new Promise((resolve, reject) => {
        const url = new URL(`${BASE_URL}${path}`);
        const headers = {};

        if (body) {
            headers['Content-Type'] = 'application/json';
        }
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const options = {
            hostname: url.hostname,
            port: url.port,
            path: url.pathname + url.search,
            method,
            headers,
        };

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => {
                data += chunk;
            });
            res.on('end', () => {
                let json;
                try {
                    json = JSON.parse(data);
                } catch (e) {
                    json = data;
                }
                resolve({ status: res.statusCode, data: json });
            });
        });

        req.on('error', (err) => reject(err));

        if (body) {
            req.write(JSON.stringify(body));
        }
        req.end();
    });
};

const runTests = async () => {
    console.log('🚀 Starting PicPoster Backend API Verification Test Suite...\n');
    let passed = 0;
    let failed = 0;

    const assert = (condition, name, details = '') => {
        if (condition) {
            console.log(`✅ PASS: ${name}`);
            passed++;
        } else {
            console.error(`❌ FAIL: ${name} -> ${details}`);
            failed++;
        }
    };

    try {
        // Connect to MongoDB
        await connectDB();

        // 1. Health check
        const health = await request('/api/v1/health');
        assert(health.status === 200 && health.data.success === true, '1. Health Check GET /api/v1/health', JSON.stringify(health.data));

        // 2. Send OTP
        const testMobile = '+919988776655';
        const salt = await bcrypt.genSalt(10);
        const testOtpHash = await bcrypt.hash('123456', salt);

        const sendOtpRes = await request('/api/v1/auth/send-otp', 'POST', { mobile: testMobile });
        assert(sendOtpRes.status === 200 && sendOtpRes.data.success === true, '2. Send OTP POST /api/v1/auth/send-otp', JSON.stringify(sendOtpRes.data));

        await OtpVerification.findOneAndUpdate(
            { mobile: testMobile },
            { otpHash: testOtpHash, isUsed: false, expiresAt: new Date(Date.now() + 300000), attempts: 0 }
        );

        // 3. Verify OTP
        const verifyRes = await request('/api/v1/auth/verify-otp', 'POST', {
            mobile: testMobile,
            otp: '123456',
            deviceId: 'test_device_1',
            platform: 'android',
        });
        assert(verifyRes.status === 200 && verifyRes.data.data.tokens.accessToken, '3. Verify OTP POST /api/v1/auth/verify-otp', JSON.stringify(verifyRes.data));

        const accessToken = verifyRes.data.data.tokens.accessToken;
        const refreshToken = verifyRes.data.data.tokens.refreshToken;

        // 4. User Profile GET & PUT
        const profileGet = await request('/api/v1/user/profile', 'GET', null, accessToken);
        assert(profileGet.status === 200 && profileGet.data.data.mobile === testMobile, '4. GET User Profile /api/v1/user/profile', JSON.stringify(profileGet.data));

        const profilePut = await request('/api/v1/user/profile', 'PUT', {
            name: 'Rohan Sharma',
            preferredLanguage: 'Hindi',
        }, accessToken);
        assert(profilePut.status === 200 && profilePut.data.data.name === 'Rohan Sharma', '5. PUT User Profile /api/v1/user/profile', JSON.stringify(profilePut.data));

        // 5. Business Profile GET & PUT
        const businessGet = await request('/api/v1/business', 'GET', null, accessToken);
        assert(businessGet.status === 200 && businessGet.data.data.userId, '6. GET Business Info /api/v1/business', JSON.stringify(businessGet.data));

        const businessPut = await request('/api/v1/business', 'PUT', {
            companyName: 'Rohit Tech Enterprises',
            contactNumber: '+919988776655',
            tagline: 'Empowering Visuals',
            socialHandles: { instagram: 'rohittech', whatsapp: '+919988776655' },
        }, accessToken);
        assert(businessPut.status === 200 && businessPut.data.data.companyName === 'Rohit Tech Enterprises', '7. PUT Business Info /api/v1/business', JSON.stringify(businessPut.data));

        // 6. Categories List
        const categoriesRes = await request('/api/v1/posters/categories');
        assert(categoriesRes.status === 200 && Array.isArray(categoriesRes.data.data) && categoriesRes.data.data.length > 0, '8. GET Categories /api/v1/posters/categories', JSON.stringify(categoriesRes.data));

        // 7. Posters List & Filters
        const postersRes = await request('/api/v1/posters?page=1&limit=10');
        assert(postersRes.status === 200 && postersRes.data.totalCount > 0, '9. GET Posters /api/v1/posters', JSON.stringify(postersRes.data));

        const firstPosterId = postersRes.data.data[0]._id || postersRes.data.data[0].id;

        // 8. Poster Action (Download & Share counter increment)
        const actionRes = await request(`/api/v1/posters/${firstPosterId}/action`, 'POST', { action: 'download' });
        assert(actionRes.status === 200 && actionRes.data.data.downloadsCount > 0, '10. Poster Action POST /api/v1/posters/:id/action', JSON.stringify(actionRes.data));

        // 9. Bookmark / Saved Templates
        const saveTemplateRes = await request(`/api/v1/user/saved-templates/${firstPosterId}`, 'POST', null, accessToken);
        assert(saveTemplateRes.status === 200, '11. Save Template Bookmark POST /api/v1/user/saved-templates/:id', JSON.stringify(saveTemplateRes.data));

        const getSavedRes = await request('/api/v1/user/saved-templates', 'GET', null, accessToken);
        assert(getSavedRes.status === 200 && getSavedRes.data.data.length > 0, '12. GET Saved Templates /api/v1/user/saved-templates', JSON.stringify(getSavedRes.data));

        // 10. User Creations
        const createCreationRes = await request('/api/v1/user/creations', 'POST', {
            posterId: firstPosterId,
            customizedImageUrl: 'https://cdn.picposter.com/creations/sample_banner.webp',
            customText: 'Special Weekend Offer',
        }, accessToken);
        assert(createCreationRes.status === 201 && createCreationRes.data.data.customText === 'Special Weekend Offer', '13. POST User Creation /api/v1/user/creations', JSON.stringify(createCreationRes.data));

        const getCreationsRes = await request('/api/v1/user/creations', 'GET', null, accessToken);
        assert(getCreationsRes.status === 200 && getCreationsRes.data.data.length > 0, '14. GET User Creations /api/v1/user/creations', JSON.stringify(getCreationsRes.data));

        // 11. Support Contact Form
        const supportRes = await request('/api/v1/support/contact', 'POST', {
            name: 'Rohan Sharma',
            contact: '+919988776655',
            query: 'How to add high resolution business logos?',
        });
        assert(supportRes.status === 201 && supportRes.data.success === true, '15. Submit Support Query POST /api/v1/support/contact', JSON.stringify(supportRes.data));

        // 12. Refresh Token
        const refreshRes = await request('/api/v1/auth/refresh-token', 'POST', {
            refreshToken,
            deviceId: 'test_device_1',
        });
        assert(refreshRes.status === 200 && refreshRes.data.data.accessToken, '16. Refresh Token POST /api/v1/auth/refresh-token', JSON.stringify(refreshRes.data));

        // 13. Logout
        const logoutRes = await request('/api/v1/auth/logout', 'POST', {
            refreshToken: refreshRes.data.data.refreshToken,
        }, refreshRes.data.data.accessToken);
        assert(logoutRes.status === 200 && logoutRes.data.success === true, '17. Logout POST /api/v1/auth/logout', JSON.stringify(logoutRes.data));

        // 14. Error Handling: Invalid OTP verification
        const badOtpRes = await request('/api/v1/auth/verify-otp', 'POST', {
            mobile: '+919988776600',
            otp: '000000',
        });
        assert(badOtpRes.status === 400 && badOtpRes.data.success === false && badOtpRes.data.errorCode, '18. Error Handling - Invalid OTP check', JSON.stringify(badOtpRes.data));

        // 15. Error Handling: 404 Not Found
        const notFoundRes = await request('/api/v1/non-existent-route');
        assert(notFoundRes.status === 404 && notFoundRes.data.errorCode === 'NOT_FOUND', '19. Error Handling - 404 Not Found check', JSON.stringify(notFoundRes.data));

        console.log(`\n========================================`);
        console.log(`Summary: ${passed} Passed, ${failed} Failed`);
        console.log(`========================================\n`);

        if (failed === 0) {
            console.log('🎉 ALL BACKEND APIS VERIFIED AND WORKING PERFECTLY!');
            await mongoose.disconnect();
            process.exit(0);
        } else {
            console.error('⚠️ Some tests failed.');
            await mongoose.disconnect();
            process.exit(1);
        }
    } catch (err) {
        console.error('Test execution error:', err);
        await mongoose.disconnect();
        process.exit(1);
    }
};

runTests();
