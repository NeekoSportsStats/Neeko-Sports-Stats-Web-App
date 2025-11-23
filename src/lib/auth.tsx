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
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPremium, setIsPremium] = useState(false);

  // Load premium status
  const fetchPremiumStatus = async (userId: string) => {
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
  };

  const refreshUser = async () => {
    const { data } = await supabase.auth.getSession();
    const currentUser = data.session?.user ?? null;

    setUser(currentUser);
    if (currentUser) await fetchPremiumStatus(currentUser.id);
  };

  useEffect(() => {
    let first = true;

    const { data: listener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        const currentUser = session?.user ?? null;
        setUser(currentUser);

        if (currentUser) {
          await fetchPremiumStatus(currentUser.id);
        } else {
          setIsPremium(false);
        }

        if (first) {
          first = false;
          setLoading(false);
        }
      }
    );

    // Fallback: if PKCE finishes before listener fires
    supabase.auth.getSession().then(async ({ data }) => {
      if (!first) return;

      const currentUser = data.session?.user ?? null;
      setUser(currentUser);

      if (currentUser) {
        await fetchPremiumStatus(currentUser.id);
      }

      first = false;
      setLoading(false);
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setIsPremium(false);
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, isPremium, refreshUser, signOut }}
    >
      {children}
    </AuthContext.Provider>
  );
};
