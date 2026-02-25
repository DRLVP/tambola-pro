import mongoose, { Schema } from 'mongoose';
// Sub-schemas for Game Settings and Rules
const GameSettingsSchema = new Schema({
    minTickets: { type: Number, default: 1 },
    maxTickets: { type: Number, required: true },
    maxTicketsPerUser: { type: Number, default: 6 },
    autoPlay: { type: Boolean, default: false },
    autoPlayInterval: { type: Number, default: 5000 },
}, { _id: false });
const GameRuleSchema = new Schema({
    id: { type: String, required: true }, // generated UUID
    pattern: { type: String, required: true }, // 'top_line', 'full_house', etc.
    name: { type: String, required: true },
    order: { type: Number, required: true },
    prizeAmount: { type: Number, required: true },
    isCompleted: { type: Boolean, default: false },
    winner: {
        userId: String,
        userName: String,
        ticketId: String,
        claimedAt: Date
    }
}, { _id: false });
const GameSchema = new Schema({
    name: { type: String, required: true },
    description: String,
    hostName: { type: String, default: 'Admin' },
    ticketPrice: { type: Number, required: true },
    maxPlayers: { type: Number, required: true },
    status: {
        type: String,
        enum: ['waiting', 'active', 'paused', 'completed', 'cancelled'],
        default: 'waiting',
        index: true
    },
    scheduledAt: Date,
    startedAt: Date,
    endedAt: Date,
    calledNumbers: [{ type: Number }], // Array of called numbers (1-90)
    rules: [GameRuleSchema],
    settings: GameSettingsSchema,
    winners: [{
            rank: Number,
            ruleId: String,
            userId: String,
            userName: String,
            ticketId: String,
            pattern: String,
            prizeAmount: Number,
            claimedAt: Date
        }]
}, { timestamps: true });
export default mongoose.model('Game', GameSchema);
//# sourceMappingURL=game.model.js.map