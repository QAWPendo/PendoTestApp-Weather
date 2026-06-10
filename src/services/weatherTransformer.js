console.log("hello world");

const CONDITION_CODES = {
  200: { code: "THUNDERSTORM_LIGHT", description: "Thunderstorm with light rain" },
  201: { code: "THUNDERSTORM_RAIN", description: "Thunderstorm with rain" },
  202: { code: "THUNDERSTORM_HEAVY", description: "Thunderstorm with heavy rain" },
  210: { code: "THUNDERSTORM_LIGHT", description: "Light thunderstorm" },
  211: { code: "THUNDERSTORM", description: "Thunderstorm" },
  212: { code: "THUNDERSTORM_HEAVY", description: "Heavy thunderstorm" },
  221: { code: "THUNDERSTORM_RAGGED", description: "Ragged thunderstorm" },
  230: { code: "THUNDERSTORM_DRIZZLE", description: "Thunderstorm with light drizzle" },
  231: { code: "THUNDERSTORM_DRIZZLE", description: "Thunderstorm with drizzle" },
  232: { code: "THUNDERSTORM_DRIZZLE_HEAVY", description: "Thunderstorm with heavy drizzle" },
  300: { code: "DRIZZLE_LIGHT", description: "Light intensity drizzle" },
  301: { code: "DRIZZLE", description: "Drizzle" },
  302: { code: "DRIZZLE_HEAVY", description: "Heavy intensity drizzle" },
  310: { code: "DRIZZLE_LIGHT", description: "Light intensity drizzle rain" },
  311: { code: "DRIZZLE", description: "Drizzle rain" },
  312: { code: "DRIZZLE_HEAVY", description: "Heavy intensity drizzle rain" },
  313: { code: "DRIZZLE_SHOWER", description: "Shower rain and drizzle" },
  314: { code: "DRIZZLE_SHOWER_HEAVY", description: "Heavy shower rain and drizzle" },
  321: { code: "DRIZZLE_SHOWER", description: "Shower drizzle" },
  500: { code: "RAIN_LIGHT", description: "Light rain" },
  501: { code: "RAIN_MODERATE", description: "Moderate rain" },
  502: { code: "RAIN_HEAVY", description: "Heavy intensity rain" },
  503: { code: "RAIN_VERY_HEAVY", description: "Very heavy rain" },
  504: { code: "RAIN_EXTREME", description: "Extreme rain" },
  511: { code: "RAIN_FREEZING", description: "Freezing rain" },
  520: { code: "RAIN_SHOWER_LIGHT", description: "Light intensity shower rain" },
  521: { code: "RAIN_SHOWER", description: "Shower rain" },
  522: { code: "RAIN_SHOWER_HEAVY", description: "Heavy intensity shower rain" },
  531: { code: "RAIN_SHOWER_RAGGED", description: "Ragged shower rain" },
  600: { code: "SNOW_LIGHT", description: "Light snow" },
  601: { code: "SNOW", description: "Snow" },
  602: { code: "SNOW_HEAVY", description: "Heavy snow" },
  611: { code: "SLEET", description: "Sleet" },
  612: { code: "SLEET_SHOWER_LIGHT", description: "Light shower sleet" },
  613: { code: "SLEET_SHOWER", description: "Shower sleet" },
  615: { code: "RAIN_SNOW_LIGHT", description: "Light rain and snow" },
  616: { code: "RAIN_SNOW", description: "Rain and snow" },
  620: { code: "SNOW_SHOWER_LIGHT", description: "Light shower snow" },
  621: { code: "SNOW_SHOWER", description: "Shower snow" },
  622: { code: "SNOW_SHOWER_HEAVY", description: "Heavy shower snow" },
  701: { code: "MIST", description: "Mist" },
  711: { code: "SMOKE", description: "Smoke" },
  721: { code: "HAZE", description: "Haze" },
  731: { code: "DUST_WHIRLS", description: "Sand/dust whirls" },
  741: { code: "FOG", description: "Fog" },
  751: { code: "SAND", description: "Sand" },
  761: { code: "DUST", description: "Dust" },
  762: { code: "ASH", description: "Volcanic ash" },
  771: { code: "SQUALL", description: "Squalls" },
  781: { code: "TORNADO", description: "Tornado" },
  800: { code: "CLEAR", description: "Clear sky" },
  801: { code: "CLOUDS_FEW", description: "Few clouds" },
  802: { code: "CLOUDS_SCATTERED", description: "Scattered clouds" },
  803: { code: "CLOUDS_BROKEN", description: "Broken clouds" },
  804: { code: "CLOUDS_OVERCAST", description: "Overcast clouds" },
};

