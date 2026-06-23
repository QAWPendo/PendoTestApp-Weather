console.log("hello world");

const { AppError, ERROR_CODES } = require("../utils/errors");
const { withRetry } = require("../utils/retry");
const { trackEvent } = require("./pendoTrack");

const GEO_BASE = "https://api.openweathermap.org/geo/1.0";

class GeocodingService {
  constructor(apiKey, cache) {
    this.apiKey = apiKey;
    this.cache = cache;
    this.inflight = new Map();
  }

  cacheKey(parsedLocation) {
    if (parsedLocation.type === "coordinates") {
      return `geo:coord:${parsedLocation.lat.toFixed(4)}:${parsedLocation.lon.toFixed(4)}`;
    }
    if (parsedLocation.type === "zip") {
      return `geo:zip:${parsedLocation.zip}:${parsedLocation.country}`;
    }
    return `geo:city:${parsedLocation.query.toLowerCase()}`;
  }

  async resolve(parsedLocation) {
    let result;
    let wasCached = false;

    if (parsedLocation.type === "coordinates") {
      const key = this.cacheKey(parsedLocation);
      const cached = await this.cache.get(key);
      if (cached) {
        result = cached;
        wasCached = true;
      } else {
        const place = await this.reverseGeocode(parsedLocation.lat, parsedLocation.lon);
        result = {
          lat: parsedLocation.lat,
          lon: parsedLocation.lon,
          name: place?.name || "Unknown",
          country: place?.country || null,
          state: place?.state || null,
        };
        await this.cache.set(key, result);
      }
    } else if (parsedLocation.type === "zip") {
      result = await this.geocodeZip(parsedLocation.zip, parsedLocation.country);
    } else if (parsedLocation.type === "city") {
      result = await this.geocodeCity(parsedLocation.query);
    } else {
      throw new AppError(
        ERROR_CODES.INVALID_LOCATION,
        parsedLocation.reason || "Invalid location format",
        400
      );
    }

    trackEvent("location_geocoded", "server", "api-consumers", {
      location_input: parsedLocation.query || parsedLocation.zip || `${parsedLocation.lat},${parsedLocation.lon}`,
      location_type: parsedLocation.type,
      resolved_name: result.name,
      cached: wasCached,
    });

    return result;
  }

  async geocodeCity(query) {
    const key = `geo:city:${query.toLowerCase()}`;
    const cached = await this.cache.get(key);
    if (cached) {
      return cached;
    }

    const url = `${GEO_BASE}/direct?q=${encodeURIComponent(query)}&limit=1&appid=${this.apiKey}`;
    const results = await this.fetchJson(url, key);

    if (!results.length) {
      throw new AppError(
        ERROR_CODES.LOCATION_NOT_FOUND,
        `No location found for "${query}"`,
        404
      );
    }

    const place = results[0];
    const resolved = {
      lat: place.lat,
      lon: place.lon,
      name: place.name,
      country: place.country,
      state: place.state || null,
    };
    await this.cache.set(key, resolved);
    return resolved;
  }

  async geocodeZip(zip, country) {
    const key = `geo:zip:${zip}:${country}`;
    const cached = await this.cache.get(key);
    if (cached) {
      return cached;
    }

    const url = `${GEO_BASE}/zip?zip=${encodeURIComponent(zip)},${country}&appid=${this.apiKey}`;
    try {
      const place = await this.fetchJson(url, key);
      const resolved = {
        lat: place.lat,
        lon: place.lon,
        name: place.name,
        country: place.country,
        state: null,
      };
      await this.cache.set(key, resolved);
      return resolved;
    } catch (error) {
      if (error.statusCode === 404) {
        throw new AppError(
          ERROR_CODES.LOCATION_NOT_FOUND,
          `No location found for zip code "${zip}"`,
          404
        );
      }
      throw error;
    }
  }

  async reverseGeocode(lat, lon) {
    const key = `geo:coord:${lat.toFixed(4)}:${lon.toFixed(4)}`;
    const url = `${GEO_BASE}/reverse?lat=${lat}&lon=${lon}&limit=1&appid=${this.apiKey}`;
    const results = await this.fetchJson(url, key);
    return results[0] || null;
  }

  async fetchJson(url, cacheKey) {
    let fetchPromise = this.inflight.get(cacheKey);
    if (!fetchPromise) {
      fetchPromise = withRetry(async () => {
        console.log(`OpenWeatherMap geocoding API call: ${cacheKey}`);
        const response = await fetch(url);
        if (response.status === 401 || response.status === 403) {
          throw new AppError(
            ERROR_CODES.WEATHER_API_ERROR,
            "OpenWeatherMap API key is invalid, not yet activated, or lacks required API access",
            502
          );
        }
        if (!response.ok) {
          const error = new Error(`Geocoding API error: ${response.status}`);
          error.statusCode = response.status;
          throw error;
        }
        return response.json();
      }).finally(() => {
        this.inflight.delete(cacheKey);
      });
      this.inflight.set(cacheKey, fetchPromise);
    }

    return fetchPromise;
  }
}

module.exports = { GeocodingService };
