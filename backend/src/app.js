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
const { requestIdMiddleware, requestLogger } = require('./middlewares/requestLogger');
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

// Request ID & Logging
app.use(requestIdMiddleware);
app.use(requestLogger);

// Dynamic CORS configuration - supports CORS_ALLOWED_ORIGINS and CORS_ORIGIN
const corsEnv = process.env.CORS_ALLOWED_ORIGINS || process.env.CORS_ORIGIN || '*';
const allowedOrigins = corsEnv
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);

app.use(
    cors({
        origin: (origin, callback) => {
            // Allow requests with no origin (mobile apps, curl, server-to-server)
            if (!origin) return callback(null, true);
            // In development or wildcard, allow all
            if (process.env.NODE_ENV !== 'production' || allowedOrigins.includes('*')) {
                return callback(null, true);
            }
            if (allowedOrigins.includes(origin)) {
                return callback(null, true);
            }
            return callback(new AppError(`Origin ${origin} not allowed by CORS`, 403, 'CORS_NOT_ALLOWED'));
        },
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id'],
        credentials: true,
    })
);

// Body Parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static files (uploads) - disable directory listing
app.use(
    '/uploads',
    express.static(path.join(__dirname, '../uploads'), {
        dotfiles: 'deny',
        index: false,
    })
);

// General API rate limiter
app.use('/api/', apiLimiter);

// Health check endpoint (safe for production)
app.get('/api/v1/health', (req, res) => {
    const healthData = {
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
    };

    if (process.env.NODE_ENV !== 'production') {
        healthData.environment = process.env.NODE_ENV || 'development';
    }

    return sendSuccess(res, 200, 'PicPoster Backend is running smoothly', healthData);
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
