export class AppError extends Error {
  constructor(message, statusCode = 400) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
  }
}

export class ValidationError extends AppError {
  constructor(message, statusCode = 400) {
    super(message, statusCode);
    this.name = "ValidationError";
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Record not found.") {
    super(message, 404);
    this.name = "NotFoundError";
  }
}

export class ConflictError extends AppError {
  constructor(message) {
    super(message, 409);
    this.name = "ConflictError";
  }
}
