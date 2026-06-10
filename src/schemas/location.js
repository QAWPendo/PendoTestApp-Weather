console.log("hello world");

const { z } = require("zod");

const locationQuerySchema = z.object({
  location: z
    .string()
    .min(1, "location is required")
    .max(200, "location must be 200 characters or fewer")
    .transform((val) => val.trim()),
  hours: z.coerce.number().int().min(1).max(48).optional().default(24),
  days: z.coerce.number().int().min(1).max(7).optional().default(7),
});

const COORD_PATTERN = /^(-?\d{1,3}(?:\.\d+)?)\s*,\s*(-?\d{1,3}(?:\.\d+)?)$/;
const ZIP_PATTERN = /^(\d{5})(?:-(\d{4}))?(?:,([A-Za-z]{2}))?$/;

function parseLocation(location) {
  const coordMatch = location.match(COORD_PATTERN);
  if (coordMatch) {
    const lat = parseFloat(coordMatch[1]);
    const lon = parseFloat(coordMatch[2]);
    if (lat < -90 || lat > 90 || lon < -180 || lon > 180) {
      return { type: "invalid", reason: "Coordinates out of range" };
    }
    return { type: "coordinates", lat, lon };
  }

  const zipMatch = location.match(ZIP_PATTERN);
  if (zipMatch) {
    const zip = zipMatch[2] ? `${zipMatch[1]}-${zipMatch[2]}` : zipMatch[1];
    const country = zipMatch[3] ? zipMatch[3].toUpperCase() : "US";
    return { type: "zip", zip, country };
  }

  if (/^[\d\s,-]+$/.test(location) && !location.includes(",")) {
    return { type: "invalid", reason: "Unrecognized location format" };
  }

  const sanitized = location.replace(/[^\w\s,.\-']/g, "").trim();
  if (!sanitized) {
    return { type: "invalid", reason: "Location contains no valid characters" };
  }

  return { type: "city", query: sanitized };
}

module.exports = { locationQuerySchema, parseLocation };
