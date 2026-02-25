import { Request, Response } from 'express';
export declare const getGames: (req: Request, res: Response) => Promise<void>;
export declare const createGame: (req: Request, res: Response) => Promise<void>;
export declare const callNumber: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const startGame: (req: Request, res: Response) => Promise<void>;
//# sourceMappingURL=game.controller.d.ts.map