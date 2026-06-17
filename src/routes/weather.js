console.log("hello world");

const express = require("express");
const { locationQuerySchema, parseLocation } = require("../schemas/location");
const { trackEvent } = require("../utils/pendoTrack");

function createWeatherRouter(weatherService) {
  const router = express.Router();

  router.get("/current", async (req, res, next) => {
    try {
      const { location } = locationQuerySchema.parse(req.query);
      const result = await weatherService.getCurrent(location);

      const parsed = parseLocation(location);
      trackEvent("weather_current_queried", {
        properties: {
          location,
          location_type: parsed.type,
          location_name: result.meta.location.name,
          country: result.meta.location.country || "",
          cached: result.meta.cached,
          data_quality: result.meta.quality,
        },
        context: {
          ip: req.ip,
          userAgent: req.get("user-agent") || "",
          url: req.originalUrl,
        },
      });

      res.json(result);
    } catch (err) {
      next(err);
    }
  });

  router.get("/hourly", async (req, res, next) => {
    try {
      const { location, hours } = locationQuerySchema.parse(req.query);
      const result = await weatherService.getHourly(location, hours);

      const parsed = parseLocation(location);
      trackEvent("weather_hourly_queried", {
        properties: {
          location,
          location_type: parsed.type,
          location_name: result.meta.location.name,
          country: result.meta.location.country || "",
          hours_requested: hours,
          hours_returned: result.hours,
          cached: result.meta.cached,
          data_quality: result.meta.quality,
        },
        context: {
          ip: req.ip,
          userAgent: req.get("user-agent") || "",
          url: req.originalUrl,
        },
      });

      res.json(result);
    } catch (err) {
      next(err);
    }
  });

  router.get("/forecast", async (req, res, next) => {
    try {
      const { location, days } = locationQuerySchema.parse(req.query);
      const result = await weatherService.getForecast(location, days);

      const parsed = parseLocation(location);
      trackEvent("weather_forecast_queried", {
        properties: {
          location,
          location_type: parsed.type,
          location_name: result.meta.location.name,
          country: result.meta.location.country || "",
          days_requested: days,
          days_returned: result.days,
          cached: result.meta.cached,
          data_quality: result.meta.quality,
        },
        context: {
          ip: req.ip,
          userAgent: req.get("user-agent") || "",
          url: req.originalUrl,
        },
      });

      res.json(result);
    } catch (err) {
      next(err);
    }
  });

  router.get("/alerts", async (req, res, next) => {
    try {
      const { location } = locationQuerySchema.parse(req.query);
      const result = await weatherService.getAlerts(location);

      const parsed = parseLocation(location);
      trackEvent("weather_alerts_queried", {
        properties: {
          location,
          location_type: parsed.type,
          location_name: result.meta.location.name,
          country: result.meta.location.country || "",
          alerts_count: result.count,
          cached: result.meta.cached,
          data_quality: result.meta.quality,
        },
        context: {
          ip: req.ip,
          userAgent: req.get("user-agent") || "",
          url: req.originalUrl,
        },
      });

      res.json(result);
    } catch (err) {
      next(err);
    }
  });

  router.get("/summary", async (req, res, next) => {
    try {
      const { location, hours, days } = locationQuerySchema.parse(req.query);
      const result = await weatherService.getSummary(location, { hours, days });

      const parsed = parseLocation(location);
      trackEvent("weather_summary_queried", {
        properties: {
          location,
          location_type: parsed.type,
          location_name: result.meta.location.name,
          country: result.meta.location.country || "",
          hours_requested: hours,
          days_requested: days,
          alerts_count: result.alerts.count,
          cached: result.meta.cached,
          data_quality: result.meta.quality,
        },
        context: {
          ip: req.ip,
          userAgent: req.get("user-agent") || "",
          url: req.originalUrl,
        },
      });

      res.json(result);
    } catch (err) {
      next(err);
    }
  });

  return router;
}

module.exports = { createWeatherRouter };
