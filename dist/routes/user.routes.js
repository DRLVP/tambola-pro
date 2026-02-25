import { Router } from "express";
import { requireAuth } from "@clerk/express";
import * as UserController from "../controllers/user.controller.js";
const router = Router();
// Analytics Routes
router.get("/winnings", requireAuth(), UserController.getWinnings);
router.get("/game-history", requireAuth(), UserController.getGameHistory);
// Profile Routes (Standard)
router.get("/profile", requireAuth(), UserController.getProfile);
router.put("/profile", requireAuth(), UserController.updateProfile);
// Admin User Management
router.delete("/:id", requireAuth(), UserController.deleteUser);
export default router;
//# sourceMappingURL=user.routes.js.map