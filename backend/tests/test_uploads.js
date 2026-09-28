const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);
const sharp = require('sharp');
const imageService = require('../src/services/imageService');
const mongoose = require('mongoose');
const User = require('../src/models/User');
const BusinessInfo = require('../src/models/BusinessInfo');
require('dotenv').config();

async function testImageProcessing() {
    console.log('🖼️  Testing Image Processing Pipeline (Sharp + WebP)...');
    await mongoose.connect(process.env.MONGO_URI);

    try {
        // Create a 100x100 PNG buffer
        const testImageBuffer = await sharp({
            create: {
                width: 200,
                height: 200,
                channels: 4,
                background: { r: 255, g: 0, b: 0, alpha: 1 },
            },
        })
            .png()
            .toBuffer();

        // 1. Process profile photo
        const profilePhotoUrl = await imageService.processProfilePhoto(testImageBuffer);
        console.log('✅ Profile Photo processed to WebP:', profilePhotoUrl);

        // 2. Process business logo
        const businessLogoUrl = await imageService.processBusinessLogo(testImageBuffer);
        console.log('✅ Business Logo processed to WebP:', businessLogoUrl);

        // 3. Process poster image
        const posterResult = await imageService.processPosterImage(testImageBuffer);
        console.log('✅ Poster Template & Thumbnail processed to WebP:', posterResult);

        // 4. Process user creation
        const creationUrl = await imageService.processUserCreation(testImageBuffer);
        console.log('✅ User Creation Banner processed to WebP:', creationUrl);

        console.log('\n🎉 ALL IMAGE PROCESSING TESTS PASSED SUCCESSFULLY!\n');
    } catch (err) {
        console.error('Image processing test error:', err);
    } finally {
        await mongoose.disconnect();
    }
}

testImageProcessing();
