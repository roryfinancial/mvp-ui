import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import { AuthService } from "../lib/auth";
import type { User, Session, LoginResult } from "../lib/types";

interface AuthState {
  user: User | null;
  session: Session | null;
}

interface AuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<LoginResult>;
  logout: () => void;
  isAuthenticated: boolean;
  updateBalance: (balance: number) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>(() => ({
    session: AuthService.getSession(),
    user: AuthService.getUser(),
  }));

  const login = useCallback(async (email: string, password: string): Promise<LoginResult> => {
    const result = await AuthService.login(email, password);
    if (result.ok) {
      setState({ session: result.session, user: result.user });
    }
    return result;
  }, []);

  const logout = useCallback(() => {
    AuthService.logout();
    setState({ session: null, user: null });
  }, []);

  const updateBalance = useCallback((balance: number) => {
    setState((prev) =>
      prev.user ? { ...prev, user: { ...prev.user, creditBalance: balance } } : prev
    );
  }, []);

  return (
    <AuthContext.Provider
      value={{
        ...state,
        login,
        logout,
        isAuthenticated: state.session !== null,
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
