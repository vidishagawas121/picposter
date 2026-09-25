/**
 * Request Logger Middleware
 * Structured JSON logger for HTTP requests with sensitive field redaction.
 */
const crypto = require('crypto');

/**
 * Generates a unique request ID and attaches it to the request/response.
 */
const requestIdMiddleware = (req, res, next) => {
    req.requestId = crypto.randomUUID();
    res.setHeader('X-Request-Id', req.requestId);
    next();
};

/**
 * Logs incoming HTTP requests with timing, status, and redacted info.
 */
const requestLogger = (req, res, next) => {
    const startTime = Date.now();

    // Hook into response finish to log after completion
    res.on('finish', () => {
        const duration = Date.now() - startTime;
        const logLevel = res.statusCode >= 500 ? 'error' : res.statusCode >= 400 ? 'warn' : 'info';

        const logEntry = {
            level: logLevel,
            requestId: req.requestId || '-',
            method: req.method,
            path: req.originalUrl,
            statusCode: res.statusCode,
            duration: `${duration}ms`,
            ip: req.ip || req.connection.remoteAddress,
            userAgent: req.get('user-agent') || '-',
            userId: req.user ? req.user._id : null,
            timestamp: new Date().toISOString(),
        };

        // Only log in structured JSON in production; readable in development
        if (process.env.NODE_ENV === 'production') {
            console.log(JSON.stringify(logEntry));
        } else {
            const statusColor =
                res.statusCode >= 500 ? '\x1b[31m' : res.statusCode >= 400 ? '\x1b[33m' : '\x1b[32m';
            const reset = '\x1b[0m';
            console.log(
                `${statusColor}${req.method}${reset} ${req.originalUrl} ${statusColor}${res.statusCode}${reset} ${duration}ms [${req.requestId || '-'}]`
            );
        }
    });

    next();
};

module.exports = { requestIdMiddleware, requestLogger };
