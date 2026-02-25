/**
 * Authentication Routes
 * Routes for authentication-related endpoints
 */

import { Router } from "express";
import { requireAuth } from "@clerk/express";
import { assignRole, syncAdmin, syncUser } from "../controllers/auth.controller.js";

const router = Router();

/**
 * POST /api/auth/assign-role
 * Assign a role to the authenticated user
 * Protected by Clerk requireAuth middleware
 */
router.post("/assign-role", requireAuth(), assignRole);

// Sync User (Auto / Global)
router.post("/sync-user", requireAuth(), syncUser);

// We map '/sync-admin' to the 'syncUser' controller so the request is accepted
router.post("/sync-admin", requireAuth(), syncAdmin);

export default router;
