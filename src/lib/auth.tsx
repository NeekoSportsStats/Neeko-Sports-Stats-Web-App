import { createContext, useContext, useEffect, useState, useRef } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabaseClient";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isPremium: boolean;
  refreshPremiumStatus: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  isPremium: false,
  refreshPremiumStatus: async () => {},
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPremium, setIsPremium] = useState(false);

  const initializedRef = useRef(false);
  const mountedRef = useRef(true);
  const initialEventRef = useRef(false);
  const loadingResolvedRef = useRef(false);

  /* -------------------------------------------------------
     FETCH PREMIUM STATUS
  ------------------------------------------------------- */
  const fetchPremiumStatus = async (userId: string) => {
    if (!mountedRef.current) return;

    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("subscription_status")
        .eq("id", userId)
        .maybeSingle();

      if (error) {
        console.error("❌ Premium status error:", error);
        if (mountedRef.current) setIsPremium(false);
        return;
      }

      const isActive = data?.subscription_status === "active";
      console.log("⭐ Premium status:", isActive);
      if (mountedRef.current) setIsPremium(isActive);
    } catch (err) {
      console.error("❌ Premium status exception:", err);
      if (mountedRef.current) setIsPremium(false);
    }
  };

  const refreshPremiumStatus = async () => {
    if (!user?.id) return;
    await fetchPremiumStatus(user.id);
  };

  /* -------------------------------------------------------
     SIGN OUT — FULL FIX (IMPORTANT)
  ------------------------------------------------------- */
  const signOut = async () => {
    console.log("🚪 Logging out…");

    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error("❌ signOut error:", err);
    }

    // 🔥 Critical for PKCE apps:
    // Clears stale session artifacts
    Object.keys(localStorage)
      .filter((k) => k.includes("sb-") || k.includes("auth"))
      .forEach((k) => localStorage.removeItem(k));

    if (mountedRef.current) {
      setUser(null);
      setIsPremium(false);
      setLoading(false);
    }
  };

  /* -------------------------------------------------------
     APPLY SESSION SAFELY
  ------------------------------------------------------- */
  const applySession = async (session: any, source: string) => {
    if (!mountedRef.current) return;

    const currentUser = session?.user ?? null;

    if (currentUser === undefined) {
      console.error(`⚠️ CRITICAL: session.user undefined from ${source}`);
      setUser(null);
      setIsPremium(false);
      return;
    }

    console.log(`📥 applySession from ${source}`, { hasUser: !!currentUser });

    setUser(currentUser);

    if (currentUser) {
      await fetchPremiumStatus(currentUser.id);
    } else {
      setIsPremium(false);
    }
  };

  /* -------------------------------------------------------
     RESOLVE LOADING EXACTLY ONCE
  ------------------------------------------------------- */
  const resolveLoading = () => {
    if (loadingResolvedRef.current) return;
    loadingResolvedRef.current = true;

    if (mountedRef.current) {
      console.log("✅ Loading resolved");
      setLoading(false);
    }
  };

  /* -------------------------------------------------------
     INIT AUTH LISTENER
  ------------------------------------------------------- */
  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    console.log("⚡ AuthProvider: Initializing auth state");

    const { data: listener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mountedRef.current) return;

        console.log("🟣 AUTH EVENT:", event);

        if (event === "INITIAL_SESSION") {
          initialEventRef.current = true;
          await applySession(session, "INITIAL_SESSION");
          resolveLoading();
        }

        if (event === "SIGNED_IN") {
          await applySession(session, "SIGNED_IN");

          // Prevent SIGNED_IN from firing before INITIAL_SESSION
          if (!initialEventRef.current) {
            console.log("⚠️ SIGNED_IN before INITIAL_SESSION — forcing resolve");
            initialEventRef.current = true;
          }

          resolveLoading();
        }

        if (event === "SIGNED_OUT") {
          setUser(null);
          setIsPremium(false);
          resolveLoading();
        }
      }
    );

    // Fall back in case INITIAL_SESSION never fires (PKCE bug)
    const timeout = setTimeout(() => {
      if (!initialEventRef.current) {
        console.log("⏱️ INITIAL_SESSION timeout — forcing resolve");
        resolveLoading();
      }
    }, 5000);

    return () => {
      mountedRef.current = false;
      clearTimeout(timeout);
      listener.subscription.unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, loading, isPremium, refreshPremiumStatus, signOut }}
    >
      {children}
    </AuthContext.Provider>
  );
};
