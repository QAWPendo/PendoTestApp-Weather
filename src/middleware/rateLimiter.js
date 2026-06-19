console.log("hello world");

const rateLimit = require("express-rate-limit");
const { ERROR_CODES } = require("../utils/errors");
const { pendoTrack } = require("../services/pendoTracker");

function createRateLimiter({ max, windowMs }) {
  return rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      res.status(429).json({
        error: ERROR_CODES.RATE_LIMIT_EXCEEDED,
        message: `Rate limit exceeded. Maximum ${max} requests per ${windowMs / 1000} seconds.`,
      });

      try {
        pendoTrack("rate_limit_exceeded", req.ip, "system", {
          max_requests: max,
          window_seconds: windowMs / 1000,
          request_path: req.path,
          request_method: req.method,
        }, { ip: req.ip, url: req.originalUrl });
      } catch (_) { /* tracking must not affect rate limiting */ }
    },
  });
}

module.exports = { createRateLimiter };
