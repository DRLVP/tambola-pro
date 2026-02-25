/**
 * Environment Configuration
 * Centralized environment variables with type safety and defaults
 */
import "dotenv/config";
export declare const envConfig: {
    readonly NODE_ENV: string;
    readonly PORT: number;
    readonly FRONTEND_URL: string;
    readonly CLERK_PUBLISHABLE_KEY: string | undefined;
    readonly CLERK_SECRET_KEY: string | undefined;
    readonly MONGODB_URL: string;
};
export type EnvConfig = typeof envConfig;
//# sourceMappingURL=env.d.ts.map