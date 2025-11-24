// src/lib/auth.tsx
import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
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

  // NEW: Track whether INITIAL_SESSION has occurred
  const initialSessionSeenRef = useRef(false);

  /**
   * Fetch premium status from `profiles` for a given user id.
   */
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

  /**
   * Public method to re-check premium status for the current user.
   */
  const refreshPremiumStatus = useCallback(async () => {
    if (!user?.id) {
      console.log("⚠️ refreshPremiumStatus: no user, skipping");
      return;
    }
    console.log("🔄 refreshPremiumStatus() for", user.id);
    await fetchPremiumStatus(user.id);
  }, [user?.id, fetchPremiumStatus]);

  /**
   * Logout helper – only runs when you explicitly call signOut()
   */
  const signOut = useCallback(async () => {
    console.log("🚪 Logging out…");
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error("❌ signOut error:", err);
    }

    setUser(null);
    setIsPremium(false);
    setLoading(false);
  }, []);

  /**
   * Initialise auth state and listen for changes.
   */
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

    // 1️⃣ Initial session hydrate
    (async () => {
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (!isMounted) return;

        if (error) {
          console.error("❌ Initial getSession error:", error);
          setUser(null);
          setIsPremium(false);
          setLoading(false);
          return;
        }

        await applySession(session, "getSession");
      } catch (err) {
        console.error("❌ Initial getSession exception:", err);
        if (isMounted) {
          setUser(null);
          setIsPremium(false);
        }
      } finally {
        if (isMounted) {
          console.log("✅ Initial auth state resolved");
          setLoading(false);
        }
      }
    })();

    // 2️⃣ Auth listener
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isMounted) return;

      console.log("🟣 AUTH EVENT:", event, "| hasSession:", !!session);

      // NEW: Ignore premature SIGNED_IN before INITIAL_SESSION
      if (event === "SIGNED_IN" && !initialSessionSeenRef.current) {
        console.log("⛔ Ignoring premature SIGNED_IN before INITIAL_SESSION");
        return;
      }

      switch (event) {
        case "INITIAL_SESSION":
          initialSessionSeenRef.current = true;
          await applySession(session, event);
          setLoading(false);
          break;

        case "SIGNED_IN":
        case "TOKEN_REFRESHED":
        case "USER_UPDATED":
          await applySession(session, event);
          setLoading(false);
          break;

        case "SIGNED_OUT":
          console.log("🚪 AUTH EVENT: SIGNED_OUT");
          setUser(null);
          setIsPremium(false);
          setLoading(false);
          break;

        default:
          break;
      }
    });

    return () => {
      console.log("🧹 AuthProvider: cleanup");
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [fetchPremiumStatus]);

  console.log("🔧 AuthProvider render:", {
    user: user?.email,
    loading,
    isPremium,
  });

  return (
    <AuthContext.Provider
      value={{ user, loading, isPremium, refreshPremiumStatus, signOut }}
    >
      {children}
    </AuthContext.Provider>
  );
};
