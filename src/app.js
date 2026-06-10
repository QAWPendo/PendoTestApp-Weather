console.log("hello world");

const path = require("path");
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const swaggerUi = require("swagger-ui-express");

const { createOpenApiSpec } = require("./schemas/openapi");
const { errorHandler, notFoundHandler } = require("./middleware/errorHandler");
const { createRateLimiter } = require("./middleware/rateLimiter");
const healthRouter = require("./routes/health");
const { createWeatherRouter } = require("./routes/weather");
const { createFeedbackRouter } = require("./routes/feedback");

function createApp({ weatherService, feedbackStore, config }) {
  const app = express();

  app.use(helmet());
  app.use(cors());
  app.use(express.json());
  app.use(express.static(path.join(__dirname, "..", "public")));
  app.use(morgan(config.NODE_ENV === "production" ? "combined" : "dev"));
  app.use(createRateLimiter({
    max: config.RATE_LIMIT_MAX,
    windowMs: config.RATE_LIMIT_WINDOW_MS,
  }));

  const openApiSpec = createOpenApiSpec();
  app.use("/docs", swaggerUi.serve, swaggerUi.setup(openApiSpec, {
    customSiteTitle: "Weather Agent API Docs",
  }));
  app.get("/openapi.json", (_req, res) => {
    res.json(openApiSpec);
  });

  app.use("/health", healthRouter);
  app.use("/weather", createWeatherRouter(weatherService));
  app.use("/feedback", createFeedbackRouter(feedbackStore));

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

module.exports = { createApp };
