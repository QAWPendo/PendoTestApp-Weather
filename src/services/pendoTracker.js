const PENDO_TRACK_URL = "https://data.pendo-dev.pendo-dev.com/data/track";
const PENDO_INTEGRATION_KEY = "0fc6ba6b-2454-4ef6-9765-4ae0ac30e67c";

function pendoTrack(event, visitorId, accountId, properties, context) {
  const body = {
    type: "track",
    event,
    visitorId: visitorId || "system",
    accountId: accountId || "system",
    timestamp: Date.now(),
  };
  if (properties) {
    body.properties = properties;
  }
  if (context) {
    body.context = context;
  }

  fetch(PENDO_TRACK_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-pendo-integration-key": PENDO_INTEGRATION_KEY,
    },
    body: JSON.stringify(body),
  }).catch((err) => {
    console.error(`Pendo track error for "${event}":`, err.message);
  });
}

module.exports = { pendoTrack };
