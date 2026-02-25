import mongoose, { Document } from 'mongoose';
export interface ITicket extends Document {
    gameId: mongoose.Types.ObjectId;
    userId: string;
    userName: string;
    numbers: number[][];
    markedNumbers: number[];
    status: 'pending' | 'confirmed' | 'cancelled' | 'active' | 'won' | 'lost';
    winnerInfo?: any;
    createdAt: Date;
    updatedAt: Date;
}
declare const _default: mongoose.Model<ITicket, {}, {}, {}, mongoose.Document<unknown, {}, ITicket, {}, mongoose.DefaultSchemaOptions> & ITicket & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}, any, ITicket>;
export default _default;
//# sourceMappingURL=ticket.model.d.ts.map