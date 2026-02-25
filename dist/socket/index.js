/**
 * Socket.io Server Configuration
 * Initializes and configures the Socket.io server
 */
import { Server } from "socket.io";
import { socketCorsOptions } from "../config/cors.js";
import { registerSocketHandlers } from "./handlers.js";
let io = null;
/**
 * Initialize Socket.io server with the HTTP server
 */
export const initializeSocket = (httpServer) => {
    io = new Server(httpServer, {
        cors: socketCorsOptions,
        // Connection settings
        pingTimeout: 60000,
        pingInterval: 25000,
    });
    // Handle new connections
    io.on("connection", (socket) => {
        console.log(`🔌 New Client Connected: ${socket.id}`);
        console.log(`   User-Agent: ${socket.handshake.headers["user-agent"]}`);
        registerSocketHandlers(socket);
        socket.on("disconnect", (reason) => {
            console.log(`❌ Client Disconnected: ${socket.id} (Reason: ${reason})`);
        });
    });
    console.log("🔌 Socket.io initialized");
    return io;
};
/**
 * Get the Socket.io server instance
 * @throws Error if socket not initialized
 */
export const getIO = () => {
    if (!io) {
        throw new Error("Socket.io not initialized. Call initializeSocket first.");
    }
    return io;
};
export default { initializeSocket, getIO };
//# sourceMappingURL=index.js.map