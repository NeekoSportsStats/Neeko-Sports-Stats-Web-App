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

// 🔒 ensure we only ever register ONE auth listener globally
let authListenerInitialized = false;

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
      const { data, error } = await supabase
        .from("profiles")
        .select("subscription_status")
        .eq("id", userId)
        .maybeSingle();

      if (error) {
        console.error("❌ Premium status error:", error);
      }

      console.log("⭐ Premium DB row:", data);
      setIsPremium(data?.subscription_status === "active");
    } catch (e) {
      console.error("❌ Premium status exception:", e);
      setIsPremium(false);
    }
  };

  // -------------------------------
  // Manual refresh (Success page etc.)
  // -------------------------------
  const refreshUser = async () => {
    console.log("🔄 refreshUser() called");

    try {
      const { data, error } = await supabase.auth.getSession();
      if (error) {
        console.error("❌ getSession error in refreshUser:", error);
      }

      const currentUser = data.session?.user ?? null;
      console.log("🔄 refreshUser → currentUser:", currentUser);

      setUser(currentUser);

      if (currentUser) {
        await fetchPremiumStatus(currentUser.id);
      } else {
        setIsPremium(false);
      }
    } catch (e) {
      console.error("❌ refreshUser exception:", e);
      setUser(null);
      setIsPremium(false);
    }
  };

  // -------------------------------
  // MAIN AUTH FLOW (single listener)
  // -------------------------------
  useEffect(() => {
    console.log("⚡ Auth effect INIT");

    let resolvedInitial = false;

    // 1️⃣ Register the auth state listener ONCE globally
    if (!authListenerInitialized) {
      authListenerInitialized = true;

      const { data } = supabase.auth.onAuthStateChange(
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

      console.log("✅ Auth listener registered:", data?.subscription?.id);
    } else {
      console.log("♻️ Auth listener already initialized – skipping re-register");
    }

    // 2️⃣ Initial session load (in case listener fires slightly later)
    supabase.auth.getSession().then(async ({ data, error }) => {
      console.log("🟡 Initial getSession():", data, error);

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

    // ⛔ DO NOT unsubscribe global listener here – we want it to survive remounts
    return () => {
      console.log("🧹 AuthProvider unmounted (listener kept alive)");
    };
  }, []);

  // -------------------------------
  // LOGOUT
  // -------------------------------
  const signOut = async () => {
    console.log("🚪 Logging out");
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error("❌ signOut error:", error);
      }
    } finally {
      setUser(null);
      setIsPremium(false);
      setLoading(false);
    }
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
