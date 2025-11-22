import { createContext, useContext, useEffect, useState } from "react";
import { User, Session } from "@supabase/supabase-js";
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

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPremium, setIsPremium] = useState(false);

  // Fetch premium subscription status
  const fetchPremiumStatus = async (userId: string) => {
    try {
      const { data: profile, error } = await supabase
        .from("profiles")
        .select("subscription_status")
        .eq("id", userId)
        .maybeSingle();

      if (error && error.code !== "PGRST116") {
        throw error;
      }

      const active = profile?.subscription_status === "active";
      setIsPremium(active);
    } catch (err) {
      console.error("Premium fetch error:", err);
      setIsPremium(false);
    }
  };

  // Load initial session
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      const session = data.session as Session | null;
      const user = session?.user ?? null;
      setUser(user);

      if (user) fetchPremiumStatus(user.id);

      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const user = session?.user ?? null;
      setUser(user);

      if (user) {
        await fetchPremiumStatus(user.id);
      } else {
        setIsPremium(false);
      }

      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Logout
  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setIsPremium(false);
  };

  return (
    <AuthContext.Provider value={{ user, loading, isPremium, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};
