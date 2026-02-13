import { Request, Response, NextFunction } from 'express';

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) {
  console.error('Error:', err);
  
  res.status(500).json({
    success: false,
    error: err.message || '服务器内部错误',
  });
}
