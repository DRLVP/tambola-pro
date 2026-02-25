import { Router } from "express";
import { requireAuth } from "@clerk/express";
import * as GameController from "../controllers/game.controller.js";
const router = Router();
// Public/User routes
router.get("/", GameController.getGames);
router.get("/active", GameController.getGames); // Reuse getGames with status filter logic
// Admin/Protected routes
router.post("/", requireAuth(), GameController.createGame);
router.post("/:id/call", requireAuth(), GameController.callNumber);
router.post("/:id/start", requireAuth(), GameController.startGame);
export default router;
//# sourceMappingURL=game.routes.js.map