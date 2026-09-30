const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);
require('dotenv').config();
const mongoose = require('mongoose');
const Category = require('../models/Category');
const Poster = require('../models/Poster');
const User = require('../models/User');
const SupportQuery = require('../models/SupportQuery');

const categories = [
    { name: 'Festival', slug: 'festival', iconUrl: 'https://cdn-icons-png.flaticon.com/512/3655/3655581.png', sortOrder: 1, isActive: true },
    { name: 'Business', slug: 'business', iconUrl: 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png', sortOrder: 2, isActive: true },
    { name: 'Motivational', slug: 'motivational', iconUrl: 'https://cdn-icons-png.flaticon.com/512/1534/1534959.png', sortOrder: 3, isActive: true },
    { name: 'Daily Quotes', slug: 'daily-quotes', iconUrl: 'https://cdn-icons-png.flaticon.com/512/2910/2910791.png', sortOrder: 4, isActive: true },
    { name: 'Greetings', slug: 'greetings', iconUrl: 'https://cdn-icons-png.flaticon.com/512/3063/3063822.png', sortOrder: 5, isActive: true },
    { name: 'Devotional', slug: 'devotional', iconUrl: 'https://cdn-icons-png.flaticon.com/512/3850/3850383.png', sortOrder: 6, isActive: true },
];

const posters = [
    {
        title: 'Grand Opening & Special Discount',
        category: 'business',
        language: 'English',
        imageUrl: 'https://images.unsplash.com/photo-1556742049-0a67e5572263?w=800&auto=format&fit=crop&q=80',
        thumbnailUrl: 'https://images.unsplash.com/photo-1556742049-0a67e5572263?w=300&auto=format&fit=crop&q=80',
        tags: ['sale', 'opening', 'business', 'discount', 'banner'],
        aspectRatio: '1:1',
        isTrending: true,
        isPremium: false,
        isActive: true,
        downloadsCount: 154,
        sharesCount: 88,
        viewsCount: 430,
    },
    {
        title: 'Diwali Festive Greetings',
        category: 'festival',
        language: 'Hindi',
        imageUrl: 'https://images.unsplash.com/photo-1512418490979-92798cec1380?w=800&auto=format&fit=crop&q=80',
        thumbnailUrl: 'https://images.unsplash.com/photo-1512418490979-92798cec1380?w=300&auto=format&fit=crop&q=80',
        tags: ['diwali', 'festival', 'deepavali', 'lights', 'celebration'],
        aspectRatio: '1:1',
        isTrending: true,
        isPremium: true,
        isActive: true,
        downloadsCount: 420,
        sharesCount: 210,
        viewsCount: 980,
    },
    {
        title: 'Success Mindset & Perseverance',
        category: 'motivational',
        language: 'English',
        imageUrl: 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=800&auto=format&fit=crop&q=80',
        thumbnailUrl: 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=300&auto=format&fit=crop&q=80',
        tags: ['quotes', 'motivation', 'success', 'growth', 'mindset'],
        aspectRatio: '1:1',
        isTrending: false,
        isPremium: false,
        isActive: true,
        downloadsCount: 95,
        sharesCount: 42,
        viewsCount: 260,
    },
    {
        title: 'Positive Morning Thoughts',
        category: 'daily-quotes',
        language: 'English',
        imageUrl: 'https://images.unsplash.com/photo-1470240731273-7821a6eeb6bd?w=800&auto=format&fit=crop&q=80',
        thumbnailUrl: 'https://images.unsplash.com/photo-1470240731273-7821a6eeb6bd?w=300&auto=format&fit=crop&q=80',
        tags: ['morning', 'positive', 'vibes', 'daily', 'quotes'],
        aspectRatio: '1:1',
        isTrending: true,
        isPremium: false,
        isActive: true,
        downloadsCount: 310,
        sharesCount: 160,
        viewsCount: 710,
    },
];

const seedDatabase = async () => {
    try {
        const mongoUri = process.env.MONGO_URI;
        if (!mongoUri) {
            console.error('❌ FATAL: MONGO_URI environment variable is missing.');
            process.exit(1);
        }
        await mongoose.connect(mongoUri);
        console.log('Connected to MongoDB for seeding...');

        const categoryMap = new Map();
        for (const cat of categories) {
            const saved = await Category.findOneAndUpdate({ slug: cat.slug }, cat, { upsert: true, returnDocument: 'after' });
            categoryMap.set(saved.slug, saved._id);
        }
        console.log(`Seeded ${categories.length} categories.`);

        for (const post of posters) {
            post.categoryId = categoryMap.get(post.category) || null;
            await Poster.findOneAndUpdate({ title: post.title }, post, { upsert: true, returnDocument: 'after' });
        }
        console.log(`Seeded ${posters.length} posters.`);

        // Seed Admin User
        const adminUser = await User.findOneAndUpdate(
            { mobile: '+919876543210' },
            {
                mobile: '+919876543210',
                name: 'Admin',
                username: 'admin',
                email: 'admin@picposter@gmail.com',
                role: 'admin',
                isVerified: true,
                isActive: true,
            },
            { upsert: true, returnDocument: 'after' }
        );
        console.log(`Seeded Admin user: ${adminUser.mobile} (Role: ${adminUser.role})`);

        // Seed Sample User
        const regularUser = await User.findOneAndUpdate(
            { mobile: '+919988776655' },
            {
                mobile: '+919988776655',
                name: 'Rohan Sharma',
                email: 'rohan@example.com',
                role: 'user',
                isVerified: true,
                isActive: true,
            },
            { upsert: true, returnDocument: 'after' }
        );
        console.log(`Seeded Regular user: ${regularUser.mobile} (Role: ${regularUser.role})`);

        // Seed Sample Support Queries
        const sampleQueries = [
            {
                name: 'Ananya Verma',
                contact: '+919876501234',
                query: 'How can I customize the Diwali poster with multiple logos?',
                userId: regularUser._id,
                status: 'pending',
            },
            {
                name: 'Vikram Singh',
                contact: 'vikram@business.in',
                query: 'Request for adding Marathi templates for Ganeshotsav.',
                userId: null,
                status: 'in_progress',
            },
            {
                name: 'Pooja Hegde',
                contact: '+919123456780',
                query: 'Billing query resolved regarding premium subscription.',
                userId: null,
                status: 'resolved',
            },
        ];

        for (const q of sampleQueries) {
            await SupportQuery.findOneAndUpdate(
                { query: q.query },
                q,
                { upsert: true, returnDocument: 'after' }
            );
        }
        console.log(`Seeded ${sampleQueries.length} support queries.`);

        console.log('Database seeded successfully!');
        if (require.main === module) {
            process.exit(0);
        }
    } catch (error) {
        console.error('Seeding failed:', error.message);
        if (require.main === module) {
            process.exit(1);
        }
    }
};

if (require.main === module) {
    seedDatabase();
}

module.exports = seedDatabase;
