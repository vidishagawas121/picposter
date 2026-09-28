const path = require('path');
const dotenv = require('dotenv');

// Resilient .env loading (supports running from root, backend/, or system env)
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const dns = require('dns');
const dnsServers = process.env.DNS_SERVERS
    ? process.env.DNS_SERVERS.split(',').map((s) => s.trim()).filter(Boolean)
    : ['8.8.8.8', '1.1.1.1'];
dns.setServers(dnsServers);

const mongoose = require('mongoose');
const app = require('./app');
const connectDB = require('./config/db');
const validateEnv = require('./utils/envValidator');

// Validate environment variables on startup
validateEnv();

const PORT = parseInt(process.env.PORT, 10) || 5000;
let server;

const startServer = async () => {
    try {
        await connectDB();

        server = app.listen(PORT, '0.0.0.0', () => {
            console.log(`\n╔══════════════════════════════════════════════════════════════╗`);
            console.log(`║  🚀 PicPoster API Server Running                             ║`);
            console.log(`║  • Port:        ${PORT.toString().padEnd(45)}║`);
            console.log(`║  • Environment: ${(process.env.NODE_ENV || 'development').padEnd(45)}║`);
            console.log(`║  • Health:      http://localhost:${PORT}/health${' '.repeat(Math.max(0, 29 - PORT.toString().length))}║`);
            console.log(`╚══════════════════════════════════════════════════════════════╝\n`);
        });

        // Configure Keep-Alive timeouts for optimal Nginx / ALB reverse-proxy integration
        // (Ensures Node keepalive is longer than Nginx upstream keepalive to prevent 502s)
        server.keepAliveTimeout = 65000;
        server.headersTimeout = 66000;

    } catch (error) {
        console.error('❌ Server startup failed:', error.message);
        process.exit(1);
    }
};

// Graceful shutdown handling for process managers (PM2 / Docker / systemd / Kubernetes)
const handleShutdown = async (signal) => {
    console.log(`\n🛑 ${signal} received. Initiating graceful shutdown...`);
    if (server) {
        server.close(async () => {
            console.log('✅ HTTP server closed. No longer accepting new requests.');
            try {
                await mongoose.connection.close(false);
                console.log('✅ MongoDB connection closed.');
                process.exit(0);
            } catch (err) {
                console.error('❌ Error closing MongoDB connection:', err.message);
                process.exit(1);
            }
        });

        // Force shutdown after 10s if connections hang
        setTimeout(() => {
            console.error('⚠️  Forced shutdown due to timeout.');
            process.exit(1);
        }, 10000).unref();
    } else {
        process.exit(0);
    }
};

process.on('SIGTERM', () => handleShutdown('SIGTERM'));
process.on('SIGINT', () => handleShutdown('SIGINT'));

process.on('unhandledRejection', (err) => {
    console.error('❌ Unhandled Promise Rejection:', err);
});

process.on('uncaughtException', (err) => {
    console.error('❌ Uncaught Exception:', err);
    handleShutdown('UNCAUGHT_EXCEPTION');
});

startServer();