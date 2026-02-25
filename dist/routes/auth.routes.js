/**
 * Authentication Routes
 * Routes for authentication-related endpoints
 */
import { Router } from "express";
import { requireAuth } from "@clerk/express";
import { assignRole, syncUser } from "../controllers/auth.controller.js";
const router = Router();
/**
 * POST /api/auth/assign-role
 * Assign a role to the authenticated user
 * Protected by Clerk requireAuth middleware
 */
router.post("/assign-role", requireAuth(), assignRole);
// Sync User (Auto / Global)
router.post("/sync-user", requireAuth(), syncUser);
export default router;
//# sourceMappingURL=auth.routes.js.map