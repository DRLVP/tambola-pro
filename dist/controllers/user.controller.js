import { User, Game, Ticket } from '../models/index.js';
// ... (Existing profile methods) ...
/**
 * GET /api/users/profile
 * Get current user profile
 */
export const getProfile = async (req, res) => {
    try {
        const userId = req.auth.userId;
        const user = await User.findOne({ clerkId: userId });
        if (!user) {
            res.status(404).json({ success: false, message: "User not found" });
            return;
        }
        res.json({ success: true, data: user });
    }
    catch (error) {
        res.status(500).json({ success: false, message: "Failed to fetch profile" });
    }
};
/**
 * PUT /api/users/profile
 * Update current user profile
 */
export const updateProfile = async (req, res) => {
    try {
        const userId = req.auth.userId;
        const { name } = req.body; // Can extend to other fields later
        const user = await User.findOneAndUpdate({ clerkId: userId }, { name }, // Only allowing name update for now
        { new: true });
        if (!user) {
            res.status(404).json({ success: false, message: "User not found" });
            return;
        }
        res.json({ success: true, data: user });
    }
    catch (error) {
        res.status(500).json({ success: false, message: "Failed to update profile" });
    }
};
/**
 * DELETE /api/users/:id
 * Delete a user (Admin only)
 */
export const deleteUser = async (req, res) => {
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
    }
    catch (error) {
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
export const getWinnings = async (req, res) => {
    try {
        const userId = req.auth.userId; // Clerk ID
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
    }
    catch (error) {
        res.status(500).json({ success: false, message: "Failed to fetch winnings" });
    }
};
/**
 * GET /api/users/game-history
 * Returns paginated list of games played
 */
export const getGameHistory = async (req, res) => {
    try {
        const userId = req.auth.userId;
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
            const game = ticket.gameId;
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
    }
    catch (error) {
        res.status(500).json({ success: false, message: "Failed to fetch history" });
    }
};
//# sourceMappingURL=user.controller.js.map