import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { authClient } from "../lib/auth-client";
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
  completeProfile: (username: string, displayName: string, userType: UserRole, referralCode?: string, communities?: string[]) => Promise<{ ok: boolean; error?: string }>;
  updateBalance: (balance: number) => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function mapProfileToUser(profile: UserProfileResponse): User {
  const isProvisional = !profile.username || profile.username.startsWith("user_");
  return {
    id: profile.id,
    email: profile.email,
    username: profile.username,
    displayName: profile.displayName,
    role: (profile.userType ?? "CREATOR").toLowerCase() as UserRole,
    bio: profile.bio,
    avatarUrl: profile.avatarUrl,
    creditBalance: profile.creditBalance,
    referralCode: profile.referralCode,
    stripeOnboardingComplete: profile.stripeOnboardingComplete,
    communities: profile.communities ?? [],
    isProfileComplete: !isProvisional,
    createdAt: profile.createdAt,
  };
}

async function fetchMe(): Promise<User | null> {
  try {
    const res = await fetch("/api/users/me", { credentials: "include" });
    if (!res.ok) return null;
    const body = await res.json();
    if (body.success && body.data) return mapProfileToUser(body.data);
    return null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMe().then((u) => {
      setUser(u);
      setLoading(false);
    });
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<LoginResult> => {
    const { data, error } = await authClient.signIn.email({ email, password });
    if (error) return { ok: false, error: error.message ?? "Login failed", field: "general" };
    if (!data) return { ok: false, error: "No session returned", field: "general" };
    const profile = await fetchMe();
    if (profile) {
      setUser(profile);
      return { ok: true, user: profile };
    }
    return { ok: false, error: "Failed to load profile", field: "general" };
  }, []);

  const signUp = useCallback(async (email: string, password: string, role: UserRole = "creator"): Promise<SignUpResult> => {
    const { data, error } = await authClient.signUp.email({
      email,
      password,
      name: email.split("@")[0],
      callbackURL: `${window.location.origin}/auth/callback`,
    });
    if (error) return { ok: false, error: error.message ?? "Sign-up failed", field: "general" };
    if (!data) return { ok: false, error: "Sign-up failed. Please try again.", field: "general" };

    const profile = await fetchMe();
    if (profile) {
      setUser(profile);
      return { ok: true, user: profile, confirmEmail: false };
    }
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
        communities: [],
        isProfileComplete: false,
        createdAt: data.user.createdAt instanceof Date ? data.user.createdAt.toISOString() : String(data.user.createdAt),
      },
      confirmEmail: false,
    };
  }, []);

  const signInWithProvider = useCallback(async (provider: "google" | "twitch" | "twitter") => {
    await authClient.signIn.social({
      provider,
      callbackURL: `${window.location.origin}/auth/callback`,
    });
  }, []);

  const logout = useCallback(async () => {
    await authClient.signOut();
    setUser(null);
  }, []);

  const completeProfile = useCallback(async (
    username: string,
    displayName: string,
    userType: UserRole,
    referralCode?: string,
    communities?: string[]
  ): Promise<{ ok: boolean; error?: string }> => {
    try {
      const res = await fetch(`/api/users/${username}/complete-profile`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username,
          displayName: displayName || undefined,
          userType: userType.toUpperCase(),
          referralCode: referralCode || undefined,
          communities: communities?.length ? communities : undefined,
        }),
      });
      const body = await res.json();
      if (body.success && body.data) {
        setUser(mapProfileToUser(body.data));
        return { ok: true };
      }
      return { ok: false, error: body.error?.message ?? "Failed to complete profile" };
    } catch {
      return { ok: false, error: "Network error" };
    }
  }, []);

  const updateBalance = useCallback((balance: number) => {
    setUser((prev) => (prev ? { ...prev, creditBalance: balance } : prev));
  }, []);

  const refreshUser = useCallback(async () => {
    const profile = await fetchMe();
    if (profile) setUser(profile);
  }, []);

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
