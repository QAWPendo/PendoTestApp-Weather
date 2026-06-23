console.log("hello world");

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

function createApp({ weatherService, config }) {
  const app = express();

  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://cdn.pendo.io", "https://pendo-static-6004025834569728.storage.googleapis.com"],
        connectSrc: ["'self'", "https://app.pendo.io", "https://us1.pendo.io"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://cdn.pendo.io", "https://pendo-static-6004025834569728.storage.googleapis.com"],
        imgSrc: ["'self'", "data:", "https://cdn.pendo.io", "https://pendo-static-6004025834569728.storage.googleapis.com", "https://app.pendo.io"],
        frameSrc: ["'self'", "https://app.pendo.io"],
        fontSrc: ["'self'", "https://cdn.pendo.io", "https://pendo-static-6004025834569728.storage.googleapis.com"],
      },
    },
  }));
  app.use(cors());
  app.use(express.json());
  app.use(morgan(config.NODE_ENV === "production" ? "combined" : "dev"));
  app.use(createRateLimiter({
    max: config.RATE_LIMIT_MAX,
    windowMs: config.RATE_LIMIT_WINDOW_MS,
  }));

  const openApiSpec = createOpenApiSpec();
  const swaggerOptions = {
    customSiteTitle: "Weather Agent API Docs",
  };
  if (config.PENDO_API_KEY) {
    swaggerOptions.customJsStr = `
      (function(apiKey) {
        (function(p,e,n,d,o){var v,w,x,y,z;o=p[d]=p[d]||{};o._q=o._q||[];
        v=['initialize','identify','updateOptions','pageLoad','track'];for(w=0,x=v.length;w<x;++w)(function(m){
        o[m]=o[m]||function(){o._q[m===v[0]?'unshift':'push']([m].concat([].slice.call(arguments,0)));};;})(v[w]);
        y=e.createElement(n);y.async=!0;y.src='https://cdn.pendo.io/agent/static/'+apiKey+'/pendo.js';
        z=e.getElementsByTagName(n)[0];z.parentNode.insertBefore(y,z);
        })(window,document,'script','pendo');
        var visitorId = localStorage.getItem('pendo_visitor_id');
        if (!visitorId) { visitorId = 'anon-' + crypto.randomUUID(); localStorage.setItem('pendo_visitor_id', visitorId); }
        pendo.initialize({ visitor: { id: visitorId }, account: { id: 'swagger-docs' } });
      })('${config.PENDO_API_KEY}');
    `;
  }
  app.use("/docs", swaggerUi.serve, swaggerUi.setup(openApiSpec, swaggerOptions));
  app.get("/openapi.json", (_req, res) => {
    res.json(openApiSpec);
  });

  app.use("/health", healthRouter);
  app.use("/weather", createWeatherRouter(weatherService));

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

module.exports = { createApp };
