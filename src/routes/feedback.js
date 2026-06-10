console.log("hello world");

const express = require("express");
const fs = require("fs/promises");
const path = require("path");
const rateLimit = require("express-rate-limit");
const { feedbackBodySchema } = require("../schemas/feedback");
const { ERROR_CODES } = require("../utils/errors");

const feedbackViewPath = path.join(__dirname, "..", "views", "feedback.html");

function createFeedbackRouter(feedbackStore) {
  const router = express.Router();

  const submitLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (_req, res) => {
      res.status(429).json({
        error: ERROR_CODES.RATE_LIMIT_EXCEEDED,
        message: "Too many feedback submissions. Please try again later.",
      });
    },
  });

  router.get("/", async (_req, res, next) => {
    try {
      const html = await fs.readFile(feedbackViewPath, "utf8");
      res.type("html").send(html);
    } catch (error) {
      next(error);
    }
  });

  router.post("/", submitLimiter, async (req, res, next) => {
    try {
      const feedback = feedbackBodySchema.parse(req.body);
      const entry = await feedbackStore.append({
        ...feedback,
        userAgent: req.get("user-agent") || null,
        ip: req.ip,
      });

      res.status(201).json({
        message: "Feedback submitted successfully",
        id: entry.id,
        submittedAt: entry.submittedAt,
      });
    } catch (error) {
      next(error);
    }
  });

  return router;
}

module.exports = { createFeedbackRouter };
