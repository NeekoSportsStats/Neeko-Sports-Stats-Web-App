// src/pages/StartCheckout.tsx
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const StartCheckout = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    let attempts = 0;

    const go = async () => {
      attempts++;

      // 🔥 Fix PKCE issue — wait for client to hydrate session
      const {
        data: { session },
      } = await supabase.auth.getSession();

      console.log("StartCheckout session attempt", attempts, session);

      if (!session) {
        // ⏳ Retry while Supabase initializes (max ~2 seconds)
        if (attempts < 12) {
          return setTimeout(go, 200);
        }

        // ❌ Still no session → treat user as logged out
        toast({
          title: "Please log in",
          description: "You must be signed in to continue to checkout.",
          variant: "destructive",
        });

        navigate("/auth?redirect=checkout");
        return;
      }

      // 🎉 Session ready → Call edge function
      try {
        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-checkout-session`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${session.access_token}`, // ⬅️ critical fix
            },
            body: JSON.stringify({
              priceId: import.meta.env.VITE_STRIPE_PRICE_ID,
            }),
          }
        );

        if (!response.ok) {
          const errorBody = await response.json().catch(() => null);
          console.error("Checkout failed", response.status, errorBody);

          throw new Error(
            errorBody?.error ||
              `Checkout request failed (${response.status})`
          );
        }

        const data = await response.json();

        if (!data.url) throw new Error("No checkout URL returned");

        // 🚀 Send user to Stripe Checkout
        window.location.href = data.url;
      } catch (err: any) {
        console.error("StartCheckout error:", err);

        toast({
          title: "Checkout Error",
          description: err?.message || "Something went wrong.",
          variant: "destructive",
        });

        navigate("/neeko-plus");
      }
    };

    go();
  }, [navigate, toast]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="h-10 w-10 text-primary animate-spin" />
    </div>
  );
};

export default StartCheckout;
