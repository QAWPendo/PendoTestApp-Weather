# Weather Agent API

A REST API service that wraps [OpenWeatherMap One Call API 4.0](https://openweathermap.org/api/one-call-4), purpose-built for AI agent consumption with clean, structured JSON responses.

## Features

- **Core endpoints** — current conditions, hourly forecast (up to 48h), 7-day daily forecast, severe weather alerts, and a combined summary
- **Flexible locations** — city name, zip code, or `lat,lng` coordinates
- **AI-agent friendly** — natural language summaries, dual metric/imperial units, condition codes, ISO 8601 timestamps, and data quality flags
- **Reliability** — Redis or in-memory caching (1 hour minimum — at most one OpenWeatherMap call per location per hour), rate limiting (100 req/min), retry logic, graceful alert fallbacks
- **Documentation** — OpenAPI 3.0 spec at `/docs` and `/openapi.json`

## Quick Start

### Prerequisites

- Node.js 18+
- OpenWeatherMap API key with **One Call API 4.0** (One Call by Call) subscription
- Redis (optional — falls back to in-memory cache)

### Local Development

```bash
# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env and set OPENWEATHER_API_KEY

# Start the server
npm start
```

The API will be available at `http://localhost:3000`. Swagger docs at `http://localhost:3000/docs`.

### Docker Compose (with Redis)

```bash
export OPENWEATHER_API_KEY=your_key_here
docker compose up --build
```

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `OPENWEATHER_API_KEY` | Yes | — | OpenWeatherMap API key |
| `PORT` | No | `3000` | Server port |
| `NODE_ENV` | No | `development` | Environment |
| `CACHE_TTL_SECONDS` | No | `3600` | Cache TTL in seconds (min 3600 = 1 hour; limits API calls) |
| `REDIS_URL` | No | — | Redis connection URL |
| `RATE_LIMIT_MAX` | No | `100` | Max requests per window |
| `RATE_LIMIT_WINDOW_MS` | No | `60000` | Rate limit window (ms) |

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/health` | Health check |
| `GET` | `/weather/current?location=` | Current conditions |
| `GET` | `/weather/hourly?location=&hours=` | Hourly forecast (1–48 hours) |
| `GET` | `/weather/forecast?location=&days=` | Daily forecast (1–7 days) |
| `GET` | `/weather/alerts?location=` | Severe weather alerts |
| `GET` | `/weather/summary?location=` | All of the above in one call |
| `GET` | `/docs` | Swagger UI |
| `GET` | `/openapi.json` | OpenAPI spec |

### Location Formats

| Format | Example |
|--------|---------|
| City name | `London`, `London,GB`, `New York,US` |
| Zip code | `10001`, `10001,US`, `90210-1234` |
| Coordinates | `40.7128,-74.0060` |

### Example Requests

```bash
# Current weather
curl "http://localhost:3000/weather/current?location=London,GB"

# 24-hour hourly forecast
curl "http://localhost:3000/weather/hourly?location=New%20York,US&hours=24"

# 7-day forecast
curl "http://localhost:3000/weather/forecast?location=90210&days=7"

# Weather alerts
curl "http://localhost:3000/weather/alerts?location=Miami,US"

# Full summary
curl "http://localhost:3000/weather/summary?location=San%20Francisco,US"

# Health check
curl "http://localhost:3000/health"
```

### Example Response (`/weather/current`)

```json
{
  "meta": {
    "location": {
      "name": "London",
      "country": "GB",
      "state": null,
      "coordinates": { "lat": 51.5074, "lon": -0.1278 }
    },
    "quality": "high",
    "cached": false,
    "generatedAt": "2026-06-10T12:00:00.000Z"
  },
  "summary": "Currently clear sky in London, GB with a temperature of 59°F (15°C)...",
  "current": {
    "timestamp": "2026-06-10T12:00:00+01:00",
    "conditionCode": "CLEAR",
    "conditionId": 800,
    "description": "clear sky",
    "units": {
      "metric": { "temperature": 15, "feelsLike": 14, "windSpeed": 3.5, "pressure": 1015 },
      "imperial": { "temperature": 59, "feelsLike": 57, "windSpeed": 7.8, "pressure": 29.97 }
    },
    "humidity": 72,
    "clouds": 5,
    "uvIndex": 3.2
  }
}
```

### Error Schema

All errors return a consistent JSON structure:

```json
{
  "error": "LOCATION_NOT_FOUND",
  "message": "No location found for \"Atlantis\""
}
```

| Error Code | HTTP Status | Description |
|------------|-------------|-------------|
| `VALIDATION_ERROR` | 400 | Invalid query parameters |
| `INVALID_LOCATION` | 400 | Unrecognized location format |
| `LOCATION_NOT_FOUND` | 404 | Location not found |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests |
| `WEATHER_API_ERROR` | 502 | Upstream weather API failure |
| `NOT_FOUND` | 404 | Route not found |
| `INTERNAL_ERROR` | 500 | Unexpected server error |

## Deployment

### Render

A `render.yaml` blueprint is included. Connect your repo to Render and set `OPENWEATHER_API_KEY` as a secret environment variable.

### Railway / Fly.io

Build and deploy the Docker image:

```bash
docker build -t weather-agent-api .
docker run -p 3000:3000 -e OPENWEATHER_API_KEY=your_key weather-agent-api
```

Set `OPENWEATHER_API_KEY` in your platform's environment variables. Optionally add a Redis instance and set `REDIS_URL`.

## API call limits

OpenWeatherMap responses are cached for **at least 1 hour** per location. Within that window:

- All endpoints share a single cached weather bundle (current + hourly + daily timelines)
- On cache refresh, One Call API 4.0 requires **3 upstream calls** per location (current, 1-hour timeline, 1-day timeline) — these are fetched together and cached as one bundle
- Weather alert details are fetched by ID and cached separately for 1 hour
- Geocoding results (city, zip, coordinates) are also cached for 1 hour
- Concurrent requests for the same location are deduplicated

**Note:** The hourly timeline returns up to 20 hours per API call (48 hours would require additional paginated calls). Daily timeline returns up to 10 days per call.

## Architecture

```
Client (AI Agent)
       │
       ▼
  Express API ──► Rate Limiter ──► Validation (Zod)
       │
       ├──► Cache (Redis / in-memory, 1 hour TTL)
       │
       └──► OpenWeatherMap
              ├── Geocoding API (city / zip / reverse)
              └── One Call API 4.0 (current, 1h timeline, 1day timeline, alerts)
```

## License

MIT
