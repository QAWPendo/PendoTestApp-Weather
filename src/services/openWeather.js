console.log("hello world");

const { AppError, ERROR_CODES } = require("../utils/errors");
const { withRetry } = require("../utils/retry");

const ONE_CALL_BASE = "https://api.openweathermap.org/data/4.0/onecall";

class OpenWeatherService {
  constructor(apiKey, cache) {
    this.apiKey = apiKey;
    this.cache = cache;
    this.inflight = new Map();
  }

  bundleCacheKey(lat, lon) {
    return `owm4:${lat.toFixed(4)}:${lon.toFixed(4)}`;
  }

  async getWeatherBundle(lat, lon) {
    const key = this.bundleCacheKey(lat, lon);
    const cached = await this.cache.get(key);
    if (cached) {
      return { ...cached, _fromCache: true };
    }

    let fetchPromise = this.inflight.get(key);
    if (!fetchPromise) {
      fetchPromise = this.fetchAndStoreBundle(key, lat, lon).finally(() => {
        this.inflight.delete(key);
      });
      this.inflight.set(key, fetchPromise);
    }

    const data = await fetchPromise;
    return { ...data, _fromCache: false };
  }

  async getOneCall(lat, lon) {
    const bundle = await this.getWeatherBundle(lat, lon);
    return {
      lat: bundle.lat,
      lon: bundle.lon,
      timezone: bundle.timezone,
      timezone_offset: bundle.timezone_offset,
      current: bundle.current,
      hourly: bundle.hourly,
      daily: bundle.daily,
      alertIds: bundle.alertIds,
      _fromCache: bundle._fromCache,
    };
  }

  async fetchAndStoreBundle(key, lat, lon) {
    console.log(`OpenWeatherMap API 4.0 bundle fetch: ${key}`);
    const baseParams = {
      lat: String(lat),
      lon: String(lon),
      units: "metric",
      lang: "en",
      appid: this.apiKey,
    };

    const [currentRes, hourlyRes, dailyRes] = await Promise.all([
      this.fetchEndpoint(`${ONE_CALL_BASE}/current`, baseParams),
      this.fetchEndpoint(`${ONE_CALL_BASE}/timeline/1h`, baseParams),
      this.fetchEndpoint(`${ONE_CALL_BASE}/timeline/1day`, baseParams),
    ]);

    const bundle = this.normalizeBundle(currentRes, hourlyRes, dailyRes);
    await this.cache.set(key, bundle);
    return bundle;
  }

  normalizeBundle(currentRes, hourlyRes, dailyRes) {
    const alertIds = new Set();

    const collectAlertIds = (records) => {
      for (const record of records || []) {
        for (const id of record.alerts || []) {
          alertIds.add(id);
        }
      }
    };

    collectAlertIds(currentRes.data);
    collectAlertIds(hourlyRes.data);
    collectAlertIds(dailyRes.data);

    return {
      lat: currentRes.lat,
      lon: currentRes.lon,
      timezone: currentRes.timezone,
      timezone_offset: currentRes.timezone_offset,
      current: currentRes.data?.[0] || null,
      hourly: hourlyRes.data || [],
      daily: dailyRes.data || [],
      alertIds: [...alertIds],
    };
  }

  async fetchEndpoint(url, params) {
    const query = new URLSearchParams(params).toString();
    return withRetry(async () => {
      const response = await fetch(`${url}?${query}`);
      const data = await response.json().catch(() => ({}));

      if (data.cod && Number(data.cod) !== 200) {
        if (Number(data.cod) === 401 || Number(data.cod) === 403) {
          throw new AppError(
            ERROR_CODES.WEATHER_API_ERROR,
            data.message ||
              "OpenWeatherMap API key is invalid or lacks One Call API 4.0 (One Call by Call) access",
            502
          );
        }
        throw new AppError(
          ERROR_CODES.WEATHER_API_ERROR,
          data.message || `OpenWeatherMap API error: ${data.cod}`,
          502
        );
      }

      if (response.status === 401 || response.status === 403) {
        throw new AppError(
          ERROR_CODES.WEATHER_API_ERROR,
          data.message ||
            "OpenWeatherMap API key is invalid or lacks One Call API 4.0 (One Call by Call) access",
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

      return data;
    });
  }

  async fetchAlertDetail(alertId) {
    const cacheKey = `alert:${alertId}`;
    const cached = await this.cache.get(cacheKey);
    if (cached) {
      return cached;
    }

    const url = `${ONE_CALL_BASE}/alert/${encodeURIComponent(alertId)}`;
    const params = { appid: this.apiKey };
    console.log(`OpenWeatherMap API 4.0 alert fetch: ${alertId}`);

    const alert = await this.fetchEndpoint(url, params);
    await this.cache.set(cacheKey, alert);
    return alert;
  }

  async resolveAlerts(alertIds) {
    if (!alertIds?.length) {
      return [];
    }

    const results = await Promise.all(
      alertIds.map(async (id) => {
        try {
          return await this.fetchAlertDetail(id);
        } catch {
          return null;
        }
      })
    );

    return results.filter(Boolean);
  }

  async getAlerts(lat, lon) {
    try {
      const bundle = await this.getWeatherBundle(lat, lon);
      const alerts = await this.resolveAlerts(bundle.alertIds);
      return {
        alerts,
        quality: bundle._fromCache ? "estimated" : "high",
        fromCache: bundle._fromCache,
        timezone_offset: bundle.timezone_offset,
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
