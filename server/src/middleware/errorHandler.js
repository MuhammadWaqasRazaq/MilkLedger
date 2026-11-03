import mongoose from "mongoose";

export function notFoundHandler(req, res) {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
}

export function errorHandler(err, req, res, next) {
  if (res.headersSent) return next(err);

  let statusCode = err.statusCode || 500;
  let message = err.message || "Something went wrong.";

  if (err instanceof mongoose.Error.ValidationError) {
    statusCode = 400;
    const first = Object.values(err.errors)[0];
    message = first?.message || "Validation failed.";
  } else if (err instanceof mongoose.Error.CastError) {
    statusCode = 400;
    message = "Invalid record identifier.";
  } else if (err.code === 11000) {
    statusCode = 409;
    message = "A record with the same details already exists.";
  }

  if (statusCode >= 500) {
    console.error("[server error]", err);
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === "development" && statusCode >= 500
      ? { stack: err.stack }
      : {}),
  });
}
