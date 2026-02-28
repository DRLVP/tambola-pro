import { Router } from "express";
import { requireAuth } from "@clerk/express";
import * as UserController from "../controllers/user.controller.js";
import { requireRole } from "../middlewares/role.middleware.js";

const router = Router();

// User routes (authenticated)
router.get("/winnings", requireAuth(), UserController.getWinnings);
router.get("/game-history", requireAuth(), UserController.getGameHistory);
router.get("/profile", requireAuth(), UserController.getProfile);
router.put("/profile", requireAuth(), UserController.updateProfile);

// Admin routes (admin role required)
router.get("/", requireAuth(), requireRole(['admin', 'super_admin']), UserController.getUsers);
router.post("/:id/ban", requireAuth(), requireRole(['admin', 'super_admin']), UserController.toggleUserBan);
router.delete("/:id", requireAuth(), requireRole(['admin', 'super_admin']), UserController.deleteUser);
router.get("/:id", requireAuth(), requireRole(['admin', 'super_admin']), UserController.getUser);

export default router;