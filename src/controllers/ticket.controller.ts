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

// GET /api/tickets/pending (Admin)
export const getPendingTickets: RequestHandler = async (req, res): Promise<void> => {
  try {
    const { gameId, page = 1, limit = 20 } = req.query;

    const query: any = { status: 'pending' };
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
    res.status(500).json({ success: false, message: "Error fetching pending tickets" });
  }
};

// GET /api/tickets/game/:gameId (Admin)
export const getGameTickets: RequestHandler = async (req, res): Promise<void> => {
  try {
    const { gameId } = req.params;
    const { page = 1, limit = 50, status } = req.query;

    const query: any = { gameId };
    if (status && status !== 'all') query.status = status;

    const tickets = await Ticket.find(query)
      .sort({ ticketNumber: 1 })
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
    res.status(500).json({ success: false, message: "Error fetching game tickets" });
  }
};

// GET /api/tickets/public/:gameId — public view of all booked tickets for transparency
export const getPublicGameTickets: RequestHandler = async (req, res): Promise<void> => {
  try {
    const { gameId } = req.params;

    // Only return booked tickets (not available ones, no private data)
    const tickets = await Ticket.find({
      gameId,
      status: { $ne: 'available' }
    })
      .select('ticketNumber userName status numbers markedNumbers')
      .sort({ ticketNumber: 1 });

    res.json({ success: true, data: tickets });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error fetching public game tickets" });
  }
};

// GET /api/tickets/available/:gameId — returns unbooked tickets for a game (public)
export const getAvailableTickets: RequestHandler = async (req, res): Promise<void> => {
  try {
    const { gameId } = req.params;

    const game = await Game.findById(gameId);
    if (!game) {
      res.status(404).json({ success: false, message: "Game not found" });
      return;
    }

    // Return full ticket objects for available tickets (includes numbers matrix for preview)
    const availableTickets = await Ticket.find({ gameId, status: 'available' })
      .select('ticketNumber status numbers')
      .sort({ ticketNumber: 1 });

    // Return booked ticket numbers so UI can show which are taken
    const bookedTickets = await Ticket.find({
      gameId,
      status: { $in: ['pending', 'confirmed', 'active'] }
    }).select('ticketNumber status userId');

    res.json({
      success: true,
      data: {
        available: availableTickets.map(t => ({
          ticketNumber: t.ticketNumber,
          numbers: (t as any).numbers,
        })),
        booked: bookedTickets.map(t => t.ticketNumber),
        total: game.settings?.maxTickets || game.maxPlayers || 100
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error fetching available tickets" });
  }
};

// POST /api/tickets/purchase — user selects specific ticket numbers
export const purchaseTicket: RequestHandler = async (req, res): Promise<void> => {
  try {
    const { gameId, ticketNumbers } = req.body;
    const userId = req.auth().userId;

    // 1. Validate input
    if (!ticketNumbers || !Array.isArray(ticketNumbers) || ticketNumbers.length === 0) {
      res.status(400).json({ success: false, message: "Please select at least one ticket" });
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

    // Checking if user is banned
    const purchaser = await User.findOne({ clerkId: userId });
    if (!purchaser) {
      res.status(404).json({ success: false, message: "User not found" });
      return;
    }

    if (purchaser.isBanned) {
      res.status(403).json({
        success: false,
        message: "Your account has been banned. You cannot purchase tickets."
      });
      return;
    }

    // 3. User Ticket Limit Check
    const maxPerUser = game.settings?.maxTicketsPerUser || 6;
    const userTicketCount = await Ticket.countDocuments({
      gameId,
      userId,
      status: { $in: ['pending', 'confirmed', 'active'] }
    });

    if (userTicketCount + ticketNumbers.length > maxPerUser) {
      res.status(400).json({
        success: false,
        message: `Limit exceeded. You can only book ${maxPerUser - userTicketCount} more ticket(s).`
      });
      return;
    }

    // 4. Verify all selected tickets are available
    const availableTickets = await Ticket.find({
      gameId,
      ticketNumber: { $in: ticketNumbers },
      status: 'available'
    });

    if (availableTickets.length !== ticketNumbers.length) {
      const foundNumbers = availableTickets.map(t => t.ticketNumber);
      const unavailable = ticketNumbers.filter((n: number) => !foundNumbers.includes(n));
      res.status(400).json({
        success: false,
        message: `Tickets ${unavailable.join(', ')} are no longer available. Please select different tickets.`
      });
      return;
    }

    // 5. Assign tickets to user
    const user = await User.findOne({ clerkId: userId });
    const userName = user?.name || "Player";

    const ticketIds = availableTickets.map(t => t._id);
    await Ticket.updateMany(
      { _id: { $in: ticketIds } },
      {
        $set: {
          userId,
          userName,
          status: 'pending', // Awaiting admin confirmation
          purchasedAt: new Date()
        }
      }
    );

    // Fetch updated tickets to return
    const updatedTickets = await Ticket.find({ _id: { $in: ticketIds } });

    // Notify Admins
    try {
      getIO().emit('admin:tickets-updated');
    } catch (_) { /* ignore */ }

    // Update current players count
    await Game.findByIdAndUpdate(gameId, {
      $inc: { currentPlayers: ticketNumbers.length }
    });

    res.status(201).json({
      success: true,
      data: updatedTickets,
      message: `${ticketNumbers.length} ticket(s) booked successfully! Waiting for Admin confirmation.`
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
    if (ticket.userId) {
      getIO().to(ticket.userId).emit('ticket:confirmed', { ticketId: ticket._id });
    }

    res.json({ success: true, data: ticket, message: "Ticket confirmed and activated" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error confirming ticket" });
  }
};

// POST /api/tickets/:ticketId/cancel (Admin)
export const cancelTicket: RequestHandler = async (req, res): Promise<void> => {
  try {
    const { ticketId } = req.params;

    const ticket = await Ticket.findById(ticketId);
    if (!ticket) {
      res.status(404).json({ success: false, message: "Ticket not found" });
      return;
    }

    // Reset ticket to available — clear user assignment, regenerate numbers
    ticket.status = 'available';
    ticket.userId = undefined as any;
    ticket.userName = undefined as any;
    ticket.markedNumbers = [];
    ticket.numbers = generateTicketMatrix(); // Fresh matrix
    ticket.winnerInfo = undefined;
    await ticket.save();

    // Decrement player count
    await Game.findByIdAndUpdate(ticket.gameId, { $inc: { currentPlayers: -1 } });

    // Notify clients
    try {
      getIO().emit('admin:tickets-updated');
    } catch (_) { /* ignore */ }

    res.json({ success: true, data: ticket, message: "Ticket cancelled and made available for rebooking" });
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