import { User, Game, Ticket } from '../models/index.js';
/**
 * GET /api/admin/dashboard/stats
 * Returns aggregated stats for the admin dashboard
 */
export const getDashboardStats = async (req, res) => {
    try {
        // 1. Basic Counts
        const totalUsers = await User.countDocuments({ role: 'user' });
        const totalGames = await Game.countDocuments();
        const activeGames = await Game.countDocuments({ status: 'active' });
        // 2. Revenue Calculation (Aggregate Tickets joined with Games)
        const revenueStats = await Ticket.aggregate([
            {
                $lookup: {
                    from: 'games',
                    localField: 'gameId',
                    foreignField: '_id',
                    as: 'game'
                }
            },
            { $unwind: '$game' },
            {
                $group: {
                    _id: null,
                    totalRevenue: { $sum: '$game.ticketPrice' },
                    todayRevenue: {
                        $sum: {
                            $cond: [
                                {
                                    $gte: [
                                        '$createdAt',
                                        new Date(new Date().setHours(0, 0, 0, 0)) // Start of today
                                    ]
                                },
                                '$game.ticketPrice',
                                0
                            ]
                        }
                    }
                }
            }
        ]);
        const stats = revenueStats[0] || { totalRevenue: 0, todayRevenue: 0 };
        // 3. Recent Games
        const recentGames = await Game.find()
            .sort({ createdAt: -1 })
            .limit(5)
            .select('name status startedAt ticketPrice maxPlayers currentPlayers');
        // 4. Top Winners
        const topWinners = await User.find({ role: 'user' })
            .sort({ totalWinnings: -1 })
            .limit(5)
            .select('name email totalWinnings gamesWon avatar');
        res.json({
            success: true,
            data: {
                totalUsers,
                totalGames,
                activeGames,
                totalRevenue: stats.totalRevenue,
                todayRevenue: stats.todayRevenue,
                recentGames,
                topWinners
            }
        });
    }
    catch (error) {
        console.error('Dashboard Stats Error:', error);
        res.status(500).json({ success: false, message: "Failed to fetch dashboard stats" });
    }
};
//# sourceMappingURL=admin.controller.js.map