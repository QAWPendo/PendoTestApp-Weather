console.log("hello world");

const rateLimit = require("express-rate-limit");
const { ERROR_CODES } = require("../utils/errors");

function createRateLimiter({ max, windowMs }) {
  return rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (_req, res) => {
      res.status(429).json({
        error: ERROR_CODES.RATE_LIMIT_EXCEEDED,
        message: `Rate limit exceeded. Maximum ${max} requests per ${windowMs / 1000} seconds.`,
      });
    },
  });
}

module.exports = { createRateLimiter };
