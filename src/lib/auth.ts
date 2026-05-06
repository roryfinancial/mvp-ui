// ─── Auth service (Legacy - kept for reference) ──────────────────────────────
// Auth is now handled via AuthContext + the backend API (/api/auth/me).
// This file only exports convenience utilities if needed.

import { supabase } from "./supabase";

export const AuthService = {
  async signInWithProvider(provider: "google" | "twitch" | "twitter") {
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) throw error;
  },

  async logout(): Promise<void> {
    await supabase.auth.signOut();
  },
} as const;
