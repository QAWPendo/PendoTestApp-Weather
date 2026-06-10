console.log("hello world");

const { AppError, ERROR_CODES } = require("../utils/errors");
const { withRetry } = require("../utils/retry");

const ONE_CALL_BASE = "https://api.openweathermap.org/data/3.0/onecall";

class OpenWeatherService {
  constructor(apiKey, cache) {
    this.apiKey = apiKey;
    this.cache = cache;
    this.inflight = new Map();
  }

  cacheKey(lat, lon) {
    return `owm:${lat.toFixed(4)}:${lon.toFixed(4)}`;
  }

  async getOneCall(lat, lon) {
    const key = this.cacheKey(lat, lon);
    const cached = await this.cache.get(key);
    if (cached) {
      return { ...cached, _fromCache: true };
    }

    let fetchPromise = this.inflight.get(key);
    if (!fetchPromise) {
      fetchPromise = this.fetchAndStore(key, lat, lon).finally(() => {
        this.inflight.delete(key);
      });
      this.inflight.set(key, fetchPromise);
    }

    const data = await fetchPromise;
    return { ...data, _fromCache: false };
  }

  async fetchAndStore(key, lat, lon) {
    const params = new URLSearchParams({
      lat: String(lat),
      lon: String(lon),
      units: "metric",
      appid: this.apiKey,
    });

    const url = `${ONE_CALL_BASE}?${params.toString()}`;
    console.log(`OpenWeatherMap API call: ${key}`);
    const data = await this.fetchOneCall(url);
    await this.cache.set(key, data);
    return data;
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
      const data = await this.getOneCall(lat, lon);
      return {
        alerts: data.alerts || [],
        quality: data._fromCache ? "estimated" : "high",
        fromCache: data._fromCache,
        timezone_offset: data.timezone_offset,
      };
    } catch {
      return {
        alerts: [],
        quality: "unavailable",
        fromCache: false,
        timezone_offset: 0,
      };
    }
  }
}

module.exports = { OpenWeatherService };
