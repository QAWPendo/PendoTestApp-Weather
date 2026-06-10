console.log("hello world");

const { parseLocation } = require("../schemas/location");
const { AppError, ERROR_CODES } = require("../utils/errors");
const {
  transformCurrent,
  transformHourly,
  transformDaily,
  transformAlerts,
  generateCurrentSummary,
  generateHourlySummary,
  generateDailySummary,
  generateAlertsSummary,
  generateSummarySummary,
  buildMeta,
} = require("./weatherTransformer");

class WeatherService {
  constructor(geocoding, openWeather) {
    this.geocoding = geocoding;
    this.openWeather = openWeather;
  }

  async resolveLocation(location) {
    const parsed = parseLocation(location);
    if (parsed.type === "invalid") {
      throw new AppError(ERROR_CODES.INVALID_LOCATION, parsed.reason, 400);
    }
    return this.geocoding.resolve(parsed);
  }

  async getCurrent(locationStr) {
    const location = await this.resolveLocation(locationStr);
    const data = await this.openWeather.getOneCall(location.lat, location.lon);
    const current = transformCurrent(data.current, data.timezone_offset);
    const quality = data._fromCache ? "estimated" : "high";

    return {
      meta: buildMeta(location, quality, data._fromCache),
      summary: generateCurrentSummary(current, location),
      current,
    };
  }

  async getHourly(locationStr, hours) {
    const location = await this.resolveLocation(locationStr);
    const data = await this.openWeather.getOneCall(location.lat, location.lon);
    const hourly = transformHourly(data.hourly, data.timezone_offset, hours);
    const quality = data._fromCache ? "estimated" : "high";

    return {
      meta: buildMeta(location, quality, data._fromCache),
      summary: generateHourlySummary(hourly),
      hours: hourly.length,
      hourly,
    };
  }

  async getForecast(locationStr, days) {
    const location = await this.resolveLocation(locationStr);
    const data = await this.openWeather.getOneCall(location.lat, location.lon);
    const daily = transformDaily(data.daily, data.timezone_offset, days);
    const quality = data._fromCache ? "estimated" : "high";

    return {
      meta: buildMeta(location, quality, data._fromCache),
      summary: generateDailySummary(daily),
      days: daily.length,
      daily,
    };
  }

  async getAlerts(locationStr) {
    const location = await this.resolveLocation(locationStr);
    const { alerts: rawAlerts, quality, fromCache, timezone_offset } =
      await this.openWeather.getAlerts(location.lat, location.lon);

    const alerts = transformAlerts(rawAlerts, timezone_offset || 0);

    return {
      meta: buildMeta(location, quality, fromCache),
      summary: generateAlertsSummary(alerts),
      count: alerts.length,
      alerts,
    };
  }

  async getSummary(locationStr, { hours = 24, days = 7 } = {}) {
    const location = await this.resolveLocation(locationStr);
    const data = await this.openWeather.getOneCall(location.lat, location.lon);
    const quality = data._fromCache ? "estimated" : "high";

    const current = transformCurrent(data.current, data.timezone_offset);
    const hourly = transformHourly(data.hourly, data.timezone_offset, hours);
    const daily = transformDaily(data.daily, data.timezone_offset, days);
    const alerts = transformAlerts(data.alerts, data.timezone_offset);

    return {
      meta: buildMeta(location, quality, data._fromCache),
      summary: generateSummarySummary(current, daily, alerts, location),
      current,
      hourly: { hours: hourly.length, data: hourly },
      daily: { days: daily.length, data: daily },
      alerts: { count: alerts.length, data: alerts },
    };
  }
}

module.exports = { WeatherService };
