import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { supabase } from "../lib/supabase";
import { authApi } from "../lib/api";
import type { User, UserRole, LoginResult, SignUpResult } from "../lib/types";
import type { UserProfileResponse } from "../lib/api";

interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<LoginResult>;
  signUp: (email: string, password: string, role?: UserRole) => Promise<SignUpResult>;
  signInWithProvider: (provider: "google" | "twitch" | "twitter") => Promise<void>;
  logout: () => Promise<void>;
  completeProfile: (username: string, displayName: string, userType: UserRole, referralCode?: string) => Promise<{ ok: boolean; error?: string }>;
  updateBalance: (balance: number) => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function mapProfileToUser(profile: UserProfileResponse): User {
  const isProvisional = profile.username.startsWith("user_");
  return {
    id: profile.id,
    email: profile.email,
    username: profile.username,
    displayName: profile.displayName,
    role: profile.userType.toLowerCase() as UserRole,
    bio: profile.bio,
    avatarUrl: profile.avatarUrl,
    creditBalance: profile.creditBalance,
    referralCode: profile.referralCode,
    stripeOnboardingComplete: profile.stripeOnboardingComplete,
    isProfileComplete: !isProvisional,
    createdAt: profile.createdAt,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetches profile from backend, passing a token directly to avoid getSession() timing issues.
  const fetchProfileWithToken = useCallback(async (token: string): Promise<User | null> => {
    try {
      const res = await authApi.getMe(token);
      if (res.success && res.data) {
        return mapProfileToUser(res.data);
      }
      return null;
    } catch {
      return null;
    }
  }, []);

  // Fetches profile using the current session (for refreshes / non-auth-triggered calls).
  const fetchProfile = useCallback(async (): Promise<User | null> => {
    try {
      const res = await authApi.getMe();
      if (res.success && res.data) {
        return mapProfileToUser(res.data);
      }
      return null;
    } catch {
      return null;
    }
  }, []);

  // Listen for Supabase auth state changes. When authenticated, load profile from backend.
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.access_token) {
        const profile = await fetchProfileWithToken(session.access_token);
        setUser(profile);
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [fetchProfileWithToken]);

  const login = useCallback(async (email: string, password: string): Promise<LoginResult> => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      return { ok: false, error: error.message, field: "general" };
    }
    const token = data.session?.access_token;
    if (!token) {
      return { ok: false, error: "No session returned", field: "general" };
    }
    const profile = await fetchProfileWithToken(token);
    if (profile) {
      setUser(profile);
      return { ok: true, user: profile };
    }
    return { ok: false, error: "Failed to load profile", field: "general" };
  }, [fetchProfileWithToken]);

  const signUp = useCallback(async (email: string, password: string, role: UserRole = "creator"): Promise<SignUpResult> => {
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

    if (data.session?.access_token) {
      const profile = await fetchProfileWithToken(data.session.access_token);
      if (profile) {
        setUser(profile);
        return { ok: true, user: profile, confirmEmail: false };
      }
    }

    // Email confirmation required or profile fetch failed
    return {
      ok: true,
      user: {
        id: data.user.id,
        email: data.user.email ?? "",
        username: "",
        displayName: "",
        role,
        bio: "",
        avatarUrl: null,
        creditBalance: 0,
        referralCode: null,
        stripeOnboardingComplete: false,
        isProfileComplete: false,
        createdAt: data.user.created_at,
      },
      confirmEmail,
    };
  }, [fetchProfileWithToken]);

  const signInWithProvider = useCallback(async (provider: "google" | "twitch" | "twitter") => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) throw error;
  }, []);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
  }, []);

  const completeProfile = useCallback(async (
    username: string,
    displayName: string,
    userType: UserRole,
    referralCode?: string
  ): Promise<{ ok: boolean; error?: string }> => {
    const res = await authApi.completeProfile({
      username,
      displayName: displayName || undefined,
      userType: userType.toUpperCase() as "CREATOR" | "SUPPORTER",
      referralCode: referralCode || undefined,
    });

    if (res.success && res.data) {
      setUser(mapProfileToUser(res.data));
      return { ok: true };
    }
    return { ok: false, error: res.error?.message ?? "Failed to complete profile" };
  }, []);

  const updateBalance = useCallback((balance: number) => {
    setUser((prev) => (prev ? { ...prev, creditBalance: balance } : prev));
  }, []);

  const refreshUser = useCallback(async () => {
    const profile = await fetchProfile();
    if (profile) setUser(profile);
  }, [fetchProfile]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: user !== null,
        loading,
        login,
        signUp,
        signInWithProvider,
        logout,
        completeProfile,
        updateBalance,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
