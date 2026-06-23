console.log("hello world");

const express = require("express");
const { locationQuerySchema } = require("../schemas/location");
const { trackEvent } = require("../services/pendoTrack");

function createWeatherRouter(weatherService) {
  const router = express.Router();

  router.get("/current", async (req, res, next) => {
    try {
      const { location } = locationQuerySchema.parse(req.query);
      const result = await weatherService.getCurrent(location);
      res.json(result);
      trackEvent("weather_current_retrieved", req.ip, "api-consumers", {
        location_input: location,
        resolved_name: result.meta?.location?.name,
        cached: result.meta?.cached || false,
        data_quality: result.meta?.quality || "unknown",
      });
    } catch (err) {
      next(err);
    }
  });

  router.get("/hourly", async (req, res, next) => {
    try {
      const { location, hours } = locationQuerySchema.parse(req.query);
      const result = await weatherService.getHourly(location, hours);
      res.json(result);
      trackEvent("weather_hourly_forecast_retrieved", req.ip, "api-consumers", {
        location_input: location,
        resolved_name: result.meta?.location?.name,
        cached: result.meta?.cached || false,
        data_quality: result.meta?.quality || "unknown",
        hours_requested: hours,
      });
    } catch (err) {
      next(err);
    }
  });

  router.get("/forecast", async (req, res, next) => {
    try {
      const { location, days } = locationQuerySchema.parse(req.query);
      const result = await weatherService.getForecast(location, days);
      res.json(result);
      trackEvent("weather_daily_forecast_retrieved", req.ip, "api-consumers", {
        location_input: location,
        resolved_name: result.meta?.location?.name,
        cached: result.meta?.cached || false,
        data_quality: result.meta?.quality || "unknown",
        days_requested: days,
      });
    } catch (err) {
      next(err);
    }
  });

  router.get("/alerts", async (req, res, next) => {
    try {
      const { location } = locationQuerySchema.parse(req.query);
      const result = await weatherService.getAlerts(location);
      res.json(result);
      trackEvent("weather_alerts_retrieved", req.ip, "api-consumers", {
        location_input: location,
        resolved_name: result.meta?.location?.name,
        cached: result.meta?.cached || false,
        data_quality: result.meta?.quality || "unknown",
        alert_count: result.count,
      });
    } catch (err) {
      next(err);
    }
  });

  router.get("/summary", async (req, res, next) => {
    try {
      const { location, hours, days } = locationQuerySchema.parse(req.query);
      const result = await weatherService.getSummary(location, { hours, days });
      res.json(result);
      trackEvent("weather_summary_retrieved", req.ip, "api-consumers", {
        location_input: location,
        resolved_name: result.meta?.location?.name,
        cached: result.meta?.cached || false,
        data_quality: result.meta?.quality || "unknown",
        hours_requested: hours,
        days_requested: days,
      });
    } catch (err) {
      next(err);
    }
  });

  return router;
}

module.exports = { createWeatherRouter };
