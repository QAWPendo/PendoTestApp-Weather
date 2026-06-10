console.log("hello world");

const { formatErrorResponse, ERROR_CODES, AppError } = require("../utils/errors");

function notFoundHandler(req, res, next) {
  next(new AppError(ERROR_CODES.NOT_FOUND, `Route ${req.method} ${req.path} not found`, 404));
}

function errorHandler(err, req, res, _next) {
  if (err.name === "ZodError") {
    const details = err.issues.map((i) => ({
      field: i.path.join("."),
      message: i.message,
    }));
    return res.status(400).json({
      error: ERROR_CODES.VALIDATION_ERROR,
      message: "Request validation failed",
      details,
    });
  }

  const { statusCode, body } = formatErrorResponse(err);

  if (statusCode >= 500) {
    console.error("Unhandled error:", err);
  }

  res.status(statusCode).json(body);
}

module.exports = { errorHandler, notFoundHandler };
