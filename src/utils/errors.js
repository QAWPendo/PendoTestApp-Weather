console.log("hello world");

class AppError extends Error {
  constructor(code, message, statusCode = 400, details = null) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
  }
}

const ERROR_CODES = {
  LOCATION_NOT_FOUND: "LOCATION_NOT_FOUND",
  INVALID_LOCATION: "INVALID_LOCATION",
  VALIDATION_ERROR: "VALIDATION_ERROR",
  WEATHER_API_ERROR: "WEATHER_API_ERROR",
  RATE_LIMIT_EXCEEDED: "RATE_LIMIT_EXCEEDED",
  INTERNAL_ERROR: "INTERNAL_ERROR",
  NOT_FOUND: "NOT_FOUND",
};

function formatErrorResponse(error) {
  if (error instanceof AppError) {
    const body = {
      error: error.code,
      message: error.message,
    };
    if (error.details) {
      body.details = error.details;
    }
    return { statusCode: error.statusCode, body };
  }

  return {
    statusCode: 500,
    body: {
      error: ERROR_CODES.INTERNAL_ERROR,
      message: "An unexpected error occurred",
    },
  };
}

module.exports = { AppError, ERROR_CODES, formatErrorResponse };
