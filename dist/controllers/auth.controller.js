/**
 * Authentication Controller
 * Handles all authentication-related operations
 */
import { clerkClient } from "@clerk/express";
/**
 * Assign a role to a user
 * POST /api/auth/assign-role
 */
import { User } from "../models/index.js";
/**
 * Assign a role to a user
 * POST /api/auth/assign-role
 */
export const assignRole = async (req, res) => {
    try {
        const { clerkId, role } = req.body;
        console.log("clerkId from frontend::", clerkId);
        console.log("role from frontend::", role);
        console.log("📝 Role assignment request:", { clerkId, role });
        // Validate required fields
        if (!clerkId || !role) {
            res.status(400).json({
                success: false,
                message: "Missing required fields: clerkId and role are required",
            });
            return;
        }
        // Validate role value
        const validRoles = ["admin", "user"];
        if (!validRoles.includes(role)) {
            res.status(400).json({
                success: false,
                message: `Invalid role. Must be one of: ${validRoles.join(", ")}`,
            });
            return;
        }
        // 1. Update user's public metadata in Clerk
        const clerkUser = await clerkClient.users.updateUser(clerkId, {
            publicMetadata: { role },
        });
        console.log(`✅ Clerk Role '${role}' assigned to user ${clerkId}`);
        // 2. Sync user to MongoDB
        // Get email from Clerk user object
        const email = clerkUser.emailAddresses[0]?.emailAddress;
        const name = `${clerkUser.firstName || ""} ${clerkUser.lastName || ""}`.trim() || "User";
        if (!email) {
            console.error("❌ Clerk user has no email, cannot sync to DB");
            res.status(400).json({ success: false, message: "User has no email" });
            return;
        }
        // Check if user exists
        let dbUser = await User.findOne({ clerkId });
        if (dbUser) {
            // Update role if exists
            dbUser.role = role;
            // Optionally update name/email if changed in Clerk? Let's keep it simple for now or sync basic info
            dbUser.email = email;
            dbUser.name = name;
            await dbUser.save();
            console.log(`🔄 User ${clerkId} updated in MongoDB`);
        }
        else {
            // Create new user
            dbUser = await User.create({
                clerkId,
                email,
                name,
                role,
                balance: 0,
                gamesPlayed: 0,
                gamesWon: 0,
                totalWinnings: 0
            });
            console.log(`✨ User ${clerkId} created in MongoDB`);
        }
        res.json({
            success: true,
            message: `Role '${role}' assigned successfully`,
            role,
            userId: clerkUser.id,
            dbUser
        });
    }
    catch (error) {
        console.error("❌ Failed to assign role:", error);
        res.status(500).json({
            success: false,
            message: "Failed to assign role",
            error: error instanceof Error ? error.message : "Unknown error",
        });
    }
};
export const syncUser = async (req, res) => {
    try {
        const { email, name } = req.body;
        // req.auth is populated by Clerk middleware
        const { userId, sessionClaims } = req.auth();
        if (!userId) {
            res.status(401).json({ success: false, message: "Unauthorized" });
            return;
        }
        // 1. Try to find the user
        let user = await User.findOne({ clerkId: userId });
        if (!user) {
            // 2. IF USER MISSING: Create them
            // Check if they already have a role in Clerk (e.g., if they were Admin)
            const currentRole = sessionClaims?.publicMetadata?.role || 'user';
            console.log(`👤 Creating missing user for ${userId} (Role: ${currentRole})`);
            user = await User.create({
                clerkId: userId,
                email,
                name,
                role: currentRole, // Preserve role if it exists in metadata
                balance: 0,
                gamesPlayed: 0,
                gamesWon: 0,
                totalWinnings: 0
            });
        }
        else {
            // 3. IF USER EXISTS: Optional - Keep info fresh
            if (email && user.email !== email)
                user.email = email;
            if (name && user.name !== name)
                user.name = name;
            await user.save();
        }
        res.json({ success: true, data: user });
    }
    catch (error) {
        console.error("Sync error:", error);
        res.status(500).json({ success: false, message: "Failed to sync user" });
    }
};
//# sourceMappingURL=auth.controller.js.map