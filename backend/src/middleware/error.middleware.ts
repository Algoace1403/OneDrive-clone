import { Request, Response, NextFunction } from 'express';

export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  let statusCode = err.statusCode;
  let message = err.message;

  // Handle StorageApiError from Supabase
  if (err.__isStorageError) {
    statusCode = err.status || 500;
    // Handle string status codes from Supabase
    if (typeof statusCode === 'string') {
      statusCode = parseInt(statusCode, 10) || 500;
    }
    if (err.statusCode === '404') {
      message = 'Storage bucket not found. Please run setup script.';
      statusCode = 500;
    }
  }

  if (!statusCode || typeof statusCode !== 'number') {
    statusCode = 500;
  }

  if (process.env.NODE_ENV === 'development') {
    console.error('Error:', err);
  }

  // Supabase errors
  if (err.code && err.message) {
    // Handle specific Supabase errors
    if (err.code === '23505') {
      message = 'Email already registered';
      statusCode = 400;
    } else if (err.code === '42P01') {
      message = 'Database table not found. Please run the schema.sql file.';
      statusCode = 500;
    } else if (err.code === 'PGRST116') {
      message = 'Record not found';
      statusCode = 404;
    }
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map((e: any) => e.message);
    message = `Validation Error: ${errors.join(', ')}`;
    statusCode = 400;
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern)[0];
    message = `${field} already exists`;
    statusCode = 400;
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    message = 'Invalid token';
    statusCode = 401;
  }

  if (err.name === 'TokenExpiredError') {
    message = 'Token expired';
    statusCode = 401;
  }

  res.status(statusCode).json({
    success: false,
    error: message,
    ...(process.env.NODE_ENV === 'development' && { 
      stack: err.stack,
      details: err
    })
  });
};