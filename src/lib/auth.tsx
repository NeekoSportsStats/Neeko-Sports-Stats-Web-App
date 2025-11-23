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
  console.log("🔵 AuthProvider mounted");

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPremium, setIsPremium] = useState(false);

  // -------------------------------
  // Fetch premium status
  // -------------------------------
  const fetchPremiumStatus = async (userId: string) => {
    console.log("🔍 Fetching premium status for:", userId);

    try {
      const { data } = await supabase
        .from("profiles")
        .select("subscription_status")
        .eq("id", userId)
        .maybeSingle();

      console.log("⭐ Premium DB row:", data);
      setIsPremium(data?.subscription_status === "active");
    } catch (e) {
      console.error("❌ Premium status error:", e);
      setIsPremium(false);
    }
  };

  // -------------------------------
  // Manual refresh (Success page)
  // -------------------------------
  const refreshUser = async () => {
    console.log("🔄 refreshUser() called");

    const { data } = await supabase.auth.getSession();
    const currentUser = data.session?.user ?? null;

    setUser(currentUser);

    if (currentUser) {
      await fetchPremiumStatus(currentUser.id);
    }
  };

  // -------------------------------
  // MAIN AUTH FLOW (PATCHED + STABLE)
  // -------------------------------
  useEffect(() => {
    console.log("⚡ Auth effect INIT");

    let resolvedInitial = false;

    // 1️⃣ AUTH STATE LISTENER
    const { data: listener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log("🟣 AUTH EVENT:", event);
        console.log("🟣 Session:", session);

        const currentUser = session?.user ?? null;
        setUser(currentUser);

        if (currentUser) {
          await fetchPremiumStatus(currentUser.id);
        } else {
          setIsPremium(false);
        }

        if (!resolvedInitial) {
          resolvedInitial = true;
          setLoading(false);
        }
      }
    );

    // 2️⃣ INITIAL SESSION LOAD
    supabase.auth.getSession().then(async ({ data }) => {
      console.log("🟡 Initial getSession():", data);

      const currentUser = data.session?.user ?? null;
      setUser(currentUser);

      if (currentUser) {
        await fetchPremiumStatus(currentUser.id);
      }

      if (!resolvedInitial) {
        resolvedInitial = true;
        setLoading(false);
      }
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  // -------------------------------
  // LOGOUT
  // -------------------------------
  const signOut = async () => {
    console.log("🚪 Logging out");
    await supabase.auth.signOut();
    setUser(null);
    setIsPremium(false);
  };

  console.log("🔧 AuthProvider render →", { user, loading, isPremium });

  return (
    <AuthContext.Provider
      value={{ user, loading, isPremium, refreshUser, signOut }}
    >
      {children}
    </AuthContext.Provider>
  );
};
