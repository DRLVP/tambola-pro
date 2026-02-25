/**
 * Logger Middleware
 * Logs incoming requests with method, url, status, and duration
 */
import { Request, Response, NextFunction } from "express";

export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();

  // Log request start
  // console.log(`⏩ [${req.method}] ${req.originalUrl}`);

  // Hook into response finish to calculate duration
  res.on("finish", () => {
    const duration = Date.now() - start;
    const status = res.statusCode;

    // Colorize status code
    let statusIcon = "🟢";
    if (status >= 400) statusIcon = "🟡";
    if (status >= 500) statusIcon = "🔴";

    console.log(`${statusIcon} [${req.method}] ${req.originalUrl} - ${status} (${duration}ms)`);
  });

  next();
};
