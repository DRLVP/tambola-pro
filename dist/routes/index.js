import { Router } from "express";
import authRoutes from "./auth.routes.js";
import gameRoutes from "./game.routes.js";
import ticketRoutes from "./ticket.routes.js";
import userRoutes from "./user.routes.js";
import adminRoutes from "./admin.routes.js"; // Import new admin routes
const router = Router();
router.use("/auth", authRoutes);
router.use("/games", gameRoutes);
router.use("/tickets", ticketRoutes);
router.use("/users", userRoutes);
router.use("/admin", adminRoutes); // Mount admin routes
export default router;
//# sourceMappingURL=index.js.map