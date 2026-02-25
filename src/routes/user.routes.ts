import { Router } from "express";
import { requireAuth } from "@clerk/express";
import * as UserController from "../controllers/user.controller.js";

const router = Router();

// General
router.get("/", requireAuth(), UserController.getUsers);
router.get("/winnings", requireAuth(), UserController.getWinnings);
router.get("/game-history", requireAuth(), UserController.getGameHistory);
router.get("/profile", requireAuth(), UserController.getProfile);
router.put("/profile", requireAuth(), UserController.updateProfile);

// Admin / ID Routes
router.post("/:id/ban", requireAuth(), UserController.toggleUserBan);
router.delete("/:id", requireAuth(), UserController.deleteUser);
router.get("/:id", requireAuth(), UserController.getUser);

export default router;