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
      console.log("⭐ Premium status:", isActive, "for user:", userId);
      if (mountedRef.current) setIsPremium(isActive);
    } catch (e) {
      console.error("❌ Premium status exception:", e);
      if (mountedRef.current) setIsPremium(false);
    }
  };

  const refreshPremiumStatus = async () => {
    console.log("🔄 refreshPremiumStatus() called");

    const currentUser = user;
    if (!currentUser?.id) {
      console.log("⚠️ No user ID, skipping premium refresh");
      return;
    }

    await fetchPremiumStatus(currentUser.id);
  };

  const signOut = async () => {
    console.log("🚪 Logging out");
    try {
      await supabase.auth.signOut();
      if (mountedRef.current) {
        setUser(null);
        setIsPremium(false);
      }
    } catch (error) {
      console.error("❌ signOut error:", error);
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  };

  useEffect(() => {
    if (initializedRef.current) {
      console.log("⚠️ AuthProvider already initialized, skipping duplicate setup");
      return;
    }

    initializedRef.current = true;
    console.log("⚡ AuthProvider: Initializing auth state");

    let hasResolvedInitialState = false;

    const resolveInitialState = () => {
      if (hasResolvedInitialState) return;
      hasResolvedInitialState = true;

      console.log("✅ Initial auth state resolved, setting loading = false");
      if (mountedRef.current) setLoading(false);
    };

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mountedRef.current) return;

        console.log("🟣 AUTH EVENT:", event, "| Session exists:", !!session);

        const currentUser = session?.user ?? null;
        setUser(currentUser);

        if (currentUser) {
          await fetchPremiumStatus(currentUser.id);
        } else {
          setIsPremium(false);
        }

        resolveInitialState();
      }
    );

    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (!mountedRef.current) return;

      if (error) {
        console.error("❌ Initial getSession error:", error);
      }

      console.log("🟡 Initial getSession result:", !!session);

      const currentUser = session?.user ?? null;
      setUser(currentUser);

      if (currentUser) {
        fetchPremiumStatus(currentUser.id).then(() => {
          resolveInitialState();
        });
      } else {
        setIsPremium(false);
        resolveInitialState();
      }
    });

    return () => {
      console.log("🧹 AuthProvider: Cleaning up");
      mountedRef.current = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

  console.log("🔧 AuthProvider render state:", {
    user: user?.email,
    loading,
    isPremium
  });

  return (
    <AuthContext.Provider
      value={{ user, loading, isPremium, refreshPremiumStatus, signOut }}
    >
      {children}
    </AuthContext.Provider>
  );
};
