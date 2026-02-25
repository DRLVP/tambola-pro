import mongoose, { Document } from 'mongoose';
export interface IGame extends Document {
    name: string;
    description?: string;
    hostName: string;
    ticketPrice: number;
    maxPlayers: number;
    status: 'waiting' | 'active' | 'paused' | 'completed' | 'cancelled';
    scheduledAt?: Date;
    startedAt?: Date;
    endedAt?: Date;
    calledNumbers: number[];
    rules: any[];
    settings: any;
    winners: any[];
}
declare const _default: mongoose.Model<IGame, {}, {}, {}, mongoose.Document<unknown, {}, IGame, {}, mongoose.DefaultSchemaOptions> & IGame & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}, any, IGame>;
export default _default;
//# sourceMappingURL=game.model.d.ts.map