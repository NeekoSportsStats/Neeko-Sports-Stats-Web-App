// src/lib/auth.tsx
import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
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

  /* -------------------------------------------------------
     FETCH PREMIUM STATUS
  ------------------------------------------------------- */
  const fetchPremiumStatus = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("subscription_status")
        .eq("id", userId)
        .maybeSingle();

      if (error) {
        console.error("❌ Premium status error:", error);
        setIsPremium(false);
        return;
      }

      const active = data?.subscription_status === "active";
      console.log("⭐ Premium status:", active, "for user:", userId);
      setIsPremium(active);
    } catch (err) {
      console.error("❌ Premium status exception:", err);
      setIsPremium(false);
    }
  }, []);

  const refreshPremiumStatus = useCallback(async () => {
    if (!user?.id) return;
    console.log("🔄 refreshPremiumStatus() for", user.id);
    await fetchPremiumStatus(user.id);
  }, [user?.id, fetchPremiumStatus]);

  /* -------------------------------------------------------
     FIXED SIGN OUT — clears PKCE localStorage
  ------------------------------------------------------- */
  const signOut = useCallback(async () => {
    console.log("🚪 Logging out…");

    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error("❌ signOut error:", err);
    }

    // 🔥 Critical: clear ANY Supabase auth artifacts
    // (Fixes bug where user is instantly “re-signed in”)
    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith("sb-") || key.includes("auth")) {
        console.log("🧹 Clearing key:", key);
        localStorage.removeItem(key);
      }
    });

    setUser(null);
    setIsPremium(false);
    setLoading(false);
  }, []);

  /* -------------------------------------------------------
     INITIAL SESSION + LISTENER
  ------------------------------------------------------- */
  useEffect(() => {
    let isMounted = true;
    console.log("⚡ AuthProvider: init");

    const applySession = async (session: any, source: string) => {
      if (!isMounted) return;

      const currentUser = session?.user ?? null;

      console.log(`📥 applySession from ${source}`, {
        hasUser: !!currentUser,
        userId: currentUser?.id,
      });

      setUser(currentUser);

      if (currentUser?.id) {
        await fetchPremiumStatus(currentUser.id);
      } else {
        setIsPremium(false);
      }
    };

    // Initial session hydrate
    (async () => {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (!isMounted) return;

      if (error) {
        console.error("❌ getSession error:", error);
        setUser(null);
        setIsPremium(false);
        setLoading(false);
        return;
      }

      await applySession(session, "getSession");
      setLoading(false);
    })();

    // Subscribe
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!isMounted) return;

        console.log("🟣 AUTH EVENT:", event);

        switch (event) {
          case "SIGNED_IN":
          case "USER_UPDATED":
          case "TOKEN_REFRESHED":
          case "INITIAL_SESSION":
            await applySession(session, event);
            setLoading(false);
            break;

          case "SIGNED_OUT":
            console.log("🚪 AUTH EVENT: SIGNED_OUT");
            setUser(null);
            setIsPremium(false);
            setLoading(false);
            break;
        }
      }
    );

    return () => {
      console.log("🧹 AuthProvider: cleanup");
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [fetchPremiumStatus]);

  return (
    <AuthContext.Provider
      value={{ user, loading, isPremium, refreshPremiumStatus, signOut }}
    >
      {children}
    </AuthContext.Provider>
  );
};
