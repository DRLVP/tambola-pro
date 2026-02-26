/**
 * Health Check Routes
 * Used by Render, monitoring tools, and frontend connectivity checks.
 *
 * Endpoints (all PUBLIC — no auth required):
 *   GET /health          → quick liveness ping
 *   GET /health/status   → detailed server + DB status
 *   GET /health/ready    → readiness probe (is DB connected?)
 */

import { Router, Request, Response } from "express";
import mongoose from "mongoose";
import { envConfig } from "../config/env.js";

const router = Router();

// ─── Helpers ─────────────────────────────────────────────────────────────────

const MB = 1024 * 1024;

function formatUptime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  return `${h}h ${m}m ${s}s`;
}

function dbState(): string {
  const states: Record<number, string> = {
    0: "disconnected",
    1: "connected",
    2: "connecting",
    3: "disconnecting",
  };
  return states[mongoose.connection.readyState] ?? "unknown";
}

// ─── GET /health ─────────────────────────────────────────────────────────────
/**
 * Liveness probe — lightest possible check.
 * Returns 200 as long as the Node process is alive.
 * Use this as the "Health Check URL" in your Render service settings.
 */
router.get("/", (_req: Request, res: Response): void => {
  res.status(200).json({
    success: true,
    message: "Tambola Pro API is alive 🟢",
    timestamp: new Date().toISOString(),
  });
});

// ─── GET /health/status ──────────────────────────────────────────────────────
/**
 * Detailed status — uptime, memory usage, environment, DB connection state.
 */
router.get("/status", (_req: Request, res: Response): void => {
  const mem = process.memoryUsage();
  const connected = mongoose.connection.readyState === 1;

  res.status(connected ? 200 : 503).json({
    success: connected,
    status: connected ? "healthy" : "degraded",
    environment: envConfig.NODE_ENV,
    timestamp: new Date().toISOString(),
    uptime: formatUptime(process.uptime()),
    server: {
      nodeVersion: process.version,
      platform: process.platform,
    },
    memory: {
      rss: `${(mem.rss / MB).toFixed(2)} MB`,
      heapUsed: `${(mem.heapUsed / MB).toFixed(2)} MB`,
      heapTotal: `${(mem.heapTotal / MB).toFixed(2)} MB`,
    },
    database: {
      state: dbState(),
      connected,
      host: mongoose.connection.host ?? "N/A",
      name: mongoose.connection.name ?? "N/A",
    },
  });
});

// ─── GET /health/ready ───────────────────────────────────────────────────────
/**
 * Readiness probe — only returns 200 when the DB is connected.
 * Useful for load balancers / orchestrators to avoid routing traffic
 * to a server that hasn't finished warming up.
 */
router.get("/ready", (_req: Request, res: Response): void => {
  const connected = mongoose.connection.readyState === 1;

  res.status(connected ? 200 : 503).json({
    success: connected,
    ready: connected,
    database: dbState(),
    timestamp: new Date().toISOString(),
  });
});

export default router;
