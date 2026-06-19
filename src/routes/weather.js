console.log("hello world");

const express = require("express");
const { locationQuerySchema, parseLocation } = require("../schemas/location");
const { pendoTrack } = require("../services/pendoTracker");

function createWeatherRouter(weatherService) {
  const router = express.Router();

  router.get("/current", async (req, res, next) => {
    try {
      const { location } = locationQuerySchema.parse(req.query);
      const result = await weatherService.getCurrent(location);
      res.json(result);

      try {
        const parsed = parseLocation(location);
        pendoTrack("weather_current_retrieved", req.ip, "system", {
          location_input: location.substring(0, 100),
          location_type: parsed.type,
          resolved_name: result.meta.location.name,
          resolved_country: result.meta.location.country,
          resolved_state: result.meta.location.state,
          latitude: result.meta.location.coordinates.lat,
          longitude: result.meta.location.coordinates.lon,
          data_quality: result.meta.quality,
          cached: result.meta.cached,
          condition_code: result.current.conditionCode,
          temperature_celsius: result.current.units.metric.temperature,
          temperature_fahrenheit: result.current.units.imperial.temperature,
        }, { ip: req.ip, url: req.originalUrl });
      } catch (_) { /* tracking must not affect response */ }
    } catch (err) {
      next(err);
    }
  });

  router.get("/hourly", async (req, res, next) => {
    try {
      const { location, hours } = locationQuerySchema.parse(req.query);
      const result = await weatherService.getHourly(location, hours);
      res.json(result);

      try {
        const parsed = parseLocation(location);
        pendoTrack("weather_hourly_forecast_retrieved", req.ip, "system", {
          location_input: location.substring(0, 100),
          location_type: parsed.type,
          resolved_name: result.meta.location.name,
          resolved_country: result.meta.location.country,
          latitude: result.meta.location.coordinates.lat,
          longitude: result.meta.location.coordinates.lon,
          hours_requested: hours,
          hours_returned: result.hours,
          data_quality: result.meta.quality,
          cached: result.meta.cached,
        }, { ip: req.ip, url: req.originalUrl });
      } catch (_) { /* tracking must not affect response */ }
    } catch (err) {
      next(err);
    }
  });

  router.get("/forecast", async (req, res, next) => {
    try {
      const { location, days } = locationQuerySchema.parse(req.query);
      const result = await weatherService.getForecast(location, days);
      res.json(result);

      try {
        const parsed = parseLocation(location);
        pendoTrack("weather_daily_forecast_retrieved", req.ip, "system", {
          location_input: location.substring(0, 100),
          location_type: parsed.type,
          resolved_name: result.meta.location.name,
          resolved_country: result.meta.location.country,
          latitude: result.meta.location.coordinates.lat,
          longitude: result.meta.location.coordinates.lon,
          days_requested: days,
          days_returned: result.days,
          data_quality: result.meta.quality,
          cached: result.meta.cached,
        }, { ip: req.ip, url: req.originalUrl });
      } catch (_) { /* tracking must not affect response */ }
    } catch (err) {
      next(err);
    }
  });

  router.get("/alerts", async (req, res, next) => {
    try {
      const { location } = locationQuerySchema.parse(req.query);
      const result = await weatherService.getAlerts(location);
      res.json(result);

      try {
        const parsed = parseLocation(location);
        pendoTrack("weather_alerts_retrieved", req.ip, "system", {
          location_input: location.substring(0, 100),
          location_type: parsed.type,
          resolved_name: result.meta.location.name,
          resolved_country: result.meta.location.country,
          latitude: result.meta.location.coordinates.lat,
          longitude: result.meta.location.coordinates.lon,
          alert_count: result.count,
          alert_events: result.alerts.map(a => a.event).join(", ").substring(0, 100),
          data_quality: result.meta.quality,
          cached: result.meta.cached,
        }, { ip: req.ip, url: req.originalUrl });
      } catch (_) { /* tracking must not affect response */ }
    } catch (err) {
      next(err);
    }
  });

  router.get("/summary", async (req, res, next) => {
    try {
      const { location, hours, days } = locationQuerySchema.parse(req.query);
      const result = await weatherService.getSummary(location, { hours, days });
      res.json(result);

      try {
        const parsed = parseLocation(location);
        pendoTrack("weather_summary_retrieved", req.ip, "system", {
          location_input: location.substring(0, 100),
          location_type: parsed.type,
          resolved_name: result.meta.location.name,
          resolved_country: result.meta.location.country,
          latitude: result.meta.location.coordinates.lat,
          longitude: result.meta.location.coordinates.lon,
          hours_requested: hours,
          days_requested: days,
          hours_returned: result.hourly.hours,
          days_returned: result.daily.days,
          alert_count: result.alerts.count,
          data_quality: result.meta.quality,
          cached: result.meta.cached,
        }, { ip: req.ip, url: req.originalUrl });
      } catch (_) { /* tracking must not affect response */ }
    } catch (err) {
      next(err);
    }
  });

  return router;
}

module.exports = { createWeatherRouter };
