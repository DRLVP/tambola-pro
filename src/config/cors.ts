/**
 * CORS Configuration
 * Shared CORS settings for Express and Socket.io
 */

import { CorsOptions } from "cors";
import { envConfig } from "./env.js";

// Allowed origins based on environment
const allowedOrigins = [
  envConfig.FRONTEND_URL,
  "http://localhost:5173",
  "http://127.0.0.1:5173",         // IP variant
  "http://localhost:5174",
  "http://127.0.0.1:5174",         // IP variant
  "http://localhost:3000",
  "http://localhost:3001",
  // Add more origins for staging/production as needed
];

/**
 * CORS configuration for Express middleware
 */
export const corsOptions: CorsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, etc.) in development
    if (!origin) {
      return callback(null, true);
    }

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    console.log(`🚫 CORS Blocked: ${origin}. Allowed: ${allowedOrigins.join(", ")}`);
    callback(new Error(`CORS not allowed for origin: ${origin}`));
  },
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
};

/**
 * CORS configuration for Socket.io
 */
export const socketCorsOptions = {
  origin: allowedOrigins,
  methods: ["GET", "POST"],
  credentials: true,
};
