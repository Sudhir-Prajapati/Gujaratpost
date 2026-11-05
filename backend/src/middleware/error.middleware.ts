import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors.js';
import { sendError } from '../utils/response.js';

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Log unexpected errors
  if (!(err instanceof AppError)) {
    console.error(`[Unhandled Server Error] ${req.method} ${req.originalUrl}:`, err);
  }

  // 1. Check if error is our custom application error
  if (err instanceof AppError) {
    return sendError(res, err.message, err.statusCode, err.errors);
  }

  // 2. Check if error is a Zod validation error
  if (err.name === 'ZodError') {
    const formattedErrors = err.errors.map((issue: any) => ({
      field: issue.path.join('.'),
      message: issue.message,
    }));
    return sendError(res, 'Validation failed', 400, formattedErrors);
  }

  // 3. Check for JSONWebToken errors
  if (err.name === 'JsonWebTokenError') {
    return sendError(res, 'Invalid authorization token', 401);
  }
  if (err.name === 'TokenExpiredError') {
    return sendError(res, 'Authorization token expired', 401);
  }

  // 4. Default to 500 Internal Server Error
  const isProd = process.env.NODE_ENV === 'production';
  const devMessage = err.message || 'Internal Server Error';
  return sendError(
    res,
    isProd ? 'Something went wrong' : devMessage,
    500
  );
};
