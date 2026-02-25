/**
 * Global Error Handler Middleware
 * Catches and formats all errors in a consistent way
 */
import { Request, Response, NextFunction } from "express";
interface AppError extends Error {
    statusCode?: number;
    status?: string;
}
/**
 * Global error handling middleware
 * Must be registered last in the middleware chain
 */
export declare const errorHandler: (err: AppError, req: Request, res: Response, _next: NextFunction) => void;
/**
 * 404 Not Found handler
 * Catches requests to undefined routes
 */
export declare const notFoundHandler: (req: Request, res: Response, _next: NextFunction) => void;
export {};
//# sourceMappingURL=errorHandler.d.ts.map