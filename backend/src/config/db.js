const dns = require('dns');
const mongoose = require('mongoose');

// Configure fallback DNS servers for MongoDB Atlas SRV resolution
const dnsServers = process.env.DNS_SERVERS
    ? process.env.DNS_SERVERS.split(',').map((s) => s.trim()).filter(Boolean)
    : ['8.8.8.8', '1.1.1.1'];
dns.setServers(dnsServers);

const MAX_RETRIES = 5;
const RETRY_INTERVAL_MS = 3000;

// Setup Mongoose connection event listeners for production observability
mongoose.connection.on('connected', () => {
    console.log('✅ MongoDB connection established.');
});

mongoose.connection.on('error', (err) => {
    console.error('❌ MongoDB runtime error:', err.message);
});

mongoose.connection.on('disconnected', () => {
    console.warn('⚠️  MongoDB disconnected. Attempting automatic reconnection...');
});

mongoose.connection.on('reconnected', () => {
    console.log('🔄 MongoDB reconnected successfully.');
});

/**
 * Connect to MongoDB with retries and production connection pool settings
 * @param {number} retryCount
 * @returns {Promise<typeof mongoose>}
 */
const connectDB = async (retryCount = 0) => {
    const mongoUri = process.env.MONGO_URI;

    if (!mongoUri) {
        throw new Error('MONGO_URI environment variable is missing.');
    }

    const options = {
        maxPoolSize: parseInt(process.env.MONGO_MAX_POOL_SIZE, 10) || 50,
        minPoolSize: parseInt(process.env.MONGO_MIN_POOL_SIZE, 10) || 10,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
        autoIndex: process.env.NODE_ENV !== 'production', // Don't auto-build indexes in production to avoid perf impact
    };

    try {
        const conn = await mongoose.connect(mongoUri, options);
        console.log(`🚀 MongoDB connected: ${conn.connection.host} [DB: ${conn.connection.name}]`);
        return conn;
    } catch (error) {
        console.error(`❌ MongoDB connection attempt ${retryCount + 1}/${MAX_RETRIES} failed: ${error.message}`);
        if (retryCount < MAX_RETRIES - 1) {
            console.log(`⏳ Retrying MongoDB connection in ${RETRY_INTERVAL_MS / 1000}s...`);
            await new Promise((resolve) => setTimeout(resolve, RETRY_INTERVAL_MS));
            return connectDB(retryCount + 1);
        } else {
            console.error('⛔ Maximum MongoDB connection retries exceeded.');
            throw error;
        }
    }
};

module.exports = connectDB;