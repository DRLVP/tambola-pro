/**
 * Tambola Pro Backend
 * Main Application Entry Point
 */

import express, { Request, Response } from "express";
import http from "http";
import cors from "cors";
import "dotenv/config";
import { clerkMiddleware } from "@clerk/express";

// Config
import { envConfig } from "./config/env.js";
import { corsOptions } from "./config/cors.js";
import { connectDB } from "./config/db.js";

// Routes
import routes from "./routes/index.js";

// Middleware
import { errorHandler, notFoundHandler } from "./middlewares/errorHandler.js";
import { requestLogger } from "./middlewares/logger.middleware.js";

// Socket
import { initializeSocket } from "./socket/index.js";

// Initialize Express app
const app = express();

// ============================================
// Middleware Stack
// ============================================

// Body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logger
app.use(requestLogger);

// CORS
app.use(cors(corsOptions));

// Clerk authentication
app.use(clerkMiddleware());

// ============================================
// Routes
// ============================================

// Health check endpoint
app.get("/", (req: Request, res: Response) => {
  res.json({
    message: "Tambola Pro Backend API",
    status: "running",
    environment: envConfig.NODE_ENV,
    timestamp: new Date().toISOString(),
  });
});

// API routes
app.use("/api", routes);

// ============================================
// Error Handling
// ============================================

// 404 handler (must be after all routes)
app.use(notFoundHandler);

// Global error handler (must be last)
app.use(errorHandler);

// ============================================
// Server Initialization
// ============================================

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.io
initializeSocket(server);

// Start server function
const startServer = async () => {
  try {
    // 1. Connect to Database
    await connectDB();

    // 2. Start HTTP server
    server.listen(envConfig.PORT, () => {
      console.log(`
🚀 ================================
   Tambola Pro Backend Started
   ================================
   🌍 Environment: ${envConfig.NODE_ENV}
   🔗 URL: http://localhost:${envConfig.PORT}
   🔌 Socket.io: Enabled
   ================================
      `);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("🛑 SIGTERM received. Shutting down gracefully...");
  server.close(() => {
    console.log("✅ Server closed");
    process.exit(0);
  });
});
