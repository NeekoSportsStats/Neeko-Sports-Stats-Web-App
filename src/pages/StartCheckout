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
    const go = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      // 🔹 Not logged in → send to Auth
      if (!session) {
        navigate("/auth?redirect=checkout");
        return;
      }

      // 🔹 Logged in → run Stripe checkout
      try {
        const res = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-checkout-session`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${session.access_token}`,
            },
            body: JSON.stringify({
              priceId: import.meta.env.VITE_STRIPE_PRICE_ID,
            }),
          }
        );

        const data = await res.json();
        if (data.url) {
          window.location.href = data.url;
        } else {
          throw new Error("Checkout session failed");
        }
      } catch (err: any) {
        toast({
          title: "Checkout Error",
          description: err.message,
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
