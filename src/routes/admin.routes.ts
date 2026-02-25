import { Router } from "express";
import { requireAuth } from "@clerk/express";
import { getDashboardStats } from "../controllers/admin.controller.js";

const router = Router();

// Dashboard Analytics
// Ensure you have a middleware to check 'admin' role if strictly required
router.get("/dashboard/stats", requireAuth(), getDashboardStats);

export default router;