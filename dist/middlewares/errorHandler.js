/**
 * Global Error Handler Middleware
 * Catches and formats all errors in a consistent way
 */
import { envConfig } from "../config/env.js";
/**
 * Global error handling middleware
 * Must be registered last in the middleware chain
 */
export const errorHandler = (err, req, res, _next) => {
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
export const notFoundHandler = (req, res, _next) => {
    res.status(404).json({
        success: false,
        status: "fail",
        message: `Route ${req.method} ${req.originalUrl} not found`,
    });
};
//# sourceMappingURL=errorHandler.js.map