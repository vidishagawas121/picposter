const http = require('http');
const sharp = require('sharp');
const mongoose = require('mongoose');
const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);
require('dotenv').config();

const BASE_URL = 'http://127.0.0.1:5000';
const Poster = require('./src/models/Poster');
const Category = require('./src/models/Category');
const app = require('./src/app');
const connectDB = require('./src/config/db');

async function createMultipartBody(fields, files, boundary) {
    const CRLF = '\r\n';
    const chunks = [];

    // Append text fields
    for (const [key, value] of Object.entries(fields)) {
        chunks.push(Buffer.from(`--${boundary}${CRLF}Content-Disposition: form-data; name="${key}"${CRLF}${CRLF}${value}${CRLF}`));
    }

    // Append files
    for (const file of files) {
        chunks.push(Buffer.from(`--${boundary}${CRLF}Content-Disposition: form-data; name="${file.fieldname}"; filename="${file.filename}"${CRLF}Content-Type: ${file.contentType}${CRLF}${CRLF}`));
        chunks.push(file.buffer);
        chunks.push(Buffer.from(CRLF));
    }

    // Final boundary
    chunks.push(Buffer.from(`--${boundary}--${CRLF}`));

    return Buffer.concat(chunks);
}

const jwt = require('jsonwebtoken');
const User = require('./src/models/User');

function sendMultipart(path, bodyBuffer, boundary, token = null) {
    return new Promise((resolve, reject) => {
        const url = new URL(`${BASE_URL}${path}`);
        const headers = {
            'Content-Type': `multipart/form-data; boundary=${boundary}`,
            'Content-Length': bodyBuffer.length,
        };
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        const options = {
            hostname: url.hostname,
            port: url.port,
            path: url.pathname + url.search,
            method: 'POST',
            headers,
        };

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => { data += chunk; });
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
        req.write(bodyBuffer);
        req.end();
    });
}

async function runBulkUploadTest() {
    console.log('🚀 Starting Bulk Poster Upload Integration Test...\n');
    await connectDB();

    let server;
    try {
        server = await new Promise((resolve) => {
            const s = app.listen(5000, () => resolve(s));
        });
    } catch (e) {
        // already running
    }

    try {
        // Find or create admin user
        let adminUser = await User.findOne({ role: 'admin' });
        if (!adminUser) {
            adminUser = await User.create({
                mobile: '+919876543210',
                name: 'Admin Test User',
                role: 'admin',
                isActive: true,
            });
        }

        const secret = process.env.JWT_ACCESS_SECRET || 'picposter_super_secret_jwt_access_key_2026';
        const adminToken = jwt.sign({ userId: adminUser._id }, secret, { expiresIn: '1h' });
        // Ensure test category exists
        let testCat = await Category.findOne({ slug: 'festival' });
        if (!testCat) {
            testCat = await Category.create({ name: 'Festival', slug: 'festival', sortOrder: 1 });
        }

        // Generate 3 sample test image buffers with different colors
        const image1Buffer = await sharp({
            create: { width: 400, height: 400, channels: 4, background: { r: 255, g: 100, b: 50, alpha: 1 } },
        }).png().toBuffer();

        const image2Buffer = await sharp({
            create: { width: 400, height: 400, channels: 4, background: { r: 50, g: 150, b: 255, alpha: 1 } },
        }).png().toBuffer();

        const image3Buffer = await sharp({
            create: { width: 400, height: 400, channels: 4, background: { r: 50, g: 220, b: 100, alpha: 1 } },
        }).jpeg().toBuffer();

        const boundary = '----WebKitFormBoundary' + Math.random().toString(36).substring(2);

        const fields = {
            category: 'festival',
            language: 'Hindi',
            aspectRatio: '1:1',
            titlePrefix: 'Holi Special Poster',
            tags: 'holi, festival, colors, celebration',
            isTrending: 'true',
            isPremium: 'false',
            isActive: 'true',
        };

        const files = [
            { fieldname: 'images', filename: 'holi_celebration_1.png', contentType: 'image/png', buffer: image1Buffer },
            { fieldname: 'images', filename: 'holi_celebration_2.png', contentType: 'image/png', buffer: image2Buffer },
            { fieldname: 'images', filename: 'holi_celebration_3.jpg', contentType: 'image/jpeg', buffer: image3Buffer },
        ];

        const multipartBuffer = await createMultipartBody(fields, files, boundary);

        console.log('📤 Sending POST /api/v1/admin/posters/bulk with 3 poster images...');
        const res = await sendMultipart('/api/v1/admin/posters/bulk', multipartBuffer, boundary, adminToken);

        console.log('HTTP Status:', res.status);
        console.log('Response:', JSON.stringify(res.data, null, 2));

        if (res.status === 201 && res.data?.success) {
            console.log('\n✅ PASS: Bulk upload responded with 201 Created');
            const data = res.data.data;
            console.log(`✅ Success Count: ${data.successCount} / Total: ${data.total}`);

            if (data.successful && data.successful.length === 3) {
                console.log('✅ PASS: Exactly 3 separate Poster documents were created');
                for (let i = 0; i < data.successful.length; i++) {
                    const p = data.successful[i];
                    console.log(`   Poster ${i + 1}: Title="${p.title}", ID=${p._id || p.id}, ImageUrl=${p.imageUrl}, ThumbUrl=${p.thumbnailUrl}`);
                    
                    // Verify document is in MongoDB
                    const inDb = await Poster.findById(p._id || p.id);
                    if (inDb) {
                        console.log(`   -> Verified in MongoDB: "${inDb.title}" (Language: ${inDb.language}, Category: ${inDb.category})`);
                    } else {
                        console.error(`   ❌ FAIL: Poster ${p._id} not found in MongoDB`);
                    }
                }
            } else {
                console.error('❌ FAIL: Successful count mismatch');
            }
        } else {
            console.error('❌ FAIL: Bulk upload failed with response:', res);
        }

        // Test validation: Missing category
        console.log('\n🧪 Testing validation error when category is missing...');
        const invalidFields = { titlePrefix: 'No Category Test' };
        const invalidBuffer = await createMultipartBody(invalidFields, [files[0]], boundary);
        const resInvalid = await sendMultipart('/api/v1/admin/posters/bulk', invalidBuffer, boundary, adminToken);
        if (resInvalid.status === 400 && resInvalid.data?.success === false) {
            console.log('✅ PASS: Rejected with 400 when category is missing:', resInvalid.data.message);
        } else {
            console.error('❌ FAIL: Expected 400 for missing category, got:', resInvalid.status);
        }

        // Test validation: No files
        console.log('\n🧪 Testing validation error when no files uploaded...');
        const noFilesBuffer = await createMultipartBody({ category: 'festival' }, [], boundary);
        const resNoFiles = await sendMultipart('/api/v1/admin/posters/bulk', noFilesBuffer, boundary, adminToken);
        if (resNoFiles.status === 400 && resNoFiles.data?.success === false) {
            console.log('✅ PASS: Rejected with 400 when no files uploaded:', resNoFiles.data.message);
        } else {
            console.error('❌ FAIL: Expected 400 for empty files, got:', resNoFiles.status);
        }

        console.log('\n🎉 ALL BULK POSTER UPLOAD TESTS COMPLETED SUCCESSFULLY!\n');
    } catch (err) {
        console.error('Test error:', err);
    } finally {
        if (server) server.close();
        await mongoose.disconnect();
    }
}

runBulkUploadTest();
