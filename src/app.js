const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');

const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const businessRoutes = require('./routes/businessRoutes');
const posterRoutes = require('./routes/posterRoutes');
const supportRoutes = require('./routes/supportRoutes');

const { apiLimiter } = require('./middlewares/rateLimiter');
const errorHandler = require('./middlewares/errorHandler');
const AppError = require('./utils/appError');
const { sendSuccess } = require('./utils/apiResponse');

const app = express();

// Security Headers
app.use(
    helmet({
        crossOriginResourcePolicy: { policy: 'cross-origin' },
    })
);

// CORS configuration
app.use(
    cors({
        origin: '*',
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
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

// Catch-all for undefined routes
app.all(/(.*)/, (req, res, next) => {
    next(new AppError(`Endpoint not found: ${req.method} ${req.originalUrl}`, 404, 'NOT_FOUND'));
});

// Centralized error handling
app.use(errorHandler);

module.exports = app;