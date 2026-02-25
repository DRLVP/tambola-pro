import mongoose, { Schema, Document } from 'mongoose';

export interface ITicket extends Document {
  gameId: mongoose.Types.ObjectId;
  userId: string; // Clerk ID
  userName: string;
  ticketNumber: number; // Sequential, human-readable ID per game
  numbers: number[][]; // 3x9 Matrix
  markedNumbers: number[];
  status: 'pending' | 'confirmed' | 'cancelled' | 'active' | 'won' | 'lost';
  winnerInfo?: any;
  createdAt: Date;
  updatedAt: Date;
}

const TicketSchema: Schema = new Schema({
  gameId: { type: Schema.Types.ObjectId, ref: 'Game', required: true, index: true },
  userId: { type: String, required: true, index: true },
  userName: { type: String, required: true },
  ticketNumber: { type: Number, required: true },
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

// Ensure ticket numbers are unique within the same game
TicketSchema.index({ gameId: 1, ticketNumber: 1 }, { unique: true });

export default mongoose.model<ITicket>('Ticket', TicketSchema);