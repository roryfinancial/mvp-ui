import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { AuthService } from "../lib/auth";
import type { User, UserRole, LoginResult, SignUpResult } from "../lib/types";

interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<LoginResult>;
  signUp: (email: string, password: string, role?: UserRole) => Promise<SignUpResult>;
  signInWithProvider: (provider: "google" | "twitch" | "twitter") => Promise<void>;
  logout: () => Promise<void>;
  updateBalance: (balance: number) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Listen for Supabase auth state changes (initial session, sign-in, sign-out, token refresh).
  // We rely solely on onAuthStateChange so the INITIAL_SESSION event (which reads
  // from localStorage) drives the first render — avoids a race with getSession().
  useEffect(() => {
    const { data: { subscription } } = AuthService.onAuthStateChange((u) => {
      setUser(u);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<LoginResult> => {
    const result = await AuthService.login(email, password);
    if (result.ok) setUser(result.user);
    return result;
  }, []);

  const signUp = useCallback(async (email: string, password: string, role?: UserRole): Promise<SignUpResult> => {
    const result = await AuthService.signUp(email, password, role);
    if (result.ok && !result.confirmEmail) setUser(result.user);
    return result;
  }, []);

  const signInWithProvider = useCallback(async (provider: "google" | "twitch" | "twitter") => {
    await AuthService.signInWithProvider(provider);
    // The redirect will trigger onAuthStateChange on return.
  }, []);

  const logout = useCallback(async () => {
    await AuthService.logout();
    setUser(null);
  }, []);

  const updateBalance = useCallback((balance: number) => {
    setUser((prev) => (prev ? { ...prev, creditBalance: balance } : prev));
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
        updateBalance,
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
