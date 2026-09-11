const dns = require("dns");
dns.setServers(["8.8.8.8", "1.1.1.1"]);

require("dotenv").config();

// Validate environment variables before anything else
const validateEnv = require("./utils/envValidator");
validateEnv();

const app = require("./app");
const connectDB = require("./config/db");

const PORT = process.env.PORT || 5000;

const startServer = async () => {
    try {
        await connectDB();

        const server = app.listen(PORT, '0.0.0.0', () => {
            console.log(`✅ PicPoster Backend running on http://0.0.0.0:${PORT}`);
            console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
        });

        // Graceful shutdown on unhandled promise rejections
        process.on('unhandledRejection', (reason, promise) => {
            console.error('⚠️  Unhandled Promise Rejection:', reason);
            if (process.env.NODE_ENV === 'production') {
                // In production, close server gracefully then exit
                server.close(() => {
                    console.error('💀 Server shutting down due to unhandled rejection.');
                    process.exit(1);
                });
            }
        });

        // Catch uncaught synchronous exceptions
        process.on('uncaughtException', (err) => {
            console.error('💥 Uncaught Exception:', err);
            // Always exit on uncaught exceptions — the process is in an undefined state
            server.close(() => {
                process.exit(1);
            });
            // Force exit if server.close hangs
            setTimeout(() => process.exit(1), 5000);
        });

        // Graceful shutdown on SIGTERM (e.g., from Docker/Kubernetes)
        process.on('SIGTERM', () => {
            console.log('🛑 SIGTERM received. Shutting down gracefully...');
            server.close(() => {
                console.log('Server closed.');
                process.exit(0);
            });
        });

    } catch (error) {
        console.error("Server startup failed:", error.message);
        process.exit(1);
    }
};

startServer();