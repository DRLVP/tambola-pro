import { RequestHandler } from 'express';
/**
 * GET /api/users/profile
 * Get current user profile
 */
export declare const getProfile: RequestHandler;
/**
 * PUT /api/users/profile
 * Update current user profile
 */
export declare const updateProfile: RequestHandler;
/**
 * DELETE /api/users/:id
 * Delete a user (Admin only)
 */
export declare const deleteUser: RequestHandler;
/**
 * GET /api/users/winnings
 * Returns total winnings and breakdown by pattern
 */
/**
 * GET /api/users/winnings
 * Returns total winnings and breakdown by pattern
 */
export declare const getWinnings: RequestHandler;
/**
 * GET /api/users/game-history
 * Returns paginated list of games played
 */
export declare const getGameHistory: RequestHandler;
//# sourceMappingURL=user.controller.d.ts.map