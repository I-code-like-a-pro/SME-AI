"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { getUser, signOut as clearSession } from "./storage";
import type { AuthUser } from "./types";

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function refresh() {
      try {
        const current = await getUser();
        if (mounted) setUser(current);
      } catch (error) {
        console.error("Auth check failed:", error);
        if (mounted) setUser(null);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    refresh();

    // Keep auth state in sync after sign-in/out and across browser tabs.
    function onAuthChanged() {
      getUser().then((u) => {
        if (mounted) setUser(u);
      });
    }
    window.addEventListener("sme-ai:auth-changed", onAuthChanged);
    window.addEventListener("storage", onAuthChanged);

    return () => {
      mounted = false;
      window.removeEventListener("sme-ai:auth-changed", onAuthChanged);
      window.removeEventListener("storage", onAuthChanged);
    };
  }, []);

  async function handleSignOut() {
    try {
      await clearSession();
      setUser(null);
    } catch (error) {
      console.error("Sign out failed:", error);
      throw error;
    }
  }

  return (
    <AuthContext.Provider value={{ user, loading, signOut: handleSignOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
