console.log("hello world");

const { AppError, ERROR_CODES } = require("../utils/errors");
const { withRetry } = require("../utils/retry");

const ONE_CALL_BASE = "https://api.openweathermap.org/data/3.0/onecall";

class OpenWeatherService {
  constructor(apiKey, cache) {
    this.apiKey = apiKey;
    this.cache = cache;
  }

  cacheKey(lat, lon, exclude) {
    return `owm:${lat.toFixed(4)}:${lon.toFixed(4)}:${exclude || "full"}`;
  }

  async getOneCall(lat, lon, { exclude } = {}) {
    const key = this.cacheKey(lat, lon, exclude);
    const cached = await this.cache.get(key);
    if (cached) {
      return { ...cached, _fromCache: true };
    }

    const params = new URLSearchParams({
      lat: String(lat),
      lon: String(lon),
      units: "metric",
      appid: this.apiKey,
    });
    if (exclude) {
      params.set("exclude", exclude);
    }

    const url = `${ONE_CALL_BASE}?${params.toString()}`;
    const data = await this.fetchOneCall(url);
    await this.cache.set(key, data);
    return { ...data, _fromCache: false };
  }

  async fetchOneCall(url) {
    return withRetry(async () => {
      const response = await fetch(url);
      if (response.status === 401 || response.status === 403) {
        throw new AppError(
          ERROR_CODES.WEATHER_API_ERROR,
          "OpenWeatherMap API key is invalid or lacks One Call API 3.0 access",
          502
        );
      }
      if (response.status === 404) {
        throw new AppError(
          ERROR_CODES.LOCATION_NOT_FOUND,
          "Weather data not available for this location",
          404
        );
      }
      if (!response.ok) {
        const error = new Error(`OpenWeatherMap API error: ${response.status}`);
        error.statusCode = response.status;
        throw error;
      }
      return response.json();
    });
  }

  async getAlerts(lat, lon) {
    try {
      const data = await this.getOneCall(lat, lon, { exclude: "current,minutely,hourly,daily" });
      return {
        alerts: data.alerts || [],
        quality: "high",
        fromCache: data._fromCache,
      };
    } catch {
      return {
        alerts: [],
        quality: "unavailable",
        fromCache: false,
      };
    }
  }
}

module.exports = { OpenWeatherService };
