"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { AuthUser } from "./types";
import { getUser, signIn as signInLocal, signOut as signOutLocal, signUp as signUpLocal } from "./storage";

type AuthContextValue = {
  user: AuthUser | null;
  loading: boolean;
  signIn: (email: string) => Promise<AuthUser>;
  signUp: (email: string) => Promise<AuthUser>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const syncUser = useCallback(async () => {
    const currentUser = await getUser();
    setUser(currentUser);
    setLoading(false);
  }, []);

  useEffect(() => {
    syncUser();

    const handleAuthChanged = () => {
      syncUser();
    };

    window.addEventListener("sme-ai:auth-changed", handleAuthChanged);
    return () => {
      window.removeEventListener("sme-ai:auth-changed", handleAuthChanged);
    };
  }, [syncUser]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      signIn: async (email: string) => {
        const nextUser = await signInLocal(email);
        setUser(nextUser);
        return nextUser;
      },
      signUp: async (email: string) => {
        const nextUser = await signUpLocal(email);
        setUser(nextUser);
        return nextUser;
      },
      signOut: async () => {
        await signOutLocal();
        setUser(null);
      },
    }),
    [user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside an AuthProvider");
  }

  return context;
}
