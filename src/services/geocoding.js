console.log("hello world");

const { AppError, ERROR_CODES } = require("../utils/errors");
const { withRetry } = require("../utils/retry");

const GEO_BASE = "https://api.openweathermap.org/geo/1.0";

class GeocodingService {
  constructor(apiKey) {
    this.apiKey = apiKey;
  }

  async resolve(parsedLocation) {
    if (parsedLocation.type === "coordinates") {
      const place = await this.reverseGeocode(parsedLocation.lat, parsedLocation.lon);
      return {
        lat: parsedLocation.lat,
        lon: parsedLocation.lon,
        name: place?.name || "Unknown",
        country: place?.country || null,
        state: place?.state || null,
      };
    }

    if (parsedLocation.type === "zip") {
      return this.geocodeZip(parsedLocation.zip, parsedLocation.country);
    }

    if (parsedLocation.type === "city") {
      return this.geocodeCity(parsedLocation.query);
    }

    throw new AppError(
      ERROR_CODES.INVALID_LOCATION,
      parsedLocation.reason || "Invalid location format",
      400
    );
  }

  async geocodeCity(query) {
    const url = `${GEO_BASE}/direct?q=${encodeURIComponent(query)}&limit=1&appid=${this.apiKey}`;
    const results = await this.fetchJson(url);

    if (!results.length) {
      throw new AppError(
        ERROR_CODES.LOCATION_NOT_FOUND,
        `No location found for "${query}"`,
        404
      );
    }

    const place = results[0];
    return {
      lat: place.lat,
      lon: place.lon,
      name: place.name,
      country: place.country,
      state: place.state || null,
    };
  }

  async geocodeZip(zip, country) {
    const url = `${GEO_BASE}/zip?zip=${encodeURIComponent(zip)},${country}&appid=${this.apiKey}`;
    try {
      const place = await this.fetchJson(url);
      return {
        lat: place.lat,
        lon: place.lon,
        name: place.name,
        country: place.country,
        state: null,
      };
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
    const url = `${GEO_BASE}/reverse?lat=${lat}&lon=${lon}&limit=1&appid=${this.apiKey}`;
    const results = await this.fetchJson(url);
    return results[0] || null;
  }

  async fetchJson(url) {
    return withRetry(async () => {
      const response = await fetch(url);
      if (!response.ok) {
        const error = new Error(`Geocoding API error: ${response.status}`);
        error.statusCode = response.status;
        throw error;
      }
      return response.json();
    });
  }
}

module.exports = { GeocodingService };
