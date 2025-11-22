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

  const fetchPremiumStatus = async (userId: string) => {
    try {
      const { data: profile, error } = await supabase
        .from("profiles")
        .select("subscription_status")
        .eq("id", userId)
        .maybeSingle();

      if (error && error.code !== "PGRST116") {
        console.error("Premium fetch error:", error);
      }

      setIsPremium(profile?.subscription_status === "active");
    } catch (error) {
      console.error("Premium fetch error:", error);
      setIsPremium(false);
    }
  };

  const refreshUser = async () => {
    try {
      setLoading(true);
      const { data } = await supabase.auth.getSession();
      const session = data.session;
      const currentUser = session?.user ?? null;

      setUser(currentUser);
      if (currentUser) {
        await fetchPremiumStatus(currentUser.id);
      } else {
        setIsPremium(false);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Initial load
    supabase.auth.getSession().then(({ data }) => {
      const session = data.session;
      const currentUser = session?.user ?? null;

      setUser(currentUser);
      if (currentUser) fetchPremiumStatus(currentUser.id);

      setLoading(false);
    });

    // Auth state listener
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
    // auth listener + refreshUser will handle state
    await refreshUser();
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, isPremium, signOut, refreshUser }}
    >
      {children}
    </AuthContext.Provider>
  );
};
