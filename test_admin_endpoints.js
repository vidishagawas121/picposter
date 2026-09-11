const http = require('http');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();
const connectDB = require('./src/config/db');
const OtpVerification = require('./src/models/OtpVerification');

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

const runAdminTests = async () => {
    await connectDB();
    console.log('====================================================');
    console.log('🛡️ Starting PicPoster Owner/Admin API Test Suite');
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
        // 1. Health check
        const health = await request('/api/v1/health');
        assert(health.status === 200 && health.data.success === true, '1. Health Check GET /api/v1/health', JSON.stringify(health.data));

        // 2. Authenticate Admin User (+919876543210)
        const adminMobile = '+919876543210';
        const salt = await bcrypt.genSalt(10);
        const testOtpHash = await bcrypt.hash('123456', salt);

        await request('/api/v1/auth/send-otp', 'POST', { mobile: adminMobile });
        await OtpVerification.findOneAndUpdate(
            { mobile: adminMobile },
            { otpHash: testOtpHash, isUsed: false, expiresAt: new Date(Date.now() + 300000), attempts: 0 }
        );

        const adminVerifyRes = await request('/api/v1/auth/verify-otp', 'POST', {
            mobile: adminMobile,
            otp: '123456',
            deviceId: 'admin_test_dev',
            platform: 'web',
        });
        assert(adminVerifyRes.status === 200 && adminVerifyRes.data.data.tokens, '3. Verify OTP for Admin', JSON.stringify(adminVerifyRes.data));
        const adminToken = adminVerifyRes.data.data.tokens.accessToken;
        const adminUser = adminVerifyRes.data.data.user;

        // Ensure user is admin (promote if needed for test isolation)
        if (adminUser.role !== 'admin') {
            const User = require('./src/models/User');
            await User.findByIdAndUpdate(adminUser._id || adminUser.id, { role: 'admin' });
        }

        // 3. Authenticate Regular User (+919988776655)
        const userMobile = '+919988776655';
        await request('/api/v1/auth/send-otp', 'POST', { mobile: userMobile });
        await OtpVerification.findOneAndUpdate(
            { mobile: userMobile },
            { otpHash: testOtpHash, isUsed: false, expiresAt: new Date(Date.now() + 300000), attempts: 0 }
        );
        const userVerifyRes = await request('/api/v1/auth/verify-otp', 'POST', {
            mobile: userMobile,
            otp: '123456',
            deviceId: 'regular_user_dev',
            platform: 'android',
        });
        const userToken = userVerifyRes.data.data.tokens.accessToken;

        // 4. RBAC Access Control Tests
        // 4.1 No Token -> 401 Unauthorized
        const noAuthRes = await request('/api/v1/admin/analytics/overview', 'GET');
        assert(noAuthRes.status === 401, '4. RBAC: No token returns 401 Unauthorized', JSON.stringify(noAuthRes.data));

        // 4.2 User Token -> 403 Forbidden
        const userForbiddenRes = await request('/api/v1/admin/analytics/overview', 'GET', null, userToken);
        assert(userForbiddenRes.status === 403 && userForbiddenRes.data.errorCode === 'FORBIDDEN_ADMIN_ONLY', '5. RBAC: Regular user receives 403 FORBIDDEN_ADMIN_ONLY', JSON.stringify(userForbiddenRes.data));

        // 4.3 Admin Token -> 200 OK
        const adminAllowedRes = await request('/api/v1/admin/analytics/overview', 'GET', null, adminToken);
        assert(adminAllowedRes.status === 200 && adminAllowedRes.data.success === true, '6. RBAC: Admin receives 200 OK on /admin/analytics/overview', JSON.stringify(adminAllowedRes.data));

        // 5. Analytics APIs
        // 5.1 Overview
        assert(adminAllowedRes.data.data.totalPosters !== undefined, '7. Analytics: Overview metrics present', JSON.stringify(adminAllowedRes.data.data));

        // 5.2 User Growth
        const growthRes = await request('/api/v1/admin/analytics/users/growth?days=30', 'GET', null, adminToken);
        assert(growthRes.status === 200 && Array.isArray(growthRes.data.data), '8. Analytics: User growth trend', JSON.stringify(growthRes.data));

        // 5.3 Top Posters
        const topPostersRes = await request('/api/v1/admin/analytics/posters/top?limit=5', 'GET', null, adminToken);
        assert(topPostersRes.status === 200 && Array.isArray(topPostersRes.data.data), '9. Analytics: Top posters list', JSON.stringify(topPostersRes.data));

        // 5.4 Category Distribution
        const catDistRes = await request('/api/v1/admin/analytics/categories/distribution', 'GET', null, adminToken);
        assert(catDistRes.status === 200 && Array.isArray(catDistRes.data.data), '10. Analytics: Category distribution', JSON.stringify(catDistRes.data));

        // 5.5 Language Distribution
        const langDistRes = await request('/api/v1/admin/analytics/languages/distribution', 'GET', null, adminToken);
        assert(langDistRes.status === 200 && Array.isArray(langDistRes.data.data), '11. Analytics: Language distribution', JSON.stringify(langDistRes.data));

        // 6. Poster Management CRUD
        // 6.1 Poster Stats
        const posterStatsRes = await request('/api/v1/admin/posters/stats', 'GET', null, adminToken);
        assert(posterStatsRes.status === 200 && posterStatsRes.data.data.total !== undefined, '12. Posters: Stats endpoint GET /posters/stats', JSON.stringify(posterStatsRes.data));

        // 6.2 Poster List
        const posterListRes = await request('/api/v1/admin/posters?page=1&limit=10', 'GET', null, adminToken);
        assert(posterListRes.status === 200 && Array.isArray(posterListRes.data.data), '13. Posters: Paginated list GET /posters', JSON.stringify(posterListRes.data));

        // 6.3 Create Poster
        const newPosterPayload = {
            title: 'Test Admin Banner 2026',
            category: 'business',
            language: 'English',
            tags: ['test', 'promo', 'admin'],
            aspectRatio: '1:1',
            isTrending: true,
            isPremium: false,
            imageUrl: 'https://images.unsplash.com/photo-1556742049-0a67e5572263?w=800',
        };
        const createPosterRes = await request('/api/v1/admin/posters', 'POST', newPosterPayload, adminToken);
        assert(createPosterRes.status === 201 && createPosterRes.data.data.title === 'Test Admin Banner 2026', '14. Posters: Create poster POST /posters', JSON.stringify(createPosterRes.data));
        const createdPosterId = createPosterRes.data.data._id || createPosterRes.data.data.id;

        // 6.4 Get Single Poster
        const getSinglePosterRes = await request(`/api/v1/admin/posters/${createdPosterId}`, 'GET', null, adminToken);
        assert(getSinglePosterRes.status === 200 && getSinglePosterRes.data.data._id === createdPosterId, '15. Posters: Get single poster GET /posters/:id', JSON.stringify(getSinglePosterRes.data));

        // 6.5 Update Poster
        const updatePosterRes = await request(`/api/v1/admin/posters/${createdPosterId}`, 'PUT', {
            title: 'Updated Test Banner 2026',
            isTrending: false,
        }, adminToken);
        assert(updatePosterRes.status === 200 && updatePosterRes.data.data.title === 'Updated Test Banner 2026', '16. Posters: Update poster PUT /posters/:id', JSON.stringify(updatePosterRes.data));

        // 6.6 Toggle Poster Status
        const togglePosterStatusRes = await request(`/api/v1/admin/posters/${createdPosterId}/status`, 'PATCH', {
            isActive: false,
        }, adminToken);
        assert(togglePosterStatusRes.status === 200 && togglePosterStatusRes.data.data.isActive === false, '17. Posters: Toggle status PATCH /posters/:id/status', JSON.stringify(togglePosterStatusRes.data));

        // 6.7 Delete Poster
        const deletePosterRes = await request(`/api/v1/admin/posters/${createdPosterId}`, 'DELETE', null, adminToken);
        assert(deletePosterRes.status === 200 && deletePosterRes.data.success === true, '18. Posters: Delete poster DELETE /posters/:id', JSON.stringify(deletePosterRes.data));

        // 7. Category Management CRUD
        // 7.1 List Categories (with poster count)
        const catListRes = await request('/api/v1/admin/categories', 'GET', null, adminToken);
        assert(catListRes.status === 200 && Array.isArray(catListRes.data.data) && catListRes.data.data[0].posterCount !== undefined, '19. Categories: List with posterCount GET /categories', JSON.stringify(catListRes.data));

        // 7.2 Create Category
        const newCatPayload = {
            name: 'Test Innovation Category',
            slug: 'test-innovation-cat',
            sortOrder: 99,
            isActive: true,
        };
        const createCatRes = await request('/api/v1/admin/categories', 'POST', newCatPayload, adminToken);
        assert(createCatRes.status === 201 && createCatRes.data.data.slug === 'test-innovation-cat', '20. Categories: Create category POST /categories', JSON.stringify(createCatRes.data));
        const createdCatId = createCatRes.data.data._id || createCatRes.data.data.id;

        // 7.3 Get Single Category
        const getSingleCatRes = await request(`/api/v1/admin/categories/${createdCatId}`, 'GET', null, adminToken);
        assert(getSingleCatRes.status === 200 && getSingleCatRes.data.data.name === 'Test Innovation Category', '21. Categories: Get single category GET /categories/:id', JSON.stringify(getSingleCatRes.data));

        // 7.4 Update Category
        const updateCatRes = await request(`/api/v1/admin/categories/${createdCatId}`, 'PUT', {
            name: 'Updated Innovation Category',
        }, adminToken);
        assert(updateCatRes.status === 200 && updateCatRes.data.data.name === 'Updated Innovation Category', '22. Categories: Update category PUT /categories/:id', JSON.stringify(updateCatRes.data));

        // 7.5 Toggle Category Status
        const toggleCatStatusRes = await request(`/api/v1/admin/categories/${createdCatId}/status`, 'PATCH', {
            isActive: false,
        }, adminToken);
        assert(toggleCatStatusRes.status === 200 && toggleCatStatusRes.data.data.isActive === false, '23. Categories: Toggle status PATCH /categories/:id/status', JSON.stringify(toggleCatStatusRes.data));

        // 7.6 Reorder Categories
        const reorderRes = await request('/api/v1/admin/categories/reorder', 'PATCH', {
            items: [createdCatId],
        }, adminToken);
        assert(reorderRes.status === 200 && reorderRes.data.success === true, '24. Categories: Reorder PATCH /categories/reorder', JSON.stringify(reorderRes.data));

        // 7.7 Delete Category
        const deleteCatRes = await request(`/api/v1/admin/categories/${createdCatId}`, 'DELETE', null, adminToken);
        assert(deleteCatRes.status === 200 && deleteCatRes.data.success === true, '25. Categories: Delete category DELETE /categories/:id', JSON.stringify(deleteCatRes.data));

        // 8. User Management APIs
        // 8.1 List Users
        const userListRes = await request('/api/v1/admin/users?page=1&limit=10', 'GET', null, adminToken);
        assert(userListRes.status === 200 && Array.isArray(userListRes.data.data) && userListRes.data.data.length > 0, '26. Users: List users GET /users', JSON.stringify(userListRes.data));

        const testTargetUserId = userListRes.data.data.find((u) => u.role === 'user')?._id || userListRes.data.data[0]._id;

        // 8.2 Get User Details with Business Profile
        const userDetailRes = await request(`/api/v1/admin/users/${testTargetUserId}`, 'GET', null, adminToken);
        assert(userDetailRes.status === 200 && userDetailRes.data.data.user, '27. Users: Get user details + business profile GET /users/:id', JSON.stringify(userDetailRes.data));

        // 8.3 Toggle User Status
        const toggleUserStatusRes = await request(`/api/v1/admin/users/${testTargetUserId}/status`, 'PATCH', {
            isActive: true,
        }, adminToken);
        assert(toggleUserStatusRes.status === 200, '28. Users: Toggle active status PATCH /users/:id/status', JSON.stringify(toggleUserStatusRes.data));

        // 8.4 User Creations
        const userCreationsRes = await request(`/api/v1/admin/users/${testTargetUserId}/creations`, 'GET', null, adminToken);
        assert(userCreationsRes.status === 200 && Array.isArray(userCreationsRes.data.data), '29. Users: Get creations GET /users/:id/creations', JSON.stringify(userCreationsRes.data));

        // 9. Support Management APIs
        // 9.1 List Support Queries
        const supportListRes = await request('/api/v1/admin/support?page=1&limit=10', 'GET', null, adminToken);
        assert(supportListRes.status === 200 && Array.isArray(supportListRes.data.data), '30. Support: List queries GET /support', JSON.stringify(supportListRes.data));

        if (supportListRes.data.data.length > 0) {
            const firstQueryId = supportListRes.data.data[0]._id;

            // 9.2 Get Single Query
            const singleQueryRes = await request(`/api/v1/admin/support/${firstQueryId}`, 'GET', null, adminToken);
            assert(singleQueryRes.status === 200 && singleQueryRes.data.data._id === firstQueryId, '31. Support: Get single query GET /support/:id', JSON.stringify(singleQueryRes.data));

            // 9.3 Update Status
            const updateStatusRes = await request(`/api/v1/admin/support/${firstQueryId}/status`, 'PATCH', {
                status: 'RESOLVED',
            }, adminToken);
            assert(updateStatusRes.status === 200 && updateStatusRes.data.success === true, '32. Support: Update status PATCH /support/:id/status', JSON.stringify(updateStatusRes.data));
        }

        console.log('\n====================================================');
        console.log(`Summary: ${passed} Passed, ${failed} Failed`);
        console.log('====================================================\n');

        if (failed === 0) {
            console.log('🎉 ALL OWNER/ADMIN BACKEND APIS VERIFIED AND WORKING PERFECTLY!');
            await mongoose.disconnect();
            process.exit(0);
        } else {
            console.error('⚠️ Some admin tests failed.');
            await mongoose.disconnect();
            process.exit(1);
        }
    } catch (err) {
        console.error('Admin test execution error:', err);
        try { await mongoose.disconnect(); } catch (e) {}
        process.exit(1);
    }
};

runAdminTests();
