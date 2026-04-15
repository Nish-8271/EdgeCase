const { rateLimit, ipKeyGenerator } = require('express-rate-limit');

// Rate limiter for AI features to prevent quota exhaustion
// Allows 5 requests per 1 hour window per IP/User
const aiRateLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 5, // Limit each IP or User to 5 requests per `window` (here, per hour)
    keyGenerator: (req, res) => {
        // Limit by user ID if logged in, otherwise fallback to IP address using official method
        return req.user ? req.user.uid : ipKeyGenerator(req, res);
    },
    message: {
        error: 'You have reached the limit of 5 AI actions per hour. Please try again later.'
    },
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

module.exports = aiRateLimiter;
