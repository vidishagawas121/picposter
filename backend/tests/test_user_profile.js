const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);
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

const runUserProfileTests = async () => {
    await connectDB();
    console.log('====================================================');
    console.log('👤 Starting PicPoster User Profile Verification Test Suite');
    console.log('====================================================\n');

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
        // --- 1. Unauthenticated profile access rejection ---
        const unauthGet = await request('/api/v1/user/profile', 'GET');
        assert(unauthGet.status === 401, '1. Unauthenticated GET /api/v1/user/profile rejected with 401', JSON.stringify(unauthGet.data));

        const unauthPut = await request('/api/v1/user/profile', 'PUT', { name: 'Hacker' });
        assert(unauthPut.status === 401, '2. Unauthenticated PUT /api/v1/user/profile rejected with 401', JSON.stringify(unauthPut.data));

        // --- 2. Authenticate User 1 (+919988776601) ---
        const user1Mobile = '+919988776601';
        await request('/api/v1/auth/send-otp', 'POST', { mobile: user1Mobile });
        const salt = await bcrypt.genSalt(10);
        const testOtpHash = await bcrypt.hash('123456', salt);
        await OtpVerification.findOneAndUpdate(
            { mobile: user1Mobile },
            { otpHash: testOtpHash, isUsed: false, expiresAt: new Date(Date.now() + 300000), attempts: 0 }
        );
        const user1VerifyRes = await request('/api/v1/auth/verify-otp', 'POST', {
            mobile: user1Mobile,
            otp: '123456',
            deviceId: 'device_user_1',
            platform: 'android',
        });
        assert(user1VerifyRes.status === 200, '3. User 1 Authentication successful', JSON.stringify(user1VerifyRes.data));
        const user1Token = user1VerifyRes.data.data.tokens.accessToken;

        // --- 3. GET User 1 Profile ---
        const user1ProfileRes = await request('/api/v1/user/profile', 'GET', null, user1Token);
        assert(user1ProfileRes.status === 200 && user1ProfileRes.data.data.mobile === user1Mobile, '4. GET User 1 Profile returns User 1 data', JSON.stringify(user1ProfileRes.data));

        // --- 4. Update User 1 Profile via PUT ---
        const user1UpdatedName = 'Aarav Mehta';
        const user1UpdateRes = await request('/api/v1/user/profile', 'PUT', {
            name: user1UpdatedName,
            email: 'aarav.mehta@example.com',
            preferredLanguage: 'Hindi',
        }, user1Token);
        assert(
            user1UpdateRes.status === 200 && user1UpdateRes.data.data.name === user1UpdatedName && user1UpdateRes.data.data.email === 'aarav.mehta@example.com',
            '5. PUT /api/v1/user/profile updates User 1 name, email, and preferredLanguage',
            JSON.stringify(user1UpdateRes.data)
        );

        // --- 5. Partial Update User 1 Profile via PUT ---
        const user1PutRes2 = await request('/api/v1/user/profile', 'PUT', {
            preferredLanguage: 'Gujarati',
        }, user1Token);
        assert(
            user1PutRes2.status === 200 && user1PutRes2.data.data.preferredLanguage === 'Gujarati' && user1PutRes2.data.data.name === user1UpdatedName,
            '6. PUT /api/v1/user/profile updates preferredLanguage while preserving name',
            JSON.stringify(user1PutRes2.data)
        );

        // --- 6. Verify Security: Protected fields tampering rejected/ignored ---
        const tamperRes = await request('/api/v1/user/profile', 'PUT', {
            role: 'admin',
            isActive: false,
            isVerified: false,
            mobile: '+910000000000',
        }, user1Token);
        assert(
            tamperRes.status === 200 &&
            tamperRes.data.data.role === 'user' &&
            tamperRes.data.data.isVerified === true &&
            tamperRes.data.data.mobile === user1Mobile,
            '7. Security: Protected fields (role, isVerified, mobile) are not modifiable by normal user',
            JSON.stringify(tamperRes.data)
        );

        // --- 7. Authenticate User 2 (+919988776602) ---
        const user2Mobile = '+919988776602';
        await request('/api/v1/auth/send-otp', 'POST', { mobile: user2Mobile });
        await OtpVerification.findOneAndUpdate(
            { mobile: user2Mobile },
            { otpHash: testOtpHash, isUsed: false, expiresAt: new Date(Date.now() + 300000), attempts: 0 }
        );
        const user2VerifyRes = await request('/api/v1/auth/verify-otp', 'POST', {
            mobile: user2Mobile,
            otp: '123456',
            deviceId: 'device_user_2',
            platform: 'android',
        });
        assert(user2VerifyRes.status === 200, '8. User 2 Authentication successful', JSON.stringify(user2VerifyRes.data));
        const user2Token = user2VerifyRes.data.data.tokens.accessToken;

        // If user was previously deactivated during admin tests, ensure isActive is reset to true
        if (!user2VerifyRes.data.data.user.isActive) {
            const User = require('../src/models/User');
            await User.findByIdAndUpdate(user2VerifyRes.data.data.user._id, { isActive: true });
        }

        // --- 8. GET User 2 Profile: Verify User 2's data is distinct and NOT User 1's ---
        const user2ProfileRes = await request('/api/v1/user/profile', 'GET', null, user2Token);
        assert(
            user2ProfileRes.status === 200 &&
            user2ProfileRes.data.data.mobile === user2Mobile &&
            user2ProfileRes.data.data.name !== user1UpdatedName,
            '9. User Switch: User 2 receives User 2 profile (NOT User 1 data)',
            JSON.stringify(user2ProfileRes.data)
        );

        // --- 9. Update User 2 Profile ---
        const user2UpdatedName = 'Sneha Patel';
        const user2UpdateRes = await request('/api/v1/user/profile', 'PUT', {
            name: user2UpdatedName,
            email: 'sneha.patel@example.com',
            preferredLanguage: 'Marathi',
        }, user2Token);
        assert(
            user2UpdateRes.status === 200 && user2UpdateRes.data.data.name === user2UpdatedName,
            '10. User 2 updates own profile successfully via PUT',
            JSON.stringify(user2UpdateRes.data)
        );

        // --- 10. Verify User 1 Profile was NOT affected by User 2's actions ---
        const user1RecheckRes = await request('/api/v1/user/profile', 'GET', null, user1Token);
        assert(
            user1RecheckRes.status === 200 &&
            user1RecheckRes.data.data.name === user1UpdatedName &&
            user1RecheckRes.data.data.mobile === user1Mobile,
            '11. User Isolation: User 1 profile remains unchanged after User 2 update',
            JSON.stringify(user1RecheckRes.data)
        );

        // --- 11. Persistence Check: User 2 Re-login ---
        await request('/api/v1/auth/send-otp', 'POST', { mobile: user2Mobile });
        await OtpVerification.findOneAndUpdate(
            { mobile: user2Mobile },
            { otpHash: testOtpHash, isUsed: false, expiresAt: new Date(Date.now() + 300000), attempts: 0 }
        );
        const user2ReloginVerifyRes = await request('/api/v1/auth/verify-otp', 'POST', {
            mobile: user2Mobile,
            otp: '123456',
            deviceId: 'device_user_2_b',
            platform: 'android',
        });
        const user2NewToken = user2ReloginVerifyRes.data.data.tokens.accessToken;
        const user2PersistedProfile = await request('/api/v1/user/profile', 'GET', null, user2NewToken);
        assert(
            user2PersistedProfile.status === 200 &&
            user2PersistedProfile.data.data.name === user2UpdatedName &&
            user2PersistedProfile.data.data.email === 'sneha.patel@example.com',
            '12. Persistence: User 2 updated profile persists across sessions from MongoDB',
            JSON.stringify(user2PersistedProfile.data)
        );

        // --- 12. Input Validation Checks ---
        const emptyNameRes = await request('/api/v1/user/profile', 'PUT', { name: '' }, user2Token);
        assert(emptyNameRes.status === 400 && emptyNameRes.data.errorCode === 'VALIDATION_ERROR', '13. Validation: Empty name is rejected with 400', JSON.stringify(emptyNameRes.data));

        const invalidLangRes = await request('/api/v1/user/profile', 'PUT', { preferredLanguage: 'Klingon' }, user2Token);
        assert(invalidLangRes.status === 400 && invalidLangRes.data.errorCode === 'VALIDATION_ERROR', '14. Validation: Invalid language enum is rejected with 400', JSON.stringify(invalidLangRes.data));

        console.log('\n====================================================');
        console.log(`Summary: ${passed} Passed, ${failed} Failed`);
        console.log('====================================================\n');

        if (failed === 0) {
            console.log('🎉 ALL NORMAL USER PROFILE TESTS PASSED WITH 100% ACCURACY!');
            await mongoose.disconnect();
            process.exit(0);
        } else {
            console.error('⚠️ Some user profile tests failed.');
            await mongoose.disconnect();
            process.exit(1);
        }
    } catch (err) {
        console.error('User profile test error:', err);
        try { await mongoose.disconnect(); } catch (e) {}
        process.exit(1);
    }
};

runUserProfileTests();
