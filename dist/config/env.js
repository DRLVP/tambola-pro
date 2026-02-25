/**
 * Environment Configuration
 * Centralized environment variables with type safety and defaults
 */
import "dotenv/config";
export const envConfig = {
    // Server
    NODE_ENV: process.env.NODE_ENV || "development",
    PORT: parseInt(process.env.PORT || "8080", 10),
    // Frontend
    FRONTEND_URL: process.env.FRONTEND_URL || "http://localhost:5173",
    // Clerk Authentication
    CLERK_PUBLISHABLE_KEY: process.env.CLERK_PUBLISHABLE_KEY,
    CLERK_SECRET_KEY: process.env.CLERK_SECRET_KEY,
    // Database
    MONGODB_URL: process.env.MONGODB_URL || "mongodb://localhost:27017/tambola-pro",
};
//# sourceMappingURL=env.js.map