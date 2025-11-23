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
    console.log("🔍 Fetching premium status for user:", userId);

    try {
      const { data } = await supabase
        .from("profiles")
        .select("subscription_status")
        .eq("id", userId)
        .maybeSingle();

      console.log("⭐ Premium DB result:", data);

      setIsPremium(data?.subscription_status === "active");
    } catch (e) {
      console.error("❌ Premium status error:", e);
      setIsPremium(false);
    }
  };

  // -------------------------------
  // Force refresh
  // -------------------------------
  const refreshUser = async () => {
    console.log("🔄 refreshUser() called");

    const { data } = await supabase.auth.getSession();
    console.log("🔄 refreshUser session:", data);

    const currentUser = data.session?.user ?? null;
    setUser(currentUser);

    if (currentUser) {
      console.log("🔄 refreshUser → fetching premium");
      await fetchPremiumStatus(currentUser.id);
    }
  };

  // -------------------------------
  // MAIN AUTH LOGIC — DEBUG MODE
  // -------------------------------
  useEffect(() => {
    console.log("⚡ Auth effect INIT");

    let first = true;

    // 🔥 LISTENER
    const { data: listener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log("🟣 AUTH EVENT FIRED:", event);
        console.log("🟣 Auth session from event:", session);

        const currentUser = session?.user ?? null;

        setUser(currentUser);

        if (currentUser) {
          console.log("🟣 Auth event → Fetching premium");
          await fetchPremiumStatus(currentUser.id);
        } else {
          console.log("🟣 No user in auth event");
          setIsPremium(false);
        }

        if (first) {
          console.log("🟣 Auth event completed initial load.");
          first = false;
          setLoading(false);
        }
      }
    );

    // 🔥 INITIAL SESSION LOAD
    supabase.auth.getSession().then(async ({ data }) => {
      console.log("🟡 getSession() returned:", data);

      if (!first) {
        console.log("🟡 Ignoring getSession — listener already handled.");
        return;
      }

      const currentUser = data.session?.user ?? null;
      console.log("🟡 Initial user:", currentUser);

      setUser(currentUser);

      if (currentUser) {
        console.log("🟡 Initial → Fetching premium");
        await fetchPremiumStatus(currentUser.id);
      } else {
        console.log("🟡 No initial user");
      }

      console.log("🟡 getSession completed initial load.");
      first = false;
      setLoading(false);
    });

    return () => {
      console.log("🔻 AuthProvider unmounted — unsubscribing listener");
      listener.subscription.unsubscribe();
    };
  }, []);

  // -------------------------------
  // LOGOUT
  // -------------------------------
  const signOut = async () => {
    console.log("🚪 signOut() called");
    await supabase.auth.signOut();
    console.log("🚪 User signed out");

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
