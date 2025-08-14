/**
 * 404 Not Found handler
 */
const notFound = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error);
};

/**
 * Global error handler
 */
const errorHandler = (err, req, res, next) => {
  // Default to 500 server error
  let statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  let message = err.message;

  // Mongoose bad ObjectId
  if (err.name === "CastError" && err.kind === "ObjectId") {
    statusCode = 404;
    message = "Resource not found";
  }

  // Validation errors
  if (err.name === "ValidationError") {
    statusCode = 400;
    message = "Validation Error";
  }

  // JWT errors
  if (err.name === "JsonWebTokenError") {
    statusCode = 401;
    message = "Invalid token";
  }

  // JWT expired
  if (err.name === "TokenExpiredError") {
    statusCode = 401;
    message = "Token expired";
  }

  // File size errors
  if (err.code === "LIMIT_FILE_SIZE") {
    statusCode = 413;
    message = "File too large";
  }

  // Rate limit errors
  if (err.message && err.message.includes("Too many requests")) {
    statusCode = 429;
  }

  // Log error in development
  if (process.env.NODE_ENV === "development") {
    console.error("Error:", {
      message: err.message,
      stack: err.stack,
      url: req.originalUrl,
      method: req.method,
      ip: req.ip,
      userAgent: req.get("User-Agent"),
    });
  }

  res.status(statusCode).json({
    success: false,
    error: message,
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
    timestamp: new Date().toISOString(),
    path: req.originalUrl,
    method: req.method,
  });
};

module.exports = {
  notFound,
  errorHandler,
};
