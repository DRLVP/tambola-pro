import { Router } from "express";
import { requireAuth } from "@clerk/express";
import * as GameController from "../controllers/game.controller.js";

const router = Router();

// Public/User routes
router.get("/", GameController.getGames);
router.get("/active", GameController.getGames);
router.get("/available", GameController.getAvailableGames);

// Admin/Protected routes
router.post("/", requireAuth(), GameController.createGame);

// ID-based Routes
router.get("/:id", GameController.getGame);
router.put("/:id", requireAuth(), GameController.updateGame);
router.delete("/:id", requireAuth(), GameController.deleteGame);

// Game Actions
router.post("/:id/call", requireAuth(), GameController.callNumber);
router.post("/:id/start", requireAuth(), GameController.startGame);
router.post("/:id/end", requireAuth(), GameController.endGame);
router.post("/:id/pause", requireAuth(), GameController.pauseGame);
router.post("/:id/resume", requireAuth(), GameController.resumeGame);
router.post("/:id/auto-play", requireAuth(), GameController.startAutoPlay);
router.post("/:id/stop-auto-play", requireAuth(), GameController.stopAutoPlay);

export default router;