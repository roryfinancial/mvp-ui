// ─── Auth service (Supabase + demo bypass) ────────────────────────────────────
// All Supabase calls are wrapped in try/catch so callers always receive a typed
// result and loading states never get stuck on a network failure.
//
// Demo bypass: credentials that match DEMO_CREDENTIALS short-circuit Supabase
// and return the seeded in-memory user — so the investor demo works before any
// Supabase users exist in the project.

import { supabase } from "./supabase";
import { Store, DEMO_CREDENTIALS } from "./store";
import type { User, UserRole, LoginResult, SignUpResult } from "./types";
import type { User as SupabaseUser } from "@supabase/supabase-js";

// ─── Helpers ─────────────────────────────────────────────────────────────────

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

async function fetchProfile(userId: string): Promise<Record<string, unknown> | null> {
  try {
    const { data } = await supabase.from("profiles").select("*").eq("id", userId).single();
    return data;
  } catch {
    return null;
  }
}

function networkError(): { ok: false; error: string; field: "general" } {
  return { ok: false, error: "Network error — check your connection and try again.", field: "general" };
}

// ─── Service ─────────────────────────────────────────────────────────────────

export const AuthService = {
  async login(email: string, password: string): Promise<LoginResult> {
    // Demo bypass — works before Supabase has these users provisioned.
    const isCreatorDemo = email === DEMO_CREDENTIALS.creator.email && password === DEMO_CREDENTIALS.creator.password;
    const isFanDemo = email === DEMO_CREDENTIALS.fan.email && password === DEMO_CREDENTIALS.fan.password;
    if (isCreatorDemo || isFanDemo) {
      const user = Store.findUserByEmail(email)?.user;
      if (user) return { ok: true, user };
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) return { ok: false, error: error.message, field: "general" };
      const profile = await fetchProfile(data.user.id);
      return { ok: true, user: mapSupabaseUser(data.user, profile) };
    } catch {
      return networkError();
    }
  },

  async signUp(email: string, password: string, role: UserRole = "creator"): Promise<SignUpResult> {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { role } },
      });
      if (error) return { ok: false, error: error.message, field: "general" };
      if (!data.user) return { ok: false, error: "Sign-up failed. Please try again.", field: "general" };
      const confirmEmail = !data.session;
      const profile = data.session ? await fetchProfile(data.user.id) : null;
      return { ok: true, user: mapSupabaseUser(data.user, profile), confirmEmail };
    } catch {
      return networkError();
    }
  },

  async signInWithProvider(provider: "google" | "twitch" | "twitter") {
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) throw error;
  },

  async logout(): Promise<void> {
    try { await supabase.auth.signOut(); } catch { /* ignore */ }
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
    try {
      const { error } = await supabase.auth.signInWithOtp({ email, options: { shouldCreateUser: true } });
      return error ? { ok: false, error: error.message } : { ok: true };
    } catch {
      return { ok: false, error: "Failed to send code. Check your connection." };
    }
  },

  async verifyEmailOtp(email: string, token: string): Promise<LoginResult> {
    try {
      const { data, error } = await supabase.auth.verifyOtp({ email, token, type: "email" });
      if (error || !data.user) return { ok: false, error: error?.message ?? "Invalid or expired code", field: "general" };
      const profile = await fetchProfile(data.user.id);
      return { ok: true, user: mapSupabaseUser(data.user, profile) };
    } catch {
      return networkError();
    }
  },

  async sendPhoneOtp(phone: string): Promise<{ ok: boolean; error?: string }> {
    try {
      const { error } = await supabase.auth.signInWithOtp({ phone });
      return error ? { ok: false, error: error.message } : { ok: true };
    } catch {
      return { ok: false, error: "Failed to send code. Check your connection." };
    }
  },

  async verifyPhoneOtp(phone: string, token: string): Promise<LoginResult> {
    try {
      const { data, error } = await supabase.auth.verifyOtp({ phone, token, type: "sms" });
      if (error || !data.user) return { ok: false, error: error?.message ?? "Invalid or expired code", field: "general" };
      const profile = await fetchProfile(data.user.id);
      return { ok: true, user: mapSupabaseUser(data.user, profile) };
    } catch {
      return networkError();
    }
  },
} as const;
