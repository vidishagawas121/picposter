const http = require('http');
const mongoose = require('mongoose');
require('dotenv').config();
const connectDB = require('./src/config/db');

const BASE_URL = 'http://127.0.0.1:5000';

function request(path, options = {}) {
    return new Promise((resolve, reject) => {
        const url = new URL(path, BASE_URL);
        const headers = {
            ...(options.body ? { 'Content-Type': 'application/json' } : {}),
            ...(options.headers || {}),
        };

        const req = http.request(
            {
                hostname: url.hostname,
                port: url.port,
                path: url.pathname + url.search,
                method: options.method || 'GET',
                headers,
            },
            (res) => {
                let data = '';
                res.on('data', (chunk) => (data += chunk));
                res.on('end', () => {
                    let parsed = null;
                    try {
                        parsed = JSON.parse(data);
                    } catch (e) {
                        parsed = data;
                    }
                    resolve({
                        status: res.statusCode,
                        headers: res.headers,
                        body: parsed,
                    });
                });
            }
        );

        req.on('error', reject);

        if (options.body) {
            if (typeof options.body === 'string') {
                req.write(options.body);
            } else {
                req.write(JSON.stringify(options.body));
            }
        }

        req.end();
    });
}

async function runSecurityTests() {
    await connectDB();
    console.log('====================================================');
    console.log('🔒 PICPOSTER BACKEND - SECURITY & ERROR HANDLING TEST');
    console.log('====================================================\n');

    let passed = 0;
    let failed = 0;

    function assert(name, condition, extraInfo = '') {
        if (condition) {
            console.log(`  ✅ [PASS] ${name}`);
            passed++;
        } else {
            console.error(`  ❌ [FAIL] ${name} ${extraInfo}`);
            failed++;
        }
    }

    // 1. Health check & security headers
    console.log('--- 1. Security Headers & Health Check ---');
    const health = await request('/api/v1/health');
    assert('Health endpoint returns 200', health.status === 200);
    assert('Helmet cross-origin-resource-policy header is present', health.headers['cross-origin-resource-policy'] === 'cross-origin');
    assert('X-Powered-By is hidden by Helmet', !health.headers['x-powered-by']);

    // 2. Authentication & Authorization
    console.log('\n--- 2. Authentication & Authorization ---');
    const OtpVerification = require('./src/models/OtpVerification');
    const User = require('./src/models/User');
    const bcrypt = require('bcryptjs');

    const testSalt = await bcrypt.genSalt(10);
    const testOtpHash = await bcrypt.hash('123456', testSalt);

    // Login as normal user (+919876543210)
    await request('/api/v1/auth/send-otp', {
        method: 'POST',
        body: { mobile: '+919876543210' },
    });
    await OtpVerification.findOneAndUpdate(
        { mobile: '+919876543210' },
        { otpHash: testOtpHash, isUsed: false, expiresAt: new Date(Date.now() + 300000), attempts: 0 }
    );
    const userAuth = await request('/api/v1/auth/verify-otp', {
        method: 'POST',
        body: { mobile: '+919876543210', otp: '123456' },
    });
    assert('Normal user login succeeds', userAuth.status === 200 && userAuth.body.success);
    const userToken = userAuth.body.data && userAuth.body.data.tokens ? userAuth.body.data.tokens.accessToken : null;

    // Login as admin (+919999999999)
    await request('/api/v1/auth/send-otp', {
        method: 'POST',
        body: { mobile: '+919999999999' },
    });
    await OtpVerification.findOneAndUpdate(
        { mobile: '+919999999999' },
        { otpHash: testOtpHash, isUsed: false, expiresAt: new Date(Date.now() + 300000), attempts: 0 }
    );
    const adminAuth = await request('/api/v1/auth/verify-otp', {
        method: 'POST',
        body: { mobile: '+919999999999', otp: '123456' },
    });
    assert('Admin user login succeeds', adminAuth.status === 200 && adminAuth.body.success);
    const adminToken = adminAuth.body.data && adminAuth.body.data.tokens ? adminAuth.body.data.tokens.accessToken : null;

    // Ensure +919999999999 has role 'admin'
    if (adminAuth.body.data && adminAuth.body.data.user && adminAuth.body.data.user.role !== 'admin') {
        await User.findByIdAndUpdate(adminAuth.body.data.user._id, { role: 'admin' });
    }
    // Ensure +919876543210 has role 'user'
    if (userAuth.body.data && userAuth.body.data.user && userAuth.body.data.user.role !== 'user') {
        await User.findByIdAndUpdate(userAuth.body.data.user._id, { role: 'user' });
    }

    // Test unauthenticated access to protected route
    const noToken = await request('/api/v1/user/profile');
    assert('Unauthenticated access blocked with 401', noToken.status === 401 && noToken.body.errorCode === 'UNAUTHORIZED');

    // Test fake/tampered token
    const fakeToken = await request('/api/v1/user/profile', {
        headers: { Authorization: 'Bearer invalid.token.signature' },
    });
    assert('Malformed token blocked with 401', fakeToken.status === 401 && fakeToken.body.errorCode === 'INVALID_TOKEN');

    // Test Admin RBAC / adminGuard (Normal user trying to access /api/v1/admin/users)
    const forbiddenAdmin = await request('/api/v1/admin/users', {
        headers: { Authorization: `Bearer ${userToken}` },
    });
    assert('Normal user blocked from Admin API with 403 FORBIDDEN_ADMIN_ONLY', forbiddenAdmin.status === 403 && forbiddenAdmin.body.errorCode === 'FORBIDDEN_ADMIN_ONLY');

    // Test Admin allowed access to Admin API
    const adminAccess = await request('/api/v1/admin/users', {
        headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert('Admin user granted access to Admin API', adminAccess.status === 200 && adminAccess.body.success);

    // 3. User Data Isolation & Protected Field Tampering
    console.log('\n--- 3. User Data Isolation & Protected Fields ---');
    // Normal user trying to elevate privileges or tamper with protected fields
    const tamperAttempt = await request('/api/v1/user/profile', {
        method: 'PUT',
        headers: { Authorization: `Bearer ${userToken}` },
        body: {
            name: 'Security Test User',
            role: 'admin',          // should be ignored / forbidden from mutating
            isActive: false,        // should be ignored
            isVerified: true,       // should be ignored
            mobile: '+910000000000' // should be ignored
        }
    });
    assert('User profile update returns 200', tamperAttempt.status === 200);
    assert('User role remained "user" (privilege escalation prevented)', tamperAttempt.body.data.role === 'user');
    assert('User mobile remained unchanged (+919876543210)', tamperAttempt.body.data.mobile === '+919876543210');

    // 4. Invalid MongoDB ObjectId Handling (CastError)
    console.log('\n--- 4. Invalid ObjectId Handling ---');
    const invalidPoster = await request('/api/v1/posters/invalid_object_id_123');
    assert('Invalid poster ID returns 400 INVALID_ID', invalidPoster.status === 400 && invalidPoster.body.errorCode === 'INVALID_ID');

    const invalidCategory = await request('/api/v1/admin/categories/not-a-mongo-id', {
        headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert('Invalid category ID returns 400 INVALID_ID', invalidCategory.status === 400 && invalidCategory.body.errorCode === 'INVALID_ID');

    // 5. NoSQL / Regex Injection & ReDoS Protection
    console.log('\n--- 5. Regex Injection & Special Character Sanitization ---');
    const regexPayloads = ['[a-z', '.*', '(?=a)', '(a+)+$', '^$$$'];
    let allRegexSafe = true;

    for (const payload of regexPayloads) {
        const resPosters = await request(`/api/v1/posters?search=${encodeURIComponent(payload)}`);
        const resAdminUsers = await request(`/api/v1/admin/users?search=${encodeURIComponent(payload)}`, {
            headers: { Authorization: `Bearer ${adminToken}` },
        });
        const resAdminSupport = await request(`/api/v1/admin/support?search=${encodeURIComponent(payload)}`, {
            headers: { Authorization: `Bearer ${adminToken}` },
        });

        if (resPosters.status !== 200 || resAdminUsers.status !== 200 || resAdminSupport.status !== 200) {
            allRegexSafe = false;
        }
    }
    assert('Regex search payloads safely sanitized without ReDoS or 500 crashes', allRegexSafe);

    // 6. Malformed JSON Body Handling
    console.log('\n--- 6. Malformed JSON Body Handling ---');
    const badJson = await request('/api/v1/auth/verify-otp', {
        method: 'POST',
        body: '{"mobile": "+919988776655", "otp": 123456', // missing closing brace
    });
    assert('Malformed JSON payload returns 400 with INVALID_JSON error code', badJson.status === 400 && badJson.body.errorCode === 'INVALID_JSON');

    // 7. Undefined Routes (404)
    console.log('\n--- 7. Undefined Route 404 Handling ---');
    const notFound = await request('/api/v1/non-existent-endpoint');
    assert('Undefined route returns 404 NOT_FOUND', notFound.status === 404 && notFound.body.errorCode === 'NOT_FOUND');

    console.log('\n====================================================');
    console.log(`TEST SUMMARY: ${passed} Passed, ${failed} Failed`);
    console.log('====================================================');

    await mongoose.disconnect();
    process.exit(failed > 0 ? 1 : 0);
}

runSecurityTests().catch(async (err) => {
    console.error('Test execution failed:', err);
    try { await mongoose.disconnect(); } catch (e) {}
    process.exit(1);
});
