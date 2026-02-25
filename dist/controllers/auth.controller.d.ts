/**
 * Authentication Controller
 * Handles all authentication-related operations
 */
import { Request, Response } from "express";
/**
 * Assign a role to a user
 * POST /api/auth/assign-role
 */
export declare const assignRole: (req: Request, res: Response) => Promise<void>;
export declare const syncUser: (req: Request, res: Response) => Promise<void>;
//# sourceMappingURL=auth.controller.d.ts.map