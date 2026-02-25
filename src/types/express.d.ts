declare namespace Express {
  export interface Request {
    auth: () => {
      userId: string | null;
      sessionId: string | null;
      sessionClaims: Record<string, any> | null;
    };
  }
}
