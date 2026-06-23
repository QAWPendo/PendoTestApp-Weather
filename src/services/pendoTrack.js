const PENDO_TRACK_URL = "https://app.pendo.io/data/track";

function trackEvent(trackType, visitorId, accountId, properties) {
  const integrationKey = process.env.PENDO_INTEGRATION_KEY;
  if (!integrationKey) return;

  const body = {
    type: "track",
    event: trackType,
    visitorId: visitorId,
    accountId: accountId,
    timestamp: Date.now(),
    properties: properties || {},
  };

  fetch(PENDO_TRACK_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-pendo-integration-key": integrationKey,
    },
    body: JSON.stringify(body),
  }).catch(() => {});
}

module.exports = { trackEvent };
