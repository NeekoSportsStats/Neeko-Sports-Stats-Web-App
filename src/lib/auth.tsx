// src/lib/auth.ts
import { createContext, useContext, useEffect, useState } from "react";
import { User } from "@supabase/supabase-js";
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
   * Load premium status from DB
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
      console.error("💥 Error fetching premium status:", error);
      setIsPremium(false);
    }
  };

  /**
   * Fully refresh user + premium status
   */
  const refreshUser = async () => {
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();

    if (error) {
      console.error("💥 refreshUser session error:", error);
    }

    const currentUser = session?.user ?? null;
    setUser(currentUser);

    if (currentUser) {
      await fetchPremiumStatus(currentUser.id);
    }
  };

  /**
   * Initial auth load and listener
   */
  useEffect(() => {
    let mounted = true;

    const load = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!mounted) return;

      const currentUser = session?.user ?? null;
      setUser(currentUser);

      if (currentUser) {
        await fetchPremiumStatus(currentUser.id);
      }

      setLoading(false);
    };

    load();

    // Auth state listener
    const {
      data: authListener,
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);

      if (currentUser) {
        await fetchPremiumStatus(currentUser.id);
      } else {
        setIsPremium(false);
      }
    });

    return () => {
      mounted = false;
      authListener.subscription.unsubscribe();
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
