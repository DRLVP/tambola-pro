import { clerkClient } from "@clerk/express";
export const requireRole = (allowedRoles) => {
    return async (req, res, next) => {
        try {
            const auth = req.auth;
            if (!auth || !auth.userId) {
                return res.status(401).json({ success: false, message: "Unauthorized" });
            }
            const user = await clerkClient.users.getUser(auth.userId);
            const userRole = user.publicMetadata.role || "user";
            if (!allowedRoles.includes(userRole)) {
                return res.status(403).json({ success: false, message: "Forbidden: Insufficient permissions" });
            }
            next();
        }
        catch (error) {
            console.error("Role Check Error:", error);
            res.status(500).json({ success: false, message: "Internal Server Error" });
        }
    };
};
//# sourceMappingURL=role.middleware.js.map