import { StatusCodes, ReasonPhrases } from 'http-status-codes';

class ApiError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
  }
}

export class BadRequestError extends ApiError {
  constructor(message = ReasonPhrases.BAD_REQUEST) {
    super(message, StatusCodes.BAD_REQUEST);
  }
}

export class UnauthorizedError extends ApiError {
  constructor(message = ReasonPhrases.UNAUTHORIZED) {
    super(message, StatusCodes.UNAUTHORIZED);
  }
}

export class ForbiddenError extends ApiError {
  constructor(message = ReasonPhrases.FORBIDDEN) {
    super(message, StatusCodes.FORBIDDEN);
  }
}

export class NotFoundError extends ApiError {
  constructor(message = ReasonPhrases.NOT_FOUND) {
    super(message, StatusCodes.NOT_FOUND);
  }
}

export class ConflictError extends ApiError {
  constructor(message = ReasonPhrases.CONFLICT) {
    super(message, StatusCodes.CONFLICT);
  }
}

// tra ve suscesss
export class SuccessResponse {
  constructor({ message = ReasonPhrases.OK, statusCode = StatusCodes.OK, data = {} }) {
    this.statusCode = statusCode;
    this.message = message;
    this.data = data;
  }

  send(res) {
    return res.status(this.statusCode).json({
      success: true,
      message: this.message,
      data: this.data
    });
  }
}
