// ─── Auth service (Supabase) ──────────────────────────────────────────────────
// Wraps Supabase Auth so callers (AuthContext) interact with app-level types
// instead of Supabase types directly.

import { supabase } from "./supabase";
import type { User, UserRole, LoginResult, SignUpResult } from "./types";
import type { User as SupabaseUser } from "@supabase/supabase-js";

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Maps a Supabase user + optional profile row into our app User. */
export function mapSupabaseUser(su: SupabaseUser, profile?: Record<string, unknown> | null): User {
  return {
    id: su.id,
    email: su.email ?? "",
    username: (profile?.username as string) ?? su.email?.split("@")[0] ?? "",
    displayName: (profile?.display_name as string) ?? su.user_metadata?.full_name ?? su.email?.split("@")[0] ?? "",
    role: ((profile?.role as string) ?? su.user_metadata?.role ?? "creator") as UserRole,
    bio: (profile?.bio as string) ?? "",
    avatarUrl: (profile?.avatar_url as string) ?? su.user_metadata?.avatar_url ?? null,
    creditBalance: (profile?.credit_balance as number) ?? 0,
    createdAt: su.created_at,
  };
}

/** Tries to load the user's profile row from the `profiles` table. */
async function fetchProfile(userId: string): Promise<Record<string, unknown> | null> {
  const { data } = await supabase.from("profiles").select("*").eq("id", userId).single();
  return data;
}

// ─── Service ─────────────────────────────────────────────────────────────────

export const AuthService = {
  async login(email: string, password: string): Promise<LoginResult> {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      return { ok: false, error: error.message, field: "general" };
    }

    const profile = await fetchProfile(data.user.id);
    return { ok: true, user: mapSupabaseUser(data.user, profile) };
  },

  async signUp(email: string, password: string, role: UserRole = "creator"): Promise<SignUpResult> {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { role } },
    });

    if (error) {
      return { ok: false, error: error.message, field: "general" };
    }

    if (!data.user) {
      return { ok: false, error: "Sign-up failed. Please try again.", field: "general" };
    }

    const confirmEmail = !data.session;
    const profile = data.session ? await fetchProfile(data.user.id) : null;

    return {
      ok: true,
      user: mapSupabaseUser(data.user, profile),
      confirmEmail,
    };
  },

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

  async getUser(): Promise<User | null> {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return null;
    const profile = await fetchProfile(session.user.id);
    return mapSupabaseUser(session.user, profile);
  },

  onAuthStateChange(callback: (user: User | null) => void) {
    return supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        const profile = await fetchProfile(session.user.id);
        callback(mapSupabaseUser(session.user, profile));
      } else {
        callback(null);
      }
    });
  },

  async sendOtp(email: string): Promise<{ ok: boolean; error?: string }> {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: true },
    });
    return error ? { ok: false, error: error.message } : { ok: true };
  },

  async verifyEmailOtp(email: string, token: string): Promise<LoginResult> {
    const { data, error } = await supabase.auth.verifyOtp({ email, token, type: "email" });
    if (error || !data.user) return { ok: false, error: error?.message ?? "Invalid or expired code", field: "general" };
    const profile = await fetchProfile(data.user.id);
    return { ok: true, user: mapSupabaseUser(data.user, profile) };
  },

  async sendPhoneOtp(phone: string): Promise<{ ok: boolean; error?: string }> {
    const { error } = await supabase.auth.signInWithOtp({ phone });
    return error ? { ok: false, error: error.message } : { ok: true };
  },

  async verifyPhoneOtp(phone: string, token: string): Promise<LoginResult> {
    const { data, error } = await supabase.auth.verifyOtp({ phone, token, type: "sms" });
    if (error || !data.user) return { ok: false, error: error?.message ?? "Invalid or expired code", field: "general" };
    const profile = await fetchProfile(data.user.id);
    return { ok: true, user: mapSupabaseUser(data.user, profile) };
  },
} as const;
