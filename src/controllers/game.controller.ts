import { Request, Response } from 'express';
import { Game, Ticket } from '../models/index.js';
import { getIO } from '../socket/index.js';
import { checkTicketWin } from '../utils/winChecker.js';
import { GameLoopService } from '../services/gameLoop.service.js';

// ==========================================
// SHARED HELPER: Process Winners
// Used by both Manual Call and GameLoopService
// ==========================================
export const processGameWinners = async (game: any, number: number) => {
  const tickets = await Ticket.find({ gameId: game._id, status: 'active' });
  const openRules = game.rules.filter((r: any) => !r.isCompleted);

  let gameUpdatesRequired = false;
  const winningUpdates: any[] = [];

  for (const ticket of tickets) {
    let ticketUpdated = false;
    const flatNumbers = ticket.numbers.flat();

    // 1. Mark number if present
    if (flatNumbers.includes(number)) {
      if (!ticket.markedNumbers.includes(number)) {
        ticket.markedNumbers.push(number);
        ticketUpdated = true;
      }
    }

    // 2. Check for wins (only if ticket was updated)
    if (ticketUpdated) {
      for (const rule of openRules) {
        if (rule.isCompleted) continue; // Skip if just claimed

        // Check win condition
        const isWinner = checkTicketWin(ticket, rule.pattern, game.calledNumbers);

        if (isWinner) {
          console.log(`WINNER FOUND: ${ticket.userName} for ${rule.name}`);

          // Update Rule
          rule.isCompleted = true;
          rule.winner = {
            userId: ticket.userId,
            userName: ticket.userName,
            ticketId: ticket._id.toString(),
            claimedAt: new Date()
          };

          // Add to Game Winners
          game.winners.push({
            rank: game.winners.length + 1,
            ruleId: rule.id,
            userId: ticket.userId,
            userName: ticket.userName,
            ticketId: ticket._id.toString(),
            pattern: rule.pattern,
            prizeAmount: rule.prizeAmount,
            claimedAt: new Date()
          });

          // Update Ticket
          ticket.winnerInfo = {
            position: game.winners.length,
            gameName: game.name,
            ruleName: rule.name,
            pattern: rule.pattern,
            prizeAmount: rule.prizeAmount,
            wonAt: new Date()
          };
          ticket.status = 'won';

          winningUpdates.push({ gameId: game._id, prize: rule });
          gameUpdatesRequired = true;
        }
      }
      await ticket.save(); // Save individual ticket progress
    }
  }

  return { gameUpdatesRequired, winningUpdates };
};

// ==========================================
// CONTROLLER METHODS
// ==========================================

// GET /api/games
export const getGames = async (req: Request, res: Response) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const query = status ? { status } : {};

    const games = await Game.find(query)
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit));

    const total = await Game.countDocuments(query);

    res.json({
      success: true,
      data: games,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error fetching games" });
  }
};

// GET /api/games/:id
export const getGame = async (req: Request, res: Response) => {
  try {
    const game = await Game.findById(req.params.id);
    if (!game) return res.status(404).json({ success: false, message: "Game not found" });
    res.json({ success: true, data: game });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error fetching game" });
  }
};

// POST /api/games
export const createGame = async (req: Request, res: Response) => {
  try {
    const game = req.body;
    const newGame = await Game.create({
      ...game,
      status: 'waiting',
      calledNumbers: [],
      winners: []
    });
    res.status(201).json({ success: true, data: newGame });
  } catch (error) {
    res.status(400).json({ success: false, message: "Error creating game", error });
  }
};

// PUT /api/games/:id
export const updateGame = async (req: Request, res: Response) => {
  try {
    const game = await Game.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!game) return res.status(404).json({ success: false, message: "Game not found" });
    res.json({ success: true, data: game });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error updating game" });
  }
};

// DELETE /api/games/:id
export const deleteGame = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const game = await Game.findByIdAndDelete(id);
    if (!game) return res.status(404).json({ success: false, message: "Game not found" });

    // Cleanup any running loops
    GameLoopService.stop(id);

    res.json({ success: true, data: null });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error deleting game" });
  }
};

