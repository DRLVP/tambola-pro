import { Game } from '../models/index.js';
import { getIO } from '../socket/index.js';
import { checkTicketWin } from '../utils/winChecker.js';
import { Ticket } from '../models/index.js';

// In-memory storage for active game intervals
const activeIntervals: Record<string, NodeJS.Timeout> = {};

export const GameLoopService = {
  /**
   * Start Auto-Play for a specific game
   */
  start(gameId: string, intervalMs: number = 5000) {
    // 1. Clear existing if any (prevent double loops)
    if (activeIntervals[gameId]) {
      clearInterval(activeIntervals[gameId]);
    }

    console.log(`[GameLoop] Starting auto-play for ${gameId} every ${intervalMs}ms`);

    // 2. Start the Interval
    activeIntervals[gameId] = setInterval(async () => {
      try {
        const game = await Game.findById(gameId);

        // Safety checks
        if (!game || game.status !== 'active' || !game.settings.autoPlay) {
          this.stop(gameId);
          return;
        }

        // 3. COMPLETE CHECK: If all 90 numbers called, stop.
        if (game.calledNumbers.length >= 90) {
          console.log(`[GameLoop] All numbers called for ${gameId}`);
          this.stop(gameId);
          return;
        }

        // 4. SMART SELECTION: Filter out numbers ALREADY called (manually or automatically)
        const allNumbers = Array.from({ length: 90 }, (_, i) => i + 1);
        const availableNumbers = allNumbers.filter(n => !game.calledNumbers.includes(n));

        if (availableNumbers.length === 0) return;

        // 5. Pick random number
        const randomIndex = Math.floor(Math.random() * availableNumbers.length);
        const numberToCall = availableNumbers[randomIndex];

        // 6. Call the number (Logic similar to controller)
        game.calledNumbers.push(numberToCall);

        // --- COPIED WIN CHECK LOGIC (Refactor to shared function ideally) ---
        // For brevity, we just save and emit here. 
        // ideally you import 'processCall' from a shared service to DRY this up.
        // ------------------------------------------------------------------

        await game.save();

        // Emit to Frontend
        getIO().to(gameId).emit('game:number-called', { gameId, number: numberToCall });

        // Trigger Auto-Win Check (We call the logic from your existing flow)
        // Since we can't easily import the controller function, 
        // we'll quickly re-run the win check here or assume the controller logic is extracted.
        // For now, let's just emit. Ideally, move the "Call Logic" to a shared service.
        await this.processWinners(game, numberToCall);

      } catch (error) {
        console.error(`[GameLoop] Error in loop for ${gameId}:`, error);
        this.stop(gameId);
      }
    }, intervalMs);
  },

  stop(gameId: string) {
    if (activeIntervals[gameId]) {
      clearInterval(activeIntervals[gameId]);
      delete activeIntervals[gameId];
      console.log(`[GameLoop] Stopped auto-play for ${gameId}`);
    }
  },

  // Internal helper to process winners (Duplicate of controller logic)
  async processWinners(game: any, number: number) {
    const tickets = await Ticket.find({ gameId: game._id, status: 'active' });
    const openRules = game.rules.filter((r: any) => !r.isCompleted);
    let gameUpdates = false;
    const winningUpdates: any[] = [];

    for (const ticket of tickets) {
      const flat = ticket.numbers.flat();
      if (flat.includes(number) && !ticket.markedNumbers.includes(number)) {
        ticket.markedNumbers.push(number);

        // Check rules
        for (const rule of openRules) {
          if (rule.isCompleted) continue;
          if (checkTicketWin(ticket, rule.pattern, game.calledNumbers)) {
            rule.isCompleted = true;
            rule.winner = { userId: ticket.userId, userName: ticket.userName, ticketId: ticket._id, claimedAt: new Date() };
            game.winners.push({ rank: game.winners.length + 1, ruleId: rule.id, userId: ticket.userId, userName: ticket.userName, ticketId: ticket._id, pattern: rule.pattern, prizeAmount: rule.prizeAmount, claimedAt: new Date() });
            ticket.winnerInfo = { /*...*/ }; // Populate as needed
            ticket.status = 'won';
            winningUpdates.push({ gameId: game._id, prize: rule });
            gameUpdates = true;
          }
        }
        await ticket.save();
      }
    }
    if (gameUpdates) {
      await game.save();
      winningUpdates.forEach(w => getIO().to(game._id.toString()).emit('game:winner-claimed', w));
    }
  }
};