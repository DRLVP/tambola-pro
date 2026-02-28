import { Router } from "express";
import { requireAuth } from "@clerk/express";
import * as GameController from "../controllers/game.controller.js";
import { requireRole } from "../middlewares/role.middleware.js";

const router = Router();

// Public/User routes
router.get("/", GameController.getGames);
router.get("/active", GameController.getGames);
router.get("/available", GameController.getAvailableGames);

// Admin/Protected routes
router.post("/", requireAuth(), requireRole(['admin', 'super_admin']), GameController.createGame);

// ID-based Routes
router.get("/:id/results", GameController.getGameResults);
router.get("/:id", GameController.getGame);
router.put("/:id", requireAuth(), requireRole(['admin', 'super_admin']), GameController.updateGame);
router.delete("/:id", requireAuth(), requireRole(['admin', 'super_admin']), GameController.deleteGame);

// Game Actions (Admin only)
router.post("/:id/call", requireAuth(), requireRole(['admin', 'super_admin']), GameController.callNumber);
router.post("/:id/start", requireAuth(), requireRole(['admin', 'super_admin']), GameController.startGame);
router.post("/:id/end", requireAuth(), requireRole(['admin', 'super_admin']), GameController.endGame);
router.post("/:id/pause", requireAuth(), requireRole(['admin', 'super_admin']), GameController.pauseGame);
router.post("/:id/resume", requireAuth(), requireRole(['admin', 'super_admin']), GameController.resumeGame);
router.post("/:id/auto-play", requireAuth(), requireRole(['admin', 'super_admin']), GameController.startAutoPlay);
router.post("/:id/stop-auto-play", requireAuth(), requireRole(['admin', 'super_admin']), GameController.stopAutoPlay);

export default router;