import { createContext, useContext, useEffect, useState } from "react";
import { User } from "@supabase/supabase-js";
import { supabase } from "./supabaseClient";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isPremium: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  isPremium: false,
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPremium, setIsPremium] = useState(false);

  // Load subscription state from profile
  const fetchPremiumStatus = async (userId: string) => {
    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("subscription_status")
        .eq("id", userId)
        .maybeSingle();

      const active = profile?.subscription_status === "active";
      setIsPremium(active);
    } catch (err) {
      console.error("Premium fetch error:", err);
      setIsPremium(false);
    }
  };

  // INITIAL SESSION LOAD
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      const session = data.session;
      const currentUser = session?.user ?? null;

      setUser(currentUser);
      if (currentUser) fetchPremiumStatus(currentUser.id);

      setLoading(false);
    });

    // AUTH STATE LISTENER — CORRECT SHAPE
    const { data: listener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
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

    return () => listener.subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    // UI automatically re-renders via auth listener
  };

  return (
    <AuthContext.Provider value={{ user, loading, isPremium, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};
