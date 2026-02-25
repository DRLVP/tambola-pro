import mongoose, { Schema, Document } from 'mongoose';

// Sub-schemas for Game Settings and Rules
const GameSettingsSchema = new Schema({
  minTickets: { type: Number, default: 1 },
  maxTickets: { type: Number, required: true },
  maxTicketsPerUser: { type: Number, default: 6 },
  autoPlay: { type: Boolean, default: false },
  autoPlayInterval: { type: Number, default: 5000 },
}, { _id: false });

const GameRuleSchema = new Schema({
  id: { type: String, default: () => new mongoose.Types.ObjectId().toString() }, // generated UUID
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

export interface IGame extends Document {
  name: string;
  description?: string;
  hostName: string; // usually 'Admin'
  ticketPrice: number;
  maxPlayers: number;
  status: 'waiting' | 'active' | 'paused' | 'completed' | 'cancelled';
  scheduledAt?: Date;
  startedAt?: Date;
  endedAt?: Date;
  calledNumbers: number[];
  rules: any[]; // Using schema above
  settings: any;
  winners: any[];
}

const GameSchema: Schema = new Schema({
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

export default mongoose.model<IGame>('Game', GameSchema);