// src/lib/auth.ts
import { createContext, useContext, useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabaseClient";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isPremium: boolean;
  refreshUser: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  isPremium: false,
  refreshUser: async () => {},
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPremium, setIsPremium] = useState(false);

  /**
   * Fetch premium status from DB
   */
  const fetchPremiumStatus = async (userId: string) => {
    try {
      const { data } = await supabase
        .from("profiles")
        .select("subscription_status")
        .eq("id", userId)
        .maybeSingle();

      setIsPremium(data?.subscription_status === "active");
    } catch (error) {
      console.error("💥 Premium status error:", error);
      setIsPremium(false);
    }
  };

  /**
   * Force-refresh session + premium
   */
  const refreshUser = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    const currentUser = session?.user ?? null;
    setUser(currentUser);

    if (currentUser) {
      await fetchPremiumStatus(currentUser.id);
    }
  };

  /**
   * Initial load + AUTH LISTENER FIX
   *
   * This ensures PKCE restores the session BEFORE your app loads.
   */
  useEffect(() => {
    let mounted = true;
    let initialAuthHandled = false;

    // 🔥 1️⃣ FIRST: auth listener (catches PKCE redirect instantly)
    const { data: listener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        const currentUser = session?.user ?? null;
        setUser(currentUser);

        if (currentUser) {
          await fetchPremiumStatus(currentUser.id);
        } else {
          setIsPremium(false);
        }

        // Make sure initial load waits until this fires once
        if (!initialAuthHandled) {
          initialAuthHandled = true;
          setLoading(false);
        }
      }
    );

    // 🔥 2️⃣ SECOND: initial session load (in case listener didn't fire)
    const loadInitial = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!mounted) return;

      const currentUser = session?.user ?? null;
      setUser(currentUser);

      if (currentUser) {
        await fetchPremiumStatus(currentUser.id);
      }

      // Only end loading if listener didn’t already do it
      if (!initialAuthHandled) {
        initialAuthHandled = true;
        setLoading(false);
      }
    };

    // Small delay to allow PKCE to complete BEFORE reading session
    setTimeout(loadInitial, 50);

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  /**
   * Logout
   */
  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setIsPremium(false);
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, isPremium, refreshUser, signOut }}
    >
      {children}
    </AuthContext.Provider>
  );
};
