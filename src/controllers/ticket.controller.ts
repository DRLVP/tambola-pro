import { RequestHandler } from 'express';
import { Game, Ticket, User } from '../models/index.js';
import { generateTicketMatrix } from '../utils/tambolaGenerator.js';
import { getIO } from '../socket/index.js';

// GET /api/tickets/my
export const getMyTickets: RequestHandler = async (req, res): Promise<void> => {
  try {
    const userId = req.auth().userId;
    const { gameId, page = 1, limit = 10 } = req.query;

    const query: any = { userId };
    if (gameId) query.gameId = gameId;

    const tickets = await Ticket.find(query)
      .populate('gameId', 'name status ticketPrice')
      .sort({ createdAt: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit));

    const total = await Ticket.countDocuments(query);

    res.json({
      success: true,
      data: tickets,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error fetching tickets" });
  }
};

// GET /api/tickets/:ticketId
export const getTicket: RequestHandler = async (req, res): Promise<void> => {
  try {
    const ticket = await Ticket.findById(req.params.ticketId).populate('gameId');
    if (!ticket) {
      res.status(404).json({ success: false, message: "Ticket not found" });
      return;
    }

    // Security check: ensure user owns ticket or is admin (logic handled by role middleware or here)
    if (req.auth().userId !== ticket.userId && req.auth().sessionClaims?.metadata?.role !== 'admin') {
      res.status(403).json({ success: false, message: "Unauthorized access to ticket" });
      return;
    }

    res.json({ success: true, data: ticket });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error fetching ticket" });
  }
};

// GET /api/tickets (Admin)
export const getAllTickets: RequestHandler = async (req, res): Promise<void> => {
  try {
    const { page = 1, limit = 20, status, search } = req.query;

    const query: any = {};
    if (status && status !== 'all') query.status = status;
    if (search) {
      query.$or = [
        { _id: search },
        { userName: { $regex: search, $options: 'i' } },
        { userId: search }
      ];
    }

    const tickets = await Ticket.find(query)
      .populate('gameId', 'name')
      .sort({ createdAt: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit));

    const total = await Ticket.countDocuments(query);

    res.json({
      success: true,
      data: tickets,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error fetching all tickets" });
  }
};

// POST /api/tickets/purchase
export const purchaseTicket: RequestHandler = async (req, res): Promise<void> => {
  try {
    const { gameId, quantity } = req.body;
    const userId = req.auth().userId;

    // 1. Basic Validation
    if (!quantity || quantity < 1) {
      res.status(400).json({ success: false, message: "Invalid ticket quantity" });
      return;
    }

    // 2. Fetch Game & Check Status
    const game = await Game.findById(gameId);
    if (!game) {
      res.status(404).json({ success: false, message: "Game not found" });
      return;
    }

    if (game.status !== 'waiting') {
      res.status(400).json({
        success: false,
        message: "Cannot book tickets. Game has already started, ended, or is paused."
      });
      return;
    }

    // 3. User Ticket Limit Check
    // We count 'active' and 'pending' tickets. Cancelled/Lost/Won don't restrict purchasing more (usually).
    const maxPerUser = game.settings?.maxTicketsPerUser || 6;

    const userTicketCount = await Ticket.countDocuments({
      gameId,
      userId,
      status: { $in: ['active', 'pending'] }
    });

    if (userTicketCount + quantity > maxPerUser) {
      res.status(400).json({
        success: false,
        message: `Purchase limit exceeded. You can only buy ${maxPerUser - userTicketCount} more ticket(s).`
      });
      return;
    }

    // 4. Global Game Capacity Check
    // We only count tickets that are effectively "taking up a seat" (Active or Pending)
    const activeTicketsCount = await Ticket.countDocuments({
      gameId,
      status: { $in: ['active', 'pending'] }
    });

    // Assuming game.maxPlayers defines the total ticket capacity for the room
    const maxCapacity = game.maxPlayers || 100;

    if (activeTicketsCount + quantity > maxCapacity) {
      res.status(400).json({
        success: false,
        message: "Game is full. Not enough tickets available."
      });
      return;
    }

    // 5. Generate Tickets
    const user = await User.findOne({ clerkId: userId });
    const userName = user?.name || "Player";

    // Determine the next sequential ticketNumber for this game
    const lastTicket = await Ticket.findOne({ gameId }).sort({ ticketNumber: -1 });
    const nextTicketNumber = lastTicket ? lastTicket.ticketNumber + 1 : 1;

    const ticketsToCreate = [];
    for (let i = 0; i < quantity; i++) {
      ticketsToCreate.push({
        gameId,
        userId,
        userName,
        ticketNumber: nextTicketNumber + i,
        numbers: generateTicketMatrix(), // Generates standard 3x9 Tambola matrix
        markedNumbers: [],
        status: 'pending', // <--- PENDING ADMIN CONFIRMATION
        purchasedAt: new Date()
      });
    }

    const createdTickets = await Ticket.insertMany(ticketsToCreate);

    // Notify Admins
    getIO().emit('admin:tickets-updated');

    // Update current players count in Game model (optional, but good for UI)
    await Game.findByIdAndUpdate(gameId, {
      $inc: { currentPlayers: quantity } // Roughly tracking tickets as players
    });

    res.status(201).json({
      success: true,
      data: createdTickets,
      message: "Tickets booked successfully! Waiting for Admin confirmation."
    });

  } catch (error) {
    console.error("Purchase failed:", error);
    res.status(500).json({ success: false, message: "Purchase failed", error });
  }
};

// POST /api/tickets/:ticketId/confirm (Admin)
export const confirmTicket: RequestHandler = async (req, res): Promise<void> => {
  try {
    const { ticketId } = req.params;

    // Find and update status from pending to active
    const ticket = await Ticket.findOneAndUpdate(
      { _id: ticketId, status: 'pending' },
      { status: 'active' },
      { new: true }
    );

    if (!ticket) {
      res.status(404).json({ success: false, message: "Ticket not found or already processed" });
      return;
    }

    // Notify specific user their ticket is ready
    getIO().to(ticket.userId).emit('ticket:confirmed', { ticketId: ticket._id });

    res.json({ success: true, data: ticket, message: "Ticket confirmed and activated" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error confirming ticket" });
  }
};

// POST /api/tickets/:ticketId/cancel (Admin)
export const cancelTicket: RequestHandler = async (req, res): Promise<void> => {
  try {
    const { ticketId } = req.params;

    const ticket = await Ticket.findByIdAndUpdate(
      ticketId,
      { status: 'cancelled' },
      { new: true }
    );

    if (!ticket) {
      res.status(404).json({ success: false, message: "Ticket not found" });
      return;
    }

    // Optional: Decrement player count in Game if needed
    // await Game.findByIdAndUpdate(ticket.gameId, { $inc: { currentPlayers: -1 } });

    res.json({ success: true, data: ticket, message: "Ticket cancelled" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error cancelling ticket" });
  }
};

// POST /api/tickets/:ticketId/mark
export const markNumber: RequestHandler = async (req, res): Promise<void> => {
  try {
    const { number } = req.body;
    const userId = req.auth().userId;

    const ticket = await Ticket.findById(req.params.ticketId);

    if (!ticket) {
      res.status(404).json({ success: false, message: "Ticket not found" });
      return;
    }

    if (ticket.userId !== userId) {
      res.status(403).json({ success: false, message: "Not your ticket" });
      return;
    }

    // Only allow marking if ticket is confirmed/active
    if (ticket.status !== 'active' && ticket.status !== 'won') {
      res.status(400).json({
        success: false,
        message: ticket.status === 'pending' ? "Ticket pending confirmation" : "Ticket is not active"
      });
      return;
    }

    if (!ticket.markedNumbers.includes(number)) {
      ticket.markedNumbers.push(number);
      await ticket.save();
    }

    res.json({ success: true, data: ticket });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error marking number" });
  }
};

// POST /api/tickets/:ticketId/claim
export const claimPrize: RequestHandler = async (req, res): Promise<void> => {
  // Logic usually handled by auto-claim in game controller, 
  // but if manual claim is needed, implement win check here.
  res.status(501).json({ success: false, message: "Manual claim not implemented. Use auto-win." });
};