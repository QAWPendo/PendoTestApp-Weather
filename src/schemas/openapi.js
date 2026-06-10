console.log("hello world");

const swaggerJsdoc = require("swagger-jsdoc");

const options = {
  definition: {
    openapi: "3.0.3",
    info: {
      title: "Weather Agent API",
      version: "1.0.0",
      description:
        "REST API wrapping OpenWeatherMap One Call API 3.0, purpose-built for AI agent consumption with clean, structured JSON responses.",
      contact: {
        name: "Weather Agent API",
      },
    },
    servers: [
      { url: "http://localhost:3000", description: "Local development" },
    ],
    tags: [
      { name: "Weather", description: "Weather data endpoints" },
      { name: "Health", description: "Service health checks" },
    ],
    components: {
      schemas: {
        Error: {
          type: "object",
          properties: {
            error: { type: "string", example: "LOCATION_NOT_FOUND" },
            message: { type: "string", example: "No location found for \"Atlantis\"" },
            details: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  field: { type: "string" },
                  message: { type: "string" },
                },
              },
            },
          },
        },
        LocationMeta: {
          type: "object",
          properties: {
            name: { type: "string", example: "London" },
            country: { type: "string", example: "GB" },
            state: { type: "string", nullable: true },
            coordinates: {
              type: "object",
              properties: {
                lat: { type: "number", example: 51.5074 },
                lon: { type: "number", example: -0.1278 },
              },
            },
          },
        },
        ResponseMeta: {
          type: "object",
          properties: {
            location: { $ref: "#/components/schemas/LocationMeta" },
            quality: {
              type: "string",
              enum: ["high", "estimated", "unavailable"],
              description: "Data confidence indicator",
            },
            cached: { type: "boolean" },
            generatedAt: { type: "string", format: "date-time" },
          },
        },
        TemperatureUnits: {
          type: "object",
          properties: {
            metric: {
              type: "object",
              properties: {
                temperature: { type: "number", description: "°C" },
                feelsLike: { type: "number", description: "°C" },
                windSpeed: { type: "number", description: "m/s" },
                pressure: { type: "number", description: "hPa" },
              },
            },
            imperial: {
              type: "object",
              properties: {
                temperature: { type: "number", description: "°F" },
                feelsLike: { type: "number", description: "°F" },
                windSpeed: { type: "number", description: "mph" },
                pressure: { type: "number", description: "inHg" },
              },
            },
          },
        },
        CurrentWeatherResponse: {
          type: "object",
          properties: {
            meta: { $ref: "#/components/schemas/ResponseMeta" },
            summary: {
              type: "string",
              example:
                "Currently clear sky in London, GB with a temperature of 59°F (15°C), feels like 57°F. Humidity is 72% with 5% cloud cover.",
            },
            current: {
              type: "object",
              properties: {
                timestamp: { type: "string", format: "date-time" },
                conditionCode: { type: "string", example: "CLEAR" },
                conditionId: { type: "integer", example: 800 },
                description: { type: "string", example: "clear sky" },
                units: { $ref: "#/components/schemas/TemperatureUnits" },
                humidity: { type: "integer", example: 72 },
                clouds: { type: "integer", example: 5 },
                uvIndex: { type: "number", example: 3.2 },
              },
            },
          },
        },
        HourlyWeatherResponse: {
          type: "object",
          properties: {
            meta: { $ref: "#/components/schemas/ResponseMeta" },
            summary: { type: "string" },
            hours: { type: "integer", example: 24 },
            hourly: { type: "array", items: { type: "object" } },
          },
        },
        DailyForecastResponse: {
          type: "object",
          properties: {
            meta: { $ref: "#/components/schemas/ResponseMeta" },
            summary: { type: "string" },
            days: { type: "integer", example: 7 },
            daily: { type: "array", items: { type: "object" } },
          },
        },
        AlertsResponse: {
          type: "object",
          properties: {
            meta: { $ref: "#/components/schemas/ResponseMeta" },
            summary: { type: "string", example: "No severe weather alerts at this time." },
            count: { type: "integer", example: 0 },
            alerts: { type: "array", items: { type: "object" } },
          },
        },
        SummaryResponse: {
          type: "object",
          properties: {
            meta: { $ref: "#/components/schemas/ResponseMeta" },
            summary: { type: "string" },
            current: { type: "object" },
            hourly: { type: "object" },
            daily: { type: "object" },
            alerts: { type: "object" },
          },
        },
        HealthResponse: {
          type: "object",
          properties: {
            status: { type: "string", example: "ok" },
            uptime: { type: "number", example: 12345.67 },
            timestamp: { type: "string", format: "date-time" },
            version: { type: "string", example: "1.0.0" },
          },
        },
      },
    },
    paths: {
      "/health": {
        get: {
          tags: ["Health"],
          summary: "Health check",
          description: "Ping this endpoint to verify the service is running.",
          responses: {
            200: {
              description: "Service is healthy",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/HealthResponse" },
                },
              },
            },
          },
        },
      },
      "/weather/current": {
        get: {
          tags: ["Weather"],
          summary: "Current weather conditions",
          parameters: [
            {
              name: "location",
              in: "query",
              required: true,
              description: "City name (London,GB), zip code (10001 or 10001,US), or lat,lng (40.71,-74.01)",
              schema: { type: "string", example: "London,GB" },
            },
          ],
          responses: {
            200: {
              description: "Current conditions",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/CurrentWeatherResponse" },
                },
              },
            },
            400: { description: "Invalid location", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
            404: { description: "Location not found", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          },
        },
      },
      "/weather/hourly": {
        get: {
          tags: ["Weather"],
          summary: "Hourly forecast",
          parameters: [
            { name: "location", in: "query", required: true, schema: { type: "string", example: "New York,US" } },
            { name: "hours", in: "query", required: false, schema: { type: "integer", minimum: 1, maximum: 48, default: 24 } },
          ],
          responses: {
            200: {
              description: "Hourly forecast",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/HourlyWeatherResponse" },
                },
              },
            },
          },
        },
      },
      "/weather/forecast": {
        get: {
          tags: ["Weather"],
          summary: "Daily forecast",
          parameters: [
            { name: "location", in: "query", required: true, schema: { type: "string", example: "90210" } },
            { name: "days", in: "query", required: false, schema: { type: "integer", minimum: 1, maximum: 7, default: 7 } },
          ],
          responses: {
            200: {
              description: "Daily forecast",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/DailyForecastResponse" },
                },
              },
            },
          },
        },
      },
      "/weather/alerts": {
        get: {
          tags: ["Weather"],
          summary: "Severe weather alerts",
          parameters: [
            { name: "location", in: "query", required: true, schema: { type: "string", example: "Miami,US" } },
          ],
          responses: {
            200: {
              description: "Weather alerts (empty array if none or unavailable)",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/AlertsResponse" },
                },
              },
            },
          },
        },
      },
      "/weather/summary": {
        get: {
          tags: ["Weather"],
          summary: "Complete weather summary",
          description: "Returns current, hourly, daily, and alerts in a single call.",
          parameters: [
            { name: "location", in: "query", required: true, schema: { type: "string", example: "San Francisco,US" } },
            { name: "hours", in: "query", required: false, schema: { type: "integer", minimum: 1, maximum: 48, default: 24 } },
            { name: "days", in: "query", required: false, schema: { type: "integer", minimum: 1, maximum: 7, default: 7 } },
          ],
          responses: {
            200: {
              description: "Full weather summary",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/SummaryResponse" },
                },
              },
            },
          },
        },
      },
    },
  },
  apis: [],
};

function createOpenApiSpec() {
  return swaggerJsdoc(options);
}

module.exports = { createOpenApiSpec };
