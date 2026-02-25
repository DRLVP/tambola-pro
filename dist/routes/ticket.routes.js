import { Router } from "express";
import { purchaseTicket, claimPrize } from "../controllers/ticket.controller.js";
const router = Router();
// Purchase tickets
router.post("/purchase", purchaseTicket);
// Claim prize for a ticket
router.post("/:ticketId/claim", claimPrize);
export default router;
//# sourceMappingURL=ticket.routes.js.map