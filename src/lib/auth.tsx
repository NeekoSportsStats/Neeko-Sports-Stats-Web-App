// src/lib/auth.ts
import { createContext, useContext, useEffect, useState } from "react";
import { User } from "@supabase/supabase-js";
import { supabase } from "./supabaseClient";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isPremium: boolean;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  isPremium: false,
  signOut: async () => {},
  refreshUser: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPremium, setIsPremium] = useState(false);

  // Fetch profile subscription flag
  const fetchPremiumStatus = async (userId: string) => {
    try {
      const { data: profile, error } = await supabase
        .from("profiles")
        .select("subscription_status")
        .eq("id", userId)
        .maybeSingle();

      if (error) console.error("Premium fetch error:", error);

      setIsPremium(profile?.subscription_status === "active");
    } catch (e) {
      console.error("Premium error:", e);
      setIsPremium(false);
    }
  };

  // Refresh user manually (after checkout success)
  const refreshUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    const currentUser = session?.user ?? null;
    setUser(currentUser);

    if (currentUser) {
      await fetchPremiumStatus(currentUser.id);
    }
  };

  // Initial load
  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      const session = data.session;
      const currentUser = session?.user ?? null;

      setUser(currentUser);
      if (currentUser) {
        await fetchPremiumStatus(currentUser.id);
      }

      setLoading(false);
    });

    // Auth listener
    const { data: listener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        const currentUser = session?.user ?? null;
        setUser(currentUser);

        if (currentUser) {
          await fetchPremiumStatus(currentUser.id);
        } else {
          setIsPremium(false);
        }

        setLoading(false);
      }
    );

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setIsPremium(false);
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, isPremium, signOut, refreshUser }}
    >
      {children}
    </AuthContext.Provider>
  );
};
