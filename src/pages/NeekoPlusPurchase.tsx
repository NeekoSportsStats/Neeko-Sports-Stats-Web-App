// src/pages/NeekoPlusPurchase.tsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/lib/auth";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Crown, Sparkles, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const NeekoPlusPurchase = () => {
  const [loading, setLoading] = useState(false);
  const [pricePulse, setPricePulse] = useState(false);

  const { user, isPremium } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const price = "5.99";

  const features = [
    "Advanced AI-powered analytics",
    "Predictive match outcomes",
    "Player performance trends",
    "Team comparison insights",
    "Priority support",
    "Early access to new features",
  ];

  // Trigger price pulse once on mount
  useEffect(() => {
    setPricePulse(true);
    setTimeout(() => setPricePulse(false), 1200);
  }, []);

  const handleSubscribe = async () => {
    setLoading(true);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        toast({
          title: "Please log in first",
          description: "You need to be logged in to subscribe",
          variant: "destructive",
        });

        setLoading(false);
        navigate("/auth?redirect=/neeko-plus");
        return;
      }

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
      if (data.url) window.location.href = data.url;
      else throw new Error("Failed to create checkout session");

    } catch (err: any) {
      toast({
        title: "Checkout failed",
        description: err.message,
        variant: "destructive",
      });
      setLoading(false);
    }
  };

  return (
    <div className="container max-w-3xl py-12">
      {/* HEADER */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center gap-2 mb-4">
          <Crown className="h-8 w-8 text-primary" />
          <h1 className="text-4xl font-bold">Neeko Plus</h1>
        </div>
        <p className="text-xl text-muted-foreground">
          Unlock premium sports analytics and AI insights
        </p>
      </div>

      {/* ONLY PREMIUM PLAN */}
      <Card
        className={`
          border-primary shadow-lg relative transition-all 
          hover:shadow-[0_0_25px_rgba(0,0,0,0.15)] hover:-translate-y-1
        `}
      >
        {isPremium && (
          <div className="absolute -inset-1 rounded-2xl border-2 border-primary/40 animate-pulse pointer-events-none" />
        )}

        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Neeko Plus
            <Badge>Premium</Badge>
          </CardTitle>

          <CardDescription>Advanced analytics and AI insights</CardDescription>

          <div className="pt-4">
            <span
              className={`
                text-4xl font-bold inline-block
                ${pricePulse ? "animate-pulse" : ""}
              `}
            >
              ${price}
            </span>
            <span className="text-muted-foreground">/week</span>
          </div>
        </CardHeader>

        <CardContent>
          <div className="space-y-2">
            {features.map((feature, index) => (
              <div
                key={index}
                className="flex items-center gap-2 opacity-0 animate-fadeIn forwards"
                style={{ animationDelay: `${index * 120}ms` }}
              >
                <Check className="h-4 w-4 text-primary" />
                <span>{feature}</span>
              </div>
            ))}
          </div>

          {/* Comparison table removed as requested?  
              No — only the free plan was removed.
              If you want this removed too tell me. 
          */}
          <div className="mt-6 border-t pt-4">
            <p className="font-semibold mb-2">Compare Plans</p>
            <table className="w-full text-sm">
              <tbody>
                <tr>
                  <td>Full AI Insights</td>
                  <td className="text-right">✔️</td>
                </tr>
                <tr>
                  <td>Unlimited stats</td>
                  <td className="text-right">✔️</td>
                </tr>
                <tr>
                  <td>All Free Limitations Removed</td>
                  <td className="text-right">✔️</td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>

        <CardFooter className="flex flex-col gap-3">
          <Button
            onClick={handleSubscribe}
            disabled={loading}
            size="lg"
            className={`
              w-full transition-all
              hover:-translate-y-1 hover:shadow-lg
            `}
          >
            {loading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
                Processing…
              </>
            ) : user ? (
              "Subscribe Now"
            ) : (
              "Sign In to Subscribe"
            )}
          </Button>

          {isPremium && (
            <Button
              onClick={() => navigate("/account")}
              variant="outline"
              className="w-full"
            >
              Go to Account
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
};

export default NeekoPlusPurchase;