// POST /api/games/:id/call (Manual Call with Auto-Win)
export const callNumber = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { number } = req.body;

    const game = await Game.findById(id);
    if (!game) return res.status(404).json({ success: false, message: "Game not found" });

    if (game.calledNumbers.includes(number)) {
      return res.status(400).json({ success: false, message: "Number already called" });
    }

    // 1. Mutate in memory
    game.calledNumbers.push(number);

    // 2. Process Winners (Shared Logic)
    const { gameUpdatesRequired, winningUpdates } = await processGameWinners(game, number);

    // 3. Single save (includes calledNumbers + any winner updates)
    await game.save();

    // 4. Emit safely
    try {
      const io = getIO();
      io.to(id).emit('game:number-called', { gameId: id, number });
      if (gameUpdatesRequired) {
        winningUpdates.forEach(update => {
          io.to(id).emit('game:winner-claimed', update);
        });
      }
    } catch (socketError) {
      console.warn('[callNumber] Socket emit failed:', socketError);
    }

    res.json({ success: true, data: game });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Error calling number" });
  }
};

// POST /api/games/:id/start
export const startGame = async (req: Request, res: Response) => {
  try {
    const game = await Game.findByIdAndUpdate(
      req.params.id,
      { status: 'active', startedAt: new Date() },
      { new: true }
    );
    if (game) {
      try {
        getIO().to(game._id.toString()).emit('game:started', { gameId: game._id });
      } catch (socketError) {
        console.warn('[startGame] Socket emit failed (no clients connected?):', socketError);
      }
      if (game.settings?.autoPlay) {
        GameLoopService.start(game._id.toString(), game.settings.autoPlayInterval || 5000);
      }
    }
    res.json({ success: true, data: game });
  } catch (error: any) {
    console.error('[startGame] Error:', error);
    res.status(500).json({ success: false, message: "Error starting game", error: error.message || String(error) });
  }
};

// POST /api/games/:id/end
export const endGame = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const game = await Game.findByIdAndUpdate(
      id,
      { status: 'completed', endedAt: new Date() },
      { new: true }
    );

    // Stop Auto Play Loop
    GameLoopService.stop(id);

    if (game) getIO().to(game._id.toString()).emit('game:ended', { gameId: game._id });
    res.json({ success: true, data: game });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error ending game" });
  }
};

// POST /api/games/:id/pause
export const pauseGame = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const game = await Game.findByIdAndUpdate(id, { status: 'paused' }, { new: true });

    // Stop Auto Play Loop
    GameLoopService.stop(id);

    res.json({ success: true, data: game });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error pausing game" });
  }
};

// POST /api/games/:id/resume
export const resumeGame = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const game = await Game.findByIdAndUpdate(id, { status: 'active' }, { new: true });

    if (game && game.settings?.autoPlay) {
      GameLoopService.start(game._id.toString(), game.settings.autoPlayInterval || 5000);
    }

    res.json({ success: true, data: game });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error resuming game" });
  }
};

// POST /api/games/:id/auto-play
export const startAutoPlay = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const { interval } = req.body;
    const game = await Game.findByIdAndUpdate(
      id,
      { 'settings.autoPlay': true, 'settings.autoPlayInterval': interval },
      { new: true }
    );

    // Start Service Loop
    if (game) GameLoopService.start(game._id.toString(), interval);

    res.json({ success: true, data: game });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error starting auto-play" });
  }
};

// POST /api/games/:id/stop-auto-play
export const stopAutoPlay = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const game = await Game.findByIdAndUpdate(
      id,
      { 'settings.autoPlay': false },
      { new: true }
    );

    // Stop Service Loop
    GameLoopService.stop(id);

    res.json({ success: true, data: game });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error stopping auto-play" });
  }
};

// GET /api/games/available
export const getAvailableGames = async (req: Request, res: Response) => {
  req.query.status = 'active';
  return getGames(req, res);
};