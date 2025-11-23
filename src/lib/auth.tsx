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

  /** Fetch premium */
  const fetchPremiumStatus = useCallback(async (userId: string) => {
    try {
      const { data } = await supabase
        .from("profiles")
        .select("subscription_status")
        .eq("id", userId)
        .maybeSingle();

      setIsPremium(data?.subscription_status === "active");
    } catch {
      setIsPremium(false);
    }
  }, []);

  /** Refresh premium */
  const refreshPremiumStatus = useCallback(async () => {
    if (!user?.id) return;
    await fetchPremiumStatus(user.id);
  }, [user, fetchPremiumStatus]);

  /** Auth lifecycle */
  useEffect(() => {
    let mounted = true;

    console.log("⚡ AuthProvider mounted");

    /** 1️⃣ Initial session hydration (FIRST and ONLY place loading is cleared) */
    supabase.auth.getSession().then(async ({ data }) => {
      if (!mounted) return;

      const sessionUser = data.session?.user ?? null;
      console.log("🟡 Initial session:", sessionUser);

      setUser(sessionUser);

      if (sessionUser) {
        await fetchPremiumStatus(sessionUser.id);
      }

      // ❗ CRITICAL: loading becomes false ONLY HERE
      setLoading(false);
    });

    /** 2️⃣ Listen for any sign-in/sign-out changes */
    const { data: listener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;

        console.log("🟣 AUTH EVENT:", event);

        const sessionUser = session?.user ?? null;
        setUser(sessionUser);

        if (sessionUser) {
          await fetchPremiumStatus(sessionUser.id);
        } else {
          setIsPremium(false);
        }
      }
    );

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, [fetchPremiumStatus]);

  /** Logout */
  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setIsPremium(false);
    setLoading(false);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isPremium,
        refreshPremiumStatus,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
