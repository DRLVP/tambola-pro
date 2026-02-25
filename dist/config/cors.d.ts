/**
 * CORS Configuration
 * Shared CORS settings for Express and Socket.io
 */
import { CorsOptions } from "cors";
/**
 * CORS configuration for Express middleware
 */
export declare const corsOptions: CorsOptions;
/**
 * CORS configuration for Socket.io
 */
export declare const socketCorsOptions: {
    origin: string[];
    methods: string[];
    credentials: boolean;
};
//# sourceMappingURL=cors.d.ts.map