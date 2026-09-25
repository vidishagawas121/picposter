require("dotenv").config();

const dns = require("dns");
const dnsServers = process.env.DNS_SERVERS
    ? process.env.DNS_SERVERS.split(",").map((s) => s.trim()).filter(Boolean)
    : ["8.8.8.8", "1.1.1.1"];
dns.setServers(dnsServers);

const mongoose = require("mongoose");
const app = require("./app");
const connectDB = require("./config/db");

const PORT = process.env.PORT || 5000;

// Production Environment Validation
if (process.env.NODE_ENV === "production") {
    const requiredEnv = ["MONGO_URI", "JWT_ACCESS_SECRET"];
    const missing = requiredEnv.filter((key) => !process.env[key]);
    if (missing.length > 0) {
        console.error(`❌ FATAL: Missing required production environment variables: ${missing.join(", ")}`);
        process.exit(1);
    }
}

let server;

const startServer = async () => {
    try {
        await connectDB();

        server = app.listen(PORT, "0.0.0.0", () => {
            console.log(`✅ PicPoster Backend running on port ${PORT} [${process.env.NODE_ENV || "development"}]`);
        });
    } catch (error) {
        console.error("Server startup failed:", error.message);
        process.exit(1);
    }
};

// Graceful shutdown handling for process managers (PM2 / Docker / systemd)
const handleShutdown = async (signal) => {
    console.log(`\n${signal} received. Initiating graceful shutdown...`);
    if (server) {
        server.close(async () => {
            console.log("HTTP server closed.");
            try {
                await mongoose.connection.close(false);
                console.log("MongoDB connection closed.");
                process.exit(0);
            } catch (err) {
                console.error("Error closing MongoDB connection:", err);
                process.exit(1);
            }
        });

        // Force shutdown after 10s if hanging
        setTimeout(() => {
            console.error("Forced shutdown due to timeout.");
            process.exit(1);
        }, 10000);
    } else {
        process.exit(0);
    }
};

process.on("SIGTERM", () => handleShutdown("SIGTERM"));
process.on("SIGINT", () => handleShutdown("SIGINT"));

process.on("unhandledRejection", (err) => {
    console.error("Unhandled Promise Rejection:", err);
});

process.on("uncaughtException", (err) => {
    console.error("Uncaught Exception:", err);
    handleShutdown("UNCAUGHT_EXCEPTION");
});

startServer();