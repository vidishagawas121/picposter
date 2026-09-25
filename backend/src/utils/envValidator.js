/**
 * Environment Variable Validator
 * Runs at server startup to ensure all required configuration is present.
 * Fails fast with clear error messages if critical variables are missing.
 */

const REQUIRED_VARS = [
    { name: 'MONGO_URI', description: 'MongoDB connection string' },
    { name: 'JWT_ACCESS_SECRET', description: 'JWT access token signing secret', minLength: 32 },
    { name: 'JWT_REFRESH_SECRET', description: 'JWT refresh token signing secret', minLength: 32 },
];

const OPTIONAL_VARS = [
    { name: 'PORT', default: '5000' },
    { name: 'NODE_ENV', default: 'development' },
    { name: 'API_BASE_URL', default: 'http://localhost:5000' },
    { name: 'CORS_ALLOWED_ORIGINS', default: '*' },
    { name: 'SMS_PROVIDER', default: 'MOCK' },
    { name: 'SMS_API_KEY', default: '' },
    { name: 'SMS_SENDER_ID', default: 'PICPST' },
    { name: 'JWT_ACCESS_EXPIRY', default: '15m' },
    { name: 'JWT_REFRESH_EXPIRY', default: '30d' },
    { name: 'LOG_LEVEL', default: 'info' },
];

/**
 * Validates all required environment variables are present and valid.
 * @throws {Error} If any required variable is missing or invalid.
 */
const validateEnv = () => {
    const errors = [];

    for (const v of REQUIRED_VARS) {
        const value = process.env[v.name];

        if (!value || value.trim().length === 0) {
            errors.push(`  ✗ ${v.name} is required (${v.description})`);
            continue;
        }

        if (v.minLength && value.trim().length < v.minLength) {
            errors.push(
                `  ✗ ${v.name} must be at least ${v.minLength} characters for security (current: ${value.length})`
            );
        }
    }

    // Warn about known insecure defaults
    const accessSecret = process.env.JWT_ACCESS_SECRET || '';
    if (accessSecret.includes('picposter_super_secret')) {
        errors.push(
            `  ✗ JWT_ACCESS_SECRET is using the default insecure value. Generate a strong secret: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`
        );
    }

    const refreshSecret = process.env.JWT_REFRESH_SECRET || '';
    if (refreshSecret.includes('picposter_super_secret')) {
        errors.push(
            `  ✗ JWT_REFRESH_SECRET is using the default insecure value. Generate a strong secret: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`
        );
    }

    if (errors.length > 0) {
        const isProduction = process.env.NODE_ENV === 'production';

        console.error('\n╔══════════════════════════════════════════════════════╗');
        console.error('║       ENVIRONMENT CONFIGURATION ERRORS               ║');
        console.error('╚══════════════════════════════════════════════════════╝\n');
        errors.forEach((e) => console.error(e));
        console.error('');

        if (isProduction) {
            console.error('⛔ Cannot start in production mode with invalid configuration.');
            console.error('   Fix the above errors and restart.\n');
            process.exit(1);
        } else {
            console.warn('⚠️  Running in development mode with configuration warnings.');
            console.warn('   These MUST be fixed before deploying to production.\n');
        }
    }

    // Set defaults for optional vars
    for (const v of OPTIONAL_VARS) {
        if (!process.env[v.name]) {
            process.env[v.name] = v.default;
        }
    }
};

module.exports = validateEnv;
