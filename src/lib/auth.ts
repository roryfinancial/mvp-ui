// ─── Auth service ─────────────────────────────────────────────────────────────
// Encapsulates all authentication logic behind a stable interface.
// Migration path: replace the method bodies with fetch() calls to your auth
// API (Supabase, Auth.js, custom JWT endpoint) — the interface stays the same
// so callers (AuthContext) don't change.

import { Store } from "./store";
import { verifyPassword, generateToken, checkRateLimit, resetRateLimit } from "./security";
import type { Session, User, LoginResult } from "./types";

const SESSION_KEY = "tipflow_session";
const SESSION_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

export const AuthService = {
  async login(email: string, password: string): Promise<LoginResult> {
    // Client-side rate limiting (server enforces this too in production).
    const rate = checkRateLimit();
    if (!rate.allowed) {
      const secs = Math.ceil(rate.retryAfterMs / 1000);
      return { ok: false, error: `Too many attempts. Try again in ${secs}s.`, field: "general" };
    }

    // Simulate network round-trip (remove or reduce in production).
    await new Promise((r) => setTimeout(r, 350));

    const record = Store.findUserByEmail(email);
    if (!record || !verifyPassword(password, record.passwordHash)) {
      // Intentionally vague message — don't reveal whether email exists.
      return { ok: false, error: "Invalid email or password.", field: "general" };
    }

    resetRateLimit();

    const session: Session = {
      token: generateToken(),
      userId: record.user.id,
      role: record.user.role,
      expiresAt: new Date(Date.now() + SESSION_TTL_MS).toISOString(),
    };

    // sessionStorage: cleared when the tab closes (safer than localStorage for tokens).
    // In production the server sets an HttpOnly cookie instead.
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));

    return { ok: true, session, user: record.user };
  },

  logout(): void {
    sessionStorage.removeItem(SESSION_KEY);
  },

  getSession(): Session | null {
    try {
      const raw = sessionStorage.getItem(SESSION_KEY);
      if (!raw) return null;
      const session = JSON.parse(raw) as Session;
      if (new Date(session.expiresAt) < new Date()) {
        sessionStorage.removeItem(SESSION_KEY);
        return null;
      }
      return session;
    } catch {
      return null;
    }
  },

  getUser(): User | null {
    const session = AuthService.getSession();
    if (!session) return null;
    return Store.getUserById(session.userId) ?? null;
  },

  isAuthenticated(): boolean {
    return AuthService.getSession() !== null;
  },
} as const;
