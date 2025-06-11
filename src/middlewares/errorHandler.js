import { StatusCodes, ReasonPhrases } from 'http-status-codes';

export default function errorHandler(err, req, res, next) {
  console.error(err);

  // Nếu error là instance của ApiError (có thuộc tín h statusCode)
  if (err.statusCode) {
    return res.status(err.statusCode).json({
      success: false,
      code: err.statusCode,
      message: err.message
    });
  }

  // Nếu không phải ApiError → Internal Server Error
  return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
    success: false,
    code: StatusCodes.INTERNAL_SERVER_ERROR,
    message: err.message || ReasonPhrases.INTERNAL_SERVER_ERROR
  });
}
