import { Request, Response, NextFunction } from "express";
import { logger } from "../lib/logger";

// In-memory token store. Maps token → expiry timestamp.
// For a singleton process this is sufficient; no DB persistence needed.
const validTokens = new Map<string, number>();

const TOKEN_TTL_MS = 8 * 60 * 60 * 1000; // 8 hours

export function issueAdminToken(): string {
  const token =
    Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
  validTokens.set(token, Date.now() + TOKEN_TTL_MS);
  return token;
}

export function revokeAdminToken(token: string): void {
  validTokens.delete(token);
}

function pruneExpired(): void {
  const now = Date.now();
  for (const [token, expiry] of validTokens) {
    if (expiry < now) validTokens.delete(token);
  }
}

export function requireAdminAuth(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  pruneExpired();

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const token = authHeader.slice(7);
  const expiry = validTokens.get(token);

  if (!expiry || expiry < Date.now()) {
    logger.warn({ token: token.slice(0, 8) }, "Invalid or expired admin token");
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  next();
}
