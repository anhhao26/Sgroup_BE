import { StatusCodes, ReasonPhrases } from 'http-status-codes';

export default function errorHandler(err, req, res, next) {
  console.error(err);
  if (err.statusCode) {
    return res.status(err.statusCode).json({
      success: false,
      code: err.statusCode,
      message: err.message
    });
  }
  return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
    success: false,
    code: StatusCodes.INTERNAL_SERVER_ERROR,
    message: err.message || ReasonPhrases.INTERNAL_SERVER_ERROR
  });
}
