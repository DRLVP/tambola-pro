/**
 * Socket.io Server Configuration
 * Initializes and configures the Socket.io server
 */
import { Server as HttpServer } from "http";
import { Server } from "socket.io";
/**
 * Initialize Socket.io server with the HTTP server
 */
export declare const initializeSocket: (httpServer: HttpServer) => Server;
/**
 * Get the Socket.io server instance
 * @throws Error if socket not initialized
 */
export declare const getIO: () => Server;
declare const _default: {
    initializeSocket: (httpServer: HttpServer) => Server;
    getIO: () => Server;
};
export default _default;
//# sourceMappingURL=index.d.ts.map