function celsiusToFahrenheit(c) {
  return Math.round((c * 9) / 5 + 32);
}

function msToMph(ms) {
  return Math.round(ms * 2.237 * 10) / 10;
}

function hpaToInHg(hpa) {
  return Math.round((hpa * 0.02953) * 100) / 100;
}

function mmToInches(mm) {
  return Math.round((mm / 25.4) * 100) / 100;
}

function mToFeet(m) {
  return Math.round(m * 3.281);
}

function toIso8601(unixSeconds, timezoneOffset = 0) {
  const date = new Date((unixSeconds + timezoneOffset) * 1000);
  return date.toISOString().replace("Z", formatOffset(timezoneOffset));
}

function formatOffset(offsetSeconds) {
  const sign = offsetSeconds >= 0 ? "+" : "-";
  const abs = Math.abs(offsetSeconds);
  const hours = String(Math.floor(abs / 3600)).padStart(2, "0");
  const minutes = String(Math.floor((abs % 3600) / 60)).padStart(2, "0");
  return `${sign}${hours}:${minutes}`;
}

function mapCondition(weatherArray) {
  const primary = weatherArray?.[0] || {};
  const id = primary.id || 800;
  const mapped = CONDITION_CODES[id] || {
    code: "UNKNOWN",
    description: primary.description || "Unknown conditions",
  };
  return {
    conditionCode: mapped.code,
    conditionId: id,
    description: primary.description || mapped.description,
    icon: primary.icon || null,
    main: primary.main || null,
  };
}

function dualUnits(metricValues) {
  return {
    metric: metricValues,
    imperial: {
      temperature: celsiusToFahrenheit(metricValues.temperature),
      feelsLike: celsiusToFahrenheit(metricValues.feelsLike),
      tempMin: metricValues.tempMin != null ? celsiusToFahrenheit(metricValues.tempMin) : undefined,
      tempMax: metricValues.tempMax != null ? celsiusToFahrenheit(metricValues.tempMax) : undefined,
      windSpeed: msToMph(metricValues.windSpeed),
      windGust: metricValues.windGust != null ? msToMph(metricValues.windGust) : undefined,
      pressure: hpaToInHg(metricValues.pressure),
      visibility: metricValues.visibility != null ? mToFeet(metricValues.visibility) : undefined,
      precipitation: metricValues.precipitation != null ? mmToInches(metricValues.precipitation) : undefined,
      dewPoint: metricValues.dewPoint != null ? celsiusToFahrenheit(metricValues.dewPoint) : undefined,
    },
  };
}

function transformCurrent(current, timezoneOffset) {
  const condition = mapCondition(current.weather);
  const metricValues = {
    temperature: Math.round(current.temp),
    feelsLike: Math.round(current.feels_like),
    windSpeed: current.wind_speed,
    windGust: current.wind_gust,
    pressure: current.pressure,
    visibility: current.visibility,
    precipitation: current.rain?.["1h"] || current.snow?.["1h"] || 0,
    dewPoint: current.dew_point,
  };

  return {
    timestamp: toIso8601(current.dt, timezoneOffset),
    ...condition,
    units: dualUnits(metricValues),
    humidity: current.humidity,
    clouds: current.clouds,
    uvIndex: current.uvi,
    windDirection: current.wind_deg,
    sunrise: current.sunrise ? toIso8601(current.sunrise, timezoneOffset) : null,
    sunset: current.sunset ? toIso8601(current.sunset, timezoneOffset) : null,
  };
}

function transformHourly(hourly, timezoneOffset, hours) {
  return hourly.slice(0, hours).map((hour) => {
    const condition = mapCondition(hour.weather);
    const metricValues = {
      temperature: Math.round(hour.temp),
      feelsLike: Math.round(hour.feels_like),
      windSpeed: hour.wind_speed,
      windGust: hour.wind_gust,
      pressure: hour.pressure,
      precipitation: hour.rain?.["1h"] || hour.snow?.["1h"] || 0,
      dewPoint: hour.dew_point,
    };

    return {
      timestamp: toIso8601(hour.dt, timezoneOffset),
      ...condition,
      units: dualUnits(metricValues),
      humidity: hour.humidity,
      clouds: hour.clouds,
      uvIndex: hour.uvi,
      windDirection: hour.wind_deg,
      precipitationProbability: hour.pop != null ? Math.round(hour.pop * 100) : null,
    };
  });
}

