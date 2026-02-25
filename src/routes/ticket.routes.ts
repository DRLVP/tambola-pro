import { Router } from "express";
import { requireAuth } from "@clerk/express";
import * as TicketController from "../controllers/ticket.controller.js";

const router = Router();

// Static routes first
router.post("/purchase", requireAuth(), TicketController.purchaseTicket);
router.get("/my", requireAuth(), TicketController.getMyTickets);
router.get("/", requireAuth(), TicketController.getAllTickets);

// Dynamic routes next
router.get("/:ticketId", requireAuth(), TicketController.getTicket);
router.post("/:ticketId/mark", requireAuth(), TicketController.markNumber);
router.post("/:ticketId/claim", requireAuth(), TicketController.claimPrize);

// Admin Actions
router.post("/:ticketId/confirm", requireAuth(), TicketController.confirmTicket);
router.post("/:ticketId/cancel", requireAuth(), TicketController.cancelTicket);

export default router;