const PENDO_TRACK_URL = "https://data.pendo-dev.pendo-dev.com/data/track";
const PENDO_INTEGRATION_KEY = "252faf71-8ff3-459c-8b12-e4710dda5c03";

async function trackEvent(eventName, { visitorId = "anonymous", accountId = "anonymous", properties = {}, context = {} } = {}) {
  try {
    const response = await fetch(PENDO_TRACK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-pendo-integration-key": PENDO_INTEGRATION_KEY,
      },
      body: JSON.stringify({
        type: "track",
        event: eventName,
        visitorId,
        accountId,
        timestamp: Date.now(),
        properties,
        context,
      }),
    });
    if (!response.ok) {
      console.error(`Pendo track event failed: ${response.status}`);
    }
  } catch (err) {
    console.error("Pendo track event error:", err.message);
  }
}

module.exports = { trackEvent };
