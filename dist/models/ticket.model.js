import mongoose, { Schema } from 'mongoose';
const TicketSchema = new Schema({
    gameId: { type: Schema.Types.ObjectId, ref: 'Game', required: true, index: true },
    userId: { type: String, required: true, index: true },
    userName: { type: String, required: true },
    // 3x9 grid where 0 represents empty space
    numbers: { type: [[Number]], required: true },
    markedNumbers: [{ type: Number }],
    status: {
        type: String,
        enum: ['pending', 'confirmed', 'cancelled', 'active', 'won', 'lost'],
        default: 'active'
    },
    winnerInfo: {
        position: Number,
        gameName: String,
        ruleName: String,
        pattern: String,
        prizeAmount: Number,
        wonAt: Date
    }
}, { timestamps: true });
// Prevent duplicate ticket IDs/logic if needed, but usually generated unique
export default mongoose.model('Ticket', TicketSchema);
//# sourceMappingURL=ticket.model.js.map