function transformDaily(daily, timezoneOffset, days) {
  return daily.slice(0, days).map((day) => {
    const condition = mapCondition(day.weather);
    const metricValues = {
      temperature: Math.round(day.temp.day),
      feelsLike: Math.round(day.feels_like.day),
      tempMin: Math.round(day.temp.min),
      tempMax: Math.round(day.temp.max),
      windSpeed: day.wind_speed,
      windGust: day.wind_gust,
      pressure: day.pressure,
      precipitation: day.rain || day.snow || 0,
      dewPoint: day.dew_point,
    };

    return {
      timestamp: toIso8601(day.dt, timezoneOffset),
      date: toIso8601(day.dt, timezoneOffset).split("T")[0],
      ...condition,
      units: dualUnits(metricValues),
      humidity: day.humidity,
      clouds: day.clouds,
      uvIndex: day.uvi,
      windDirection: day.wind_deg,
      precipitationProbability: day.pop != null ? Math.round(day.pop * 100) : null,
      sunrise: toIso8601(day.sunrise, timezoneOffset),
      sunset: toIso8601(day.sunset, timezoneOffset),
    };
  });
}

function transformAlerts(alerts, timezoneOffset) {
  return (alerts || []).map((alert) => ({
    id: alert.id || null,
    sender: alert.sender_name,
    event: alert.event,
    start: toIso8601(alert.start, timezoneOffset),
    end: toIso8601(alert.end, timezoneOffset),
    description: alert.description,
    tags: alert.tags || [],
  }));
}

function dayName(isoTimestamp) {
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  return days[new Date(isoTimestamp).getUTCDay()];
}

function generateCurrentSummary(current, location) {
  const tempF = current.units.imperial.temperature;
  const tempC = current.units.metric.temperature;
  const desc = current.description;
  const place = location.name + (location.country ? `, ${location.country}` : "");
  return `Currently ${desc} in ${place} with a temperature of ${tempF}°F (${tempC}°C), feels like ${current.units.imperial.feelsLike}°F. Humidity is ${current.humidity}% with ${current.clouds}% cloud cover.`;
}

function generateHourlySummary(hourly) {
  if (!hourly.length) return "No hourly forecast available.";
  const rainy = hourly.filter((h) => h.precipitationProbability > 50);
  if (rainy.length) {
    const first = rainy[0];
    const time = new Date(first.timestamp).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
    return `Precipitation likely around ${time} with ${first.precipitationProbability}% chance of ${first.description.toLowerCase()}. Highs around ${first.units.imperial.temperature}°F over the next ${hourly.length} hours.`;
  }
  const avgHigh = Math.round(hourly.reduce((s, h) => s + h.units.imperial.temperature, 0) / hourly.length);
  return `Dry conditions expected over the next ${hourly.length} hours with temperatures averaging around ${avgHigh}°F.`;
}

function generateDailySummary(daily) {
  if (!daily.length) return "No daily forecast available.";
  const rainDays = daily.filter((d) => d.precipitationProbability > 40);
  if (rainDays.length) {
    const day = rainDays[0];
    return `Expect ${day.description.toLowerCase()} on ${dayName(day.timestamp)}, highs around ${day.units.imperial.tempMax}°F (${day.units.metric.tempMax}°C).`;
  }
  const today = daily[0];
  return `${dayName(today.timestamp)}: ${today.description} with highs around ${today.units.imperial.tempMax}°F and lows near ${today.units.imperial.tempMin}°F. ${daily.length}-day outlook is mostly dry.`;
}

function generateAlertsSummary(alerts) {
  if (!alerts.length) return "No severe weather alerts at this time.";
  const events = [...new Set(alerts.map((a) => a.event))];
  return `${alerts.length} active alert(s): ${events.join(", ")}. Review alert details for timing and affected areas.`;
}

function generateSummarySummary(current, daily, alerts, location) {
  const parts = [
    generateCurrentSummary(current, location),
    generateDailySummary(daily),
  ];
  if (alerts.length) {
    parts.push(generateAlertsSummary(alerts));
  }
  return parts.join(" ");
}

function buildMeta(location, quality, fromCache) {
  return {
    location: {
      name: location.name,
      country: location.country,
      state: location.state,
      coordinates: { lat: location.lat, lon: location.lon },
    },
    quality,
    cached: fromCache,
    generatedAt: new Date().toISOString(),
  };
}

module.exports = {
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
  mapCondition,
};
