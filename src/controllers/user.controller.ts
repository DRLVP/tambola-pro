import { RequestHandler } from 'express';
import { User, Game, Ticket } from '../models/index.js';

// ... (Existing profile methods) ...

/**
 * GET /api/users
 * Get all users with role 'user' (paginated)
 */
export const getUsers: RequestHandler = async (req, res): Promise<void> => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const query = { role: 'user' };

    const users = await User.find(query)
      .select('-clerkId -__v') // Keep createdAt for joined date
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await User.countDocuments(query);

    // Compute real gamesPlayed and gamesWon from Ticket/Game collections
    const userClerkIds = users.map(u => u.clerkId).filter(Boolean);
    // Note: clerkId is excluded from select, so we need _id-based approach
    const userIds = users.map(u => u._id);

    // Get real stats from tickets — count distinct gameIds per user (by clerkId)
    // We need clerkId for ticket lookups, so fetch them separately
    const userClerkMap = await User.find({ _id: { $in: userIds } }).select('_id clerkId').lean();
    const idToClerk = new Map<string, string>();
    userClerkMap.forEach((u: any) => { idToClerk.set(u._id.toString(), u.clerkId); });

    const clerkIds = Array.from(idToClerk.values());

    // Aggregate real gamesPlayed (distinct games with purchased tickets)
    const gamesPlayedAgg = await Ticket.aggregate([
      { $match: { userId: { $in: clerkIds } } },
      { $group: { _id: { userId: '$userId', gameId: '$gameId' } } },
      { $group: { _id: '$_id.userId', count: { $sum: 1 } } }
    ]);
    const gamesPlayedMap = new Map<string, number>();
    gamesPlayedAgg.forEach((item: any) => { gamesPlayedMap.set(item._id, item.count); });

    // Aggregate real gamesWon (from Game.winners array)
    const gamesWonAgg = await Game.aggregate([
      { $unwind: '$winners' },
      { $match: { 'winners.userId': { $in: clerkIds } } },
      { $group: { _id: '$winners.userId', count: { $sum: 1 } } }
    ]);
    const gamesWonMap = new Map<string, number>();
    gamesWonAgg.forEach((item: any) => { gamesWonMap.set(item._id, item.count); });

    // Map users with computed fields
    const enrichedUsers = users.map(user => {
      const u = user.toObject();
      const clerkId = idToClerk.get(u._id.toString()) || '';
      return {
        ...u,
        gamesPlayed: gamesPlayedMap.get(clerkId) || 0,
        gamesWon: gamesWonMap.get(clerkId) || 0,
        status: u.isBanned ? 'banned' : 'active',
      };
    });

    res.json({
      success: true,
      data: enrichedUsers,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Failed to fetch users:', error);
    res.status(500).json({ success: false, message: "Failed to fetch users" });
  }
};

/**
 * GET /api/users/profile

/**
 * GET /api/users/profile
 * Get current user profile
 */
export const getProfile: RequestHandler = async (req, res): Promise<void> => {
  try {
    const userId = (req as any).auth.userId;
    const user = await User.findOne({ clerkId: userId });

    if (!user) {
      res.status(404).json({ success: false, message: "User not found" });
      return;
    }

    res.json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch profile" });
  }
};

/**
 * PUT /api/users/profile
 * Update current user profile
 */
export const updateProfile: RequestHandler = async (req, res): Promise<void> => {
  try {
    const userId = (req as any).auth.userId;
    const { name } = req.body; // Can extend to other fields later

    const user = await User.findOneAndUpdate(
      { clerkId: userId },
      { name }, // Only allowing name update for now
      { new: true }
    );

    if (!user) {
      res.status(404).json({ success: false, message: "User not found" });
      return;
    }

    res.json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to update profile" });
  }
};

/**
 * DELETE /api/users/:id
 * Delete a user (Admin only)
 */
export const deleteUser: RequestHandler = async (req, res): Promise<void> => {
  try {
    const { id } = req.params;

    // Check if user exists
    const user = await User.findById(id);
    if (!user) {
      res.status(404).json({ success: false, message: "User not found" });
      return;
    }

    await User.findByIdAndDelete(id);

    // Ideally, we should also delete from Clerk here using clerkClient, 
    // but we will focus on DB for now as per plan.

    res.json({ success: true, message: "User deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to delete user" });
  }
};

/**
 * GET /api/users/winnings
 * Returns total winnings and breakdown by pattern
 */
/**
 * GET /api/users/winnings
 * Returns total winnings and breakdown by pattern
 */
export const getWinnings: RequestHandler = async (req, res): Promise<void> => {
  try {
    const userId = (req as any).auth.userId; // Clerk ID

    // Aggregate winnings from Game.winners array
    const winningsBreakdown = await Game.aggregate([
      { $unwind: '$winners' },
      { $match: { 'winners.userId': userId } },
      {
        $group: {
          _id: '$winners.pattern',
          count: { $sum: 1 },
          amount: { $sum: '$winners.prizeAmount' }
        }
      },
      {
        $project: {
          pattern: '$_id',
          count: 1,
          amount: 1,
          _id: 0
        }
      }
    ]);

    const total = winningsBreakdown.reduce((acc, curr) => acc + curr.amount, 0);

    res.json({
      success: true,
      data: {
        total,
        breakdown: winningsBreakdown
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch winnings" });
  }
};

/**
 * GET /api/users/game-history
 * Returns paginated list of games played
 */
export const getGameHistory: RequestHandler = async (req, res): Promise<void> => {
  try {
    const userId = (req as any).auth.userId;
    // Cast query params to avoid "Property 'query' does not exist" type ambiguity
    // with RequestHandler<P, ResBody, ReqBody, ReqQuery>
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;

    // Find all tickets for this user, populate game details
    const history = await Ticket.find({ userId })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('gameId', 'name status endedAt');

    const formattedHistory = history.map(ticket => {
      const game = ticket.gameId as any;
      return {
        gameId: game._id,
        gameName: game.name,
        result: ticket.winnerInfo ? 'Won' : 'Played',
        amount: ticket.winnerInfo?.prizeAmount || 0,
        playedAt: ticket.createdAt
      };
    });

    const total = await Ticket.countDocuments({ userId });

    res.json({
      success: true,
      data: formattedHistory,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch history" });
  }
};

// GET /api/users/:id
export const getUser: RequestHandler = async (req, res): Promise<void> => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      res.status(404).json({ success: false, message: "User not found" });
      return;
    }
    res.json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error fetching user" });
  }
};

// POST /api/users/:id/ban
export const toggleUserBan: RequestHandler = async (req, res): Promise<void> => {
  try {
    const { banned } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isBanned: banned },
      { new: true }
    );
    res.json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error updating ban status" });
  }
};