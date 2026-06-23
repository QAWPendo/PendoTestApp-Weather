console.log("hello world");

const rateLimit = require("express-rate-limit");
const { ERROR_CODES } = require("../utils/errors");
const pendoTracker = require("../services/pendoTracker");

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
      pendoTracker.track(req.ip, "", "rate_limit_exceeded", {
        request_path: req.path,
        request_method: req.method,
        max_requests: max,
        window_seconds: windowMs / 1000,
      });
    },
  });
}

module.exports = { createRateLimiter };
