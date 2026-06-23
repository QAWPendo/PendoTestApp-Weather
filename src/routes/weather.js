console.log("hello world");

const express = require("express");
const { locationQuerySchema } = require("../schemas/location");
const pendoTracker = require("../services/pendoTracker");

function createWeatherRouter(weatherService) {
  const router = express.Router();

  router.get("/current", async (req, res, next) => {
    try {
      const { location } = locationQuerySchema.parse(req.query);
      const result = await weatherService.getCurrent(location);
      res.json(result);
      pendoTracker.track(req.ip, "", "weather_current_retrieved", {
        location_input: location,
        resolved_name: result.meta?.location?.name || null,
        cached: result.meta?.cached || false,
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
      pendoTracker.track(req.ip, "", "weather_hourly_forecast_retrieved", {
        location_input: location,
        resolved_name: result.meta?.location?.name || null,
        cached: result.meta?.cached || false,
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
      pendoTracker.track(req.ip, "", "weather_daily_forecast_retrieved", {
        location_input: location,
        resolved_name: result.meta?.location?.name || null,
        cached: result.meta?.cached || false,
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
      pendoTracker.track(req.ip, "", "weather_alerts_retrieved", {
        location_input: location,
        resolved_name: result.meta?.location?.name || null,
        cached: result.meta?.cached || false,
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
      pendoTracker.track(req.ip, "", "weather_summary_retrieved", {
        location_input: location,
        resolved_name: result.meta?.location?.name || null,
        cached: result.meta?.cached || false,
      });
    } catch (err) {
      next(err);
    }
  });

  return router;
}

module.exports = { createWeatherRouter };
