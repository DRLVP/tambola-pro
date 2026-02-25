import { Game } from '../models/index.js';
import { getIO } from '../socket/index.js';
// GET /api/games
export const getGames = async (req, res) => {
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
    }
    catch (error) {
        res.status(500).json({ success: false, message: "Error fetching games" });
    }
};
// POST /api/games (Create Game)
export const createGame = async (req, res) => {
    try {
        const newGame = await Game.create({
            ...req.body,
            status: 'waiting',
            calledNumbers: [],
            winners: []
        });
        res.status(201).json({ success: true, data: newGame });
    }
    catch (error) {
        res.status(400).json({ success: false, message: "Error creating game", error });
    }
};
// POST /api/games/:id/call (Call Number)
export const callNumber = async (req, res) => {
    try {
        const { id } = req.params;
        const { number } = req.body;
        const game = await Game.findById(id);
        if (!game)
            return res.status(404).json({ success: false, message: "Game not found" });
        if (game.calledNumbers.includes(number)) {
            return res.status(400).json({ success: false, message: "Number already called" });
        }
        game.calledNumbers.push(number);
        await game.save();
        // SOCKET EMIT: Matches frontend 'game:number-called'
        const io = getIO();
        io.to(id).emit('game:number-called', { gameId: id, number });
        res.json({ success: true, data: game });
    }
    catch (error) {
        res.status(500).json({ success: false, message: "Error calling number" });
    }
};
// POST /api/games/:id/start
export const startGame = async (req, res) => {
    try {
        const game = await Game.findByIdAndUpdate(req.params.id, { status: 'active', startedAt: new Date() }, { new: true });
        if (game) {
            getIO().to(game._id.toString()).emit('game:started', { gameId: game._id });
        }
        res.json({ success: true, data: game });
    }
    catch (error) {
        res.status(500).json({ success: false, message: "Error starting game" });
    }
};
//# sourceMappingURL=game.controller.js.map