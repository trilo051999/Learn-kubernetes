import { Request, Response, NextFunction } from 'express';

// Express detects error handling middleware by checking if the function has exactly 4 arguments.
export function errorHandler(
  err: Error & { status?: number },
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  console.error('Unhandled Error:', err);

  const statusCode = err.status || 500;
  const message = err.message || 'Internal Server Error';

  res.status(statusCode).json({
    error: message
  });
}
