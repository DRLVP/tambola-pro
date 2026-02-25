import { Request, Response, NextFunction } from "express";
export declare const requireRole: (allowedRoles: string[]) => (req: Request, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
//# sourceMappingURL=role.middleware.d.ts.map