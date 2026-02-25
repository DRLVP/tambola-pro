import mongoose, { Schema } from 'mongoose';
const UserSchema = new Schema({
    clerkId: { type: String, required: true, unique: true, index: true },
    email: { type: String, required: true },
    name: { type: String, required: true },
    role: { type: String, enum: ['user', 'admin', 'super_admin'], default: 'user' },
    balance: { type: Number, default: 0 },
    gamesPlayed: { type: Number, default: 0 },
    gamesWon: { type: Number, default: 0 },
    totalWinnings: { type: Number, default: 0 },
    isBanned: { type: Boolean, default: false },
}, { timestamps: true });
export default mongoose.model('User', UserSchema);
//# sourceMappingURL=user.model.js.map