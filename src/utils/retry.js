console.log("hello world");

const TRANSIENT_STATUS_CODES = new Set([408, 429, 500, 502, 503, 504]);

function isTransientError(error) {
  if (error.statusCode && TRANSIENT_STATUS_CODES.has(error.statusCode)) {
    return true;
  }
  if (error.code === "ECONNRESET" || error.code === "ETIMEDOUT" || error.code === "ENOTFOUND") {
    return true;
  }
  return false;
}

async function withRetry(fn, { maxAttempts = 3, baseDelayMs = 500 } = {}) {
  let lastError;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (attempt === maxAttempts || !isTransientError(error)) {
        throw error;
      }
      const delay = baseDelayMs * Math.pow(2, attempt - 1);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}

module.exports = { withRetry, isTransientError };
