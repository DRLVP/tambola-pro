import { Router } from "express";
import { requireAuth } from "@clerk/express";
import * as TicketController from "../controllers/ticket.controller.js";
import { requireRole } from "../middlewares/role.middleware.js";

const router = Router();

// User routes
router.post("/purchase", requireAuth(), TicketController.purchaseTicket);
router.get("/my", requireAuth(), TicketController.getMyTickets);

// Admin routes
router.get("/", requireAuth(), requireRole(['admin', 'super_admin']), TicketController.getAllTickets);
router.get("/pending", requireAuth(), requireRole(['admin', 'super_admin']), TicketController.getPendingTickets);
router.get("/game/:gameId", requireAuth(), requireRole(['admin', 'super_admin']), TicketController.getGameTickets);

// Dynamic routes (user)
router.get("/:ticketId", requireAuth(), TicketController.getTicket);
router.post("/:ticketId/mark", requireAuth(), TicketController.markNumber);
router.post("/:ticketId/claim", requireAuth(), TicketController.claimPrize);

// Admin Actions
router.post("/:ticketId/confirm", requireAuth(), requireRole(['admin', 'super_admin']), TicketController.confirmTicket);
router.post("/:ticketId/cancel", requireAuth(), requireRole(['admin', 'super_admin']), TicketController.cancelTicket);

export default router;