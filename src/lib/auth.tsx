import { createContext, useContext, useEffect, useState, useCallback } from "react";
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

      const isActive = data?.subscription_status === "active";
      console.log("⭐ Premium status:", isActive, "for user:", userId);
      setIsPremium(isActive);
    } catch (e) {
      console.error("❌ Premium status exception:", e);
      setIsPremium(false);
    }
  }, []);

  const refreshPremiumStatus = useCallback(async () => {
    console.log("🔄 refreshPremiumStatus() called");

    if (!user?.id) {
      console.log("⚠️ No user ID, skipping premium refresh");
      return;
    }

    await fetchPremiumStatus(user.id);
  }, [user?.id, fetchPremiumStatus]);

  useEffect(() => {
    console.log("⚡ AuthProvider: Setting up auth state listener");

    let mounted = true;

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;

        console.log("🟣 AUTH EVENT:", event, "| Session exists:", !!session);

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

    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (!mounted) return;

      if (error) {
        console.error("❌ Initial getSession error:", error);
      }

      console.log("🟡 Initial session check:", !!session);

      const currentUser = session?.user ?? null;
      setUser(currentUser);

      if (currentUser) {
        fetchPremiumStatus(currentUser.id);
      } else {
        setIsPremium(false);
      }

      setLoading(false);
    });

    return () => {
      console.log("🧹 AuthProvider: Cleaning up auth listener");
      mounted = false;
      authListener.subscription.unsubscribe();
    };
  }, [fetchPremiumStatus]);

  const signOut = useCallback(async () => {
    console.log("🚪 Logging out");
    try {
      await supabase.auth.signOut();
      setUser(null);
      setIsPremium(false);
    } catch (error) {
      console.error("❌ signOut error:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, loading, isPremium, refreshPremiumStatus, signOut }}
    >
      {children}
    </AuthContext.Provider>
  );
};
