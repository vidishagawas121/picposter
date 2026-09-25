const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');

const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const businessRoutes = require('./routes/businessRoutes');
const posterRoutes = require('./routes/posterRoutes');
const supportRoutes = require('./routes/supportRoutes');
const adminRoutes = require('./routes/adminRoutes');

const { protect } = require('./middlewares/authMiddleware');
const adminGuard = require('./middlewares/adminGuard');
const { apiLimiter } = require('./middlewares/rateLimiter');
const errorHandler = require('./middlewares/errorHandler');
const AppError = require('./utils/appError');
const { sendSuccess } = require('./utils/apiResponse');

const app = express();

// Trust proxy behind Nginx/reverse proxy
if (process.env.TRUST_PROXY === '1' || process.env.TRUST_PROXY === 'true' || process.env.NODE_ENV === 'production') {
    app.set('trust proxy', 1);
}

// Security Headers
app.use(
    helmet({
        crossOriginResourcePolicy: { policy: 'cross-origin' },
    })
);

// Dynamic CORS configuration
const allowedOrigins = process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(',').map((origin) => origin.trim()).filter(Boolean)
    : '*';

app.use(
    cors({
        origin: (origin, callback) => {
            // Allow server-to-server, mobile app, curl (no origin header)
            if (!origin) return callback(null, true);
            if (allowedOrigins === '*' || allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
                return callback(null, true);
            }
            return callback(new AppError(`Origin ${origin} not allowed by CORS`, 403, 'CORS_NOT_ALLOWED'));
        },
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
        credentials: true,
    })
);

// Body Parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static files (uploads for avatar photos, business logos, posters)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// General API rate limiter
app.use('/api/', apiLimiter);

// Health check endpoint
app.get('/api/v1/health', (req, res) => {
    return sendSuccess(res, 200, 'PicPoster Backend is running smoothly', {
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
    });
});

// API Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/user', userRoutes);
app.use('/api/v1/business', businessRoutes);
app.use('/api/v1/posters', posterRoutes);
app.use('/api/v1/support', supportRoutes);

// Admin Routes (Protected by Auth & Admin RBAC)
app.use('/api/v1/admin', protect, adminGuard, adminRoutes);

// Catch-all for undefined routes
app.all(/(.*)/, (req, res, next) => {
    next(new AppError(`Endpoint not found: ${req.method} ${req.originalUrl}`, 404, 'NOT_FOUND'));
});

// Centralized error handling
app.use(errorHandler);

module.exports = app;