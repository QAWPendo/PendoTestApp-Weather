const TRACK_URL = "https://app.pendo.io/data/track";

function track(visitorId, accountId, eventName, properties) {
  const integrationKey = process.env.PENDO_INTEGRATION_KEY;
  if (!integrationKey) return;

  const payload = {
    type: "track",
    event: eventName,
    visitorId: visitorId || "server",
    accountId: accountId || "",
    timestamp: Date.now(),
    properties: properties || {},
  };

  fetch(TRACK_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-pendo-integration-key": integrationKey,
    },
    body: JSON.stringify(payload),
  }).catch(() => {});
}

module.exports = { track };
