import { Router } from "express";
import { requireAuth } from "@clerk/express";
import { getDashboardStats } from "../controllers/admin.controller.js";
import { requireRole } from "../middlewares/role.middleware.js";

const router = Router();

// Dashboard Analytics (Admin only)
router.get("/dashboard/stats", requireAuth(), requireRole(['admin', 'super_admin']), getDashboardStats);

export default router;