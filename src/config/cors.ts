/**
 * CORS Configuration
 * Shared CORS settings for Express and Socket.io
 */

import { CorsOptions } from "cors";
import { envConfig } from "./env.js";

// Production frontend URLs (Netlify deployments)
// User app: https://relaxed-jalebi-73aff6.netlify.app
// Admin app: https://tambola-pro-admin.netlify.app
const allowedOrigins: string[] = [
  envConfig.FRONTEND_URL,
  // --- Production (Netlify) ---
  "https://tambola-pro-admin.netlify.app",
  "https://tambola-pro-admin.netlify.app/",
  "https://relaxed-jalebi-73aff6.netlify.app",
  "https://relaxed-jalebi-73aff6.netlify.app/",
  // --- Local development ---
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:5174",
  "http://127.0.0.1:5174",
  "http://localhost:3000",
  "http://localhost:3001",
].filter(Boolean) as string[]; // remove any undefined/empty values

/**
 * CORS configuration for Express middleware
 */
export const corsOptions: CorsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (server-to-server, curl, mobile apps)
    if (!origin) {
      return callback(null, true);
    }

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    // IMPORTANT: Return false (not an Error) so Express does NOT throw.
    // Throwing here causes the error handler to respond WITHOUT CORS headers,
    // which makes the browser report "No Access-Control-Allow-Origin".
    console.warn(`🚫 CORS Blocked: ${origin}`);
    return callback(null, false);
  },
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
  optionsSuccessStatus: 204, // Some browsers (Safari) choke on 204 for preflight
};

/**
 * CORS configuration for Socket.io
 */
export const socketCorsOptions = {
  origin: allowedOrigins,
  methods: ["GET", "POST"],
  credentials: true,
};
