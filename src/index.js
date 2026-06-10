console.log("hello world");

require("dotenv").config();

const { loadEnv } = require("./config/env");
const { createApp } = require("./app");
const { CacheService } = require("./services/cache");
const { GeocodingService } = require("./services/geocoding");
const { OpenWeatherService } = require("./services/openWeather");
const { WeatherService } = require("./services/weatherService");

const config = loadEnv();

const cache = new CacheService({
  redisUrl: config.REDIS_URL,
  ttlSeconds: config.CACHE_TTL_SECONDS,
});

const geocoding = new GeocodingService(config.OPENWEATHER_API_KEY, cache);
const openWeather = new OpenWeatherService(config.OPENWEATHER_API_KEY, cache);
const weatherService = new WeatherService(geocoding, openWeather);

const app = createApp({ weatherService, config });

const server = app.listen(config.PORT, () => {
  console.log(`Weather Agent API running on port ${config.PORT}`);
  console.log(`Swagger docs available at http://localhost:${config.PORT}/docs`);
});

function shutdown(signal) {
  console.log(`Received ${signal}, shutting down gracefully...`);
  server.close(async () => {
    await cache.close();
    process.exit(0);
  });
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
