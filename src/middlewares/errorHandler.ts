/**
 * Global Error Handler Middleware
 * Catches and formats all errors in a consistent way
 */

import { Request, Response, NextFunction } from "express";
import { envConfig } from "../config/env.js";

interface AppError extends Error {
  statusCode?: number;
  status?: string;
}

/**
 * Global error handling middleware
 * Must be registered last in the middleware chain
 */
export const errorHandler = (
  err: AppError,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  const statusCode = err.statusCode || 500;
  const status = err.status || "error";

  console.error(`❌ Error [${statusCode}]:`, err.message);

  // Stack trace only in development
  if (envConfig.NODE_ENV === "development") {
    console.error(err.stack);
  }

  res.status(statusCode).json({
    success: false,
    status,
    message: err.message || "Internal Server Error",
    ...(envConfig.NODE_ENV === "development" && { stack: err.stack }),
  });
};

/**
 * 404 Not Found handler
 * Catches requests to undefined routes
 */
export const notFoundHandler = (
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  res.status(404).json({
    success: false,
    status: "fail",
    message: `Route ${req.method} ${req.originalUrl} not found`,
  });
};
