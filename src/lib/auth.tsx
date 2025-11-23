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
  const loadingResolvedRef = useRef(false);

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

  const applySession = async (session: any, source: string) => {
    if (!mountedRef.current) return;

    const currentUser = session?.user ?? null;

    if (currentUser === undefined) {
      console.error(`⚠️ CRITICAL: session.user is undefined from ${source}! Normalizing to null.`);
      setUser(null);
      setIsPremium(false);
      return;
    }

    console.log(`📥 applySession from ${source}:`, {
      hasUser: !!currentUser,
      userId: currentUser?.id
    });

    setUser(currentUser);

    if (currentUser) {
      await fetchPremiumStatus(currentUser.id);
    } else {
      setIsPremium(false);
    }
  };

  const resolveLoading = () => {
    if (loadingResolvedRef.current) {
      console.log("⚠️ Loading already resolved, skipping");
      return;
    }

    loadingResolvedRef.current = true;
    console.log("✅ Auth state resolved → loading = false");

    if (mountedRef.current) {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initializedRef.current) {
      console.log("⚠️ AuthProvider already initialized, skipping duplicate setup");
      return;
    }

    initializedRef.current = true;
    console.log("⚡ AuthProvider: Initializing auth state");

    let initialSessionChecked = false;

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mountedRef.current) return;

        console.log("🟣 AUTH EVENT:", event, "| Session exists:", !!session, "| User exists:", !!session?.user);

        if (event === "INITIAL_SESSION") {
          initialSessionChecked = true;
          await applySession(session, "INITIAL_SESSION");
          resolveLoading();
        } else if (event === "SIGNED_IN") {
          await applySession(session, "SIGNED_IN");
          resolveLoading();
        } else if (event === "SIGNED_OUT") {
          console.log("🚪 User signed out");
          setUser(null);
          setIsPremium(false);
          resolveLoading();
        } else if (event === "USER_UPDATED") {
          await applySession(session, "USER_UPDATED");
        } else if (event === "TOKEN_REFRESHED") {
          console.log("🔄 Token refreshed");
          await applySession(session, "TOKEN_REFRESHED");
        }
      }
    );

    const checkTimeout = setTimeout(() => {
      if (!initialSessionChecked && !loadingResolvedRef.current) {
        console.log("⏱️ INITIAL_SESSION event timeout - manually resolving");
        resolveLoading();
      }
    }, 5000);

    return () => {
      console.log("🧹 AuthProvider: Cleaning up");
      clearTimeout(checkTimeout);
      mountedRef.current = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

  console.log("🔧 AuthProvider render state:", {
    user: user?.email,
    loading,
    isPremium,
    loadingResolved: loadingResolvedRef.current
  });

  return (
    <AuthContext.Provider
      value={{ user, loading, isPremium, refreshPremiumStatus, signOut }}
    >
      {children}
    </AuthContext.Provider>
  );
};
