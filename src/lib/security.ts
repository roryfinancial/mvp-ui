// ─── Security utilities ───────────────────────────────────────────────────────
// Centralizes all input validation and sanitization. When moving to a real
// backend, most of this logic moves server-side; keep client-side validation
// as UX feedback only.

// Strips HTML tags and encodes entities to prevent XSS in rendered content.
export function sanitize(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");
}

export function validateEmail(email: string): string | null {
  if (!email.trim()) return "Email is required";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return "Enter a valid email address";
  return null;
}

export function validatePassword(password: string): string | null {
  if (!password) return "Password is required";
  if (password.length < 6) return "Password must be at least 6 characters";
  return null;
}

// Cryptographically random 32-byte session token.
// In production the server generates this and signs it (JWT or opaque token).
export function generateToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

// Constant-time string comparison to prevent timing-based side-channel attacks.
export function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

// Demo-only password storage. Structure mirrors where bcrypt.compare() would
// live on the server. Never use btoa for real passwords.
export function hashPassword(plain: string): string {
  return btoa(`rory:${plain}:v1`);
}

export function verifyPassword(plain: string, storedHash: string): boolean {
  return constantTimeEqual(hashPassword(plain), storedHash);
}

// Client-side rate limiting token bucket — prevents brute-force in the demo.
// In production, rate limiting belongs on the server (Redis / API gateway).
const _attempts: { count: number; resetAt: number } = { count: 0, resetAt: 0 };

export function checkRateLimit(): { allowed: boolean; retryAfterMs: number } {
  const now = Date.now();
  if (now > _attempts.resetAt) {
    _attempts.count = 0;
    _attempts.resetAt = now + 60_000; // 1-minute window
  }
  _attempts.count++;
  if (_attempts.count > 5) {
    return { allowed: false, retryAfterMs: _attempts.resetAt - now };
  }
  return { allowed: true, retryAfterMs: 0 };
}

export function resetRateLimit(): void {
  _attempts.count = 0;
  _attempts.resetAt = 0;
}
