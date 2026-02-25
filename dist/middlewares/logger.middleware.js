export const requestLogger = (req, res, next) => {
    const start = Date.now();
    // Log request start
    // console.log(`⏩ [${req.method}] ${req.originalUrl}`);
    // Hook into response finish to calculate duration
    res.on("finish", () => {
        const duration = Date.now() - start;
        const status = res.statusCode;
        // Colorize status code
        let statusIcon = "🟢";
        if (status >= 400)
            statusIcon = "🟡";
        if (status >= 500)
            statusIcon = "🔴";
        console.log(`${statusIcon} [${req.method}] ${req.originalUrl} - ${status} (${duration}ms)`);
    });
    next();
};
//# sourceMappingURL=logger.middleware.js.map