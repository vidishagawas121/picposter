require('dotenv').config();
const mongoose = require('mongoose');
const Category = require('../models/Category');
const Poster = require('../models/Poster');

const categories = [
    { name: 'Festival', slug: 'festival', iconUrl: 'https://cdn-icons-png.flaticon.com/512/3655/3655581.png', sortOrder: 1 },
    { name: 'Business', slug: 'business', iconUrl: 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png', sortOrder: 2 },
    { name: 'Motivational', slug: 'motivational', iconUrl: 'https://cdn-icons-png.flaticon.com/512/1534/1534959.png', sortOrder: 3 },
    { name: 'Daily Quotes', slug: 'daily-quotes', iconUrl: 'https://cdn-icons-png.flaticon.com/512/2910/2910791.png', sortOrder: 4 },
    { name: 'Greetings', slug: 'greetings', iconUrl: 'https://cdn-icons-png.flaticon.com/512/3063/3063822.png', sortOrder: 5 },
    { name: 'Devotional', slug: 'devotional', iconUrl: 'https://cdn-icons-png.flaticon.com/512/3850/3850383.png', sortOrder: 6 },
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
        downloadsCount: 154,
        sharesCount: 88,
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
        downloadsCount: 420,
        sharesCount: 210,
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
        downloadsCount: 95,
        sharesCount: 42,
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
        downloadsCount: 310,
        sharesCount: 160,
    },
];

const seedDatabase = async () => {
    try {
        const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/picposter_db';
        await mongoose.connect(mongoUri);
        console.log('Connected to MongoDB for seeding...');

        for (const cat of categories) {
            await Category.findOneAndUpdate({ slug: cat.slug }, cat, { upsert: true, returnDocument: 'after' });
        }
        console.log(`Seeded ${categories.length} categories.`);

        for (const post of posters) {
            await Poster.findOneAndUpdate({ title: post.title }, post, { upsert: true, returnDocument: 'after' });
        }
        console.log(`Seeded ${posters.length} posters.`);

        console.log('Database seeded successfully!');
        process.exit(0);
    } catch (error) {
        console.error('Seeding failed:', error.message);
        process.exit(1);
    }
};

if (require.main === module) {
    seedDatabase();
}

module.exports = seedDatabase;
