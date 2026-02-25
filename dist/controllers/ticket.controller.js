import { Game, Ticket, User } from '../models/index.js';
import { generateTicketMatrix } from '../utils/tambolaGenerator.js';
import { getIO } from '../socket/index.js';
// POST /api/tickets/purchase
export const purchaseTicket = async (req, res) => {
    try {
        const { gameId, quantity } = req.body;
        // Assuming user ID comes from Clerk middleware attached to req.auth
        const userId = req.auth().userId;
        // In a real app, fetch user name from DB
        const userName = (await User.findById(userId))?.name || "Player";
        const tickets = [];
        for (let i = 0; i < quantity; i++) {
            const numbers = generateTicketMatrix(); // Logic to generate 3x9 array
            tickets.push({
                gameId,
                userId,
                userName,
                numbers,
                markedNumbers: [],
                status: 'active'
            });
        }
        const createdTickets = await Ticket.insertMany(tickets);
        res.status(201).json({ success: true, data: createdTickets });
    }
    catch (error) {
        res.status(500).json({ success: false, message: "Purchase failed", error });
    }
};
// POST /api/tickets/:ticketId/claim
export const claimPrize = async (req, res) => {
    try {
        const { ticketId } = req.params;
        const { prizePattern } = req.body; // e.g. 'top_line'
        const ticket = await Ticket.findById(ticketId);
        if (!ticket) {
            res.status(404).json({ success: false, message: "Ticket not found" });
            return;
        }
        const game = await Game.findById(ticket.gameId);
        if (!game) {
            res.status(404).json({ success: false, message: "Game not found" });
            return;
        }
        // TODO: VALIDATION LOGIC
        // 1. Check if pattern is already claimed in Game.rules
        // 2. Validate ticket numbers against game.calledNumbers to verify win
        const ruleIndex = game.rules.findIndex(r => r.pattern === prizePattern);
        if (ruleIndex === -1) {
            res.status(400).json({ success: false, message: "Invalid pattern" });
            return;
        }
        if (game.rules[ruleIndex].isCompleted) {
            res.status(400).json({ success: false, message: "Prize already claimed" });
            return;
        }
        // If Valid:
        game.rules[ruleIndex].isCompleted = true;
        game.rules[ruleIndex].winner = {
            userId: ticket.userId,
            userName: ticket.userName,
            ticketId: ticket._id,
            claimedAt: new Date()
        };
        // Add to game winners array
        game.winners.push({
            rank: game.winners.length + 1,
            ruleId: game.rules[ruleIndex].id,
            userId: ticket.userId,
            userName: ticket.userName,
            ticketId: ticket._id.toString(),
            pattern: prizePattern,
            prizeAmount: game.rules[ruleIndex].prizeAmount,
            claimedAt: new Date()
        });
        await game.save();
        // SOCKET EMIT: Broadcast winner
        getIO().to(game._id.toString()).emit('game:winner-claimed', {
            gameId: game._id,
            prize: game.rules[ruleIndex]
        });
        res.json({ success: true, message: "Prize claimed successfully" });
    }
    catch (error) {
        res.status(500).json({ success: false, message: "Claim failed" });
    }
};
//# sourceMappingURL=ticket.controller.js.map