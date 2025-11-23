// src/pages/NeekoPlusPurchase.tsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/lib/auth";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { Badge } from "@/components/ui/badge";
import { Check, Crown, Loader2, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const NeekoPlusPurchase = () => {
  const [loading, setLoading] = useState(false);
  const { user, isPremium } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const price = "5.99";

  // Pulse price animation on page load
  const [pulse, setPulse] = useState(false);
  useEffect(() => {
    setTimeout(() => setPulse(true), 100);
  }, []);

  const features = [
    "Advanced AI-powered analytics",
    "Predictive match outcomes",
    "Player performance trends",
    "Team comparison insights",
    "Priority support",
    "Early access to new features",
  ];

  const handleSubscribe = async () => {
    setLoading(true);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        toast({
          title: "Please log in first",
          description: "You need to log in before subscribing.",
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

      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error("Failed to create session");
      }
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
      <div className="text-center mb-12">
        <div className="flex items-center justify-center gap-2 mb-4">
          <Crown className="h-10 w-10 text-primary" />
          <h1 className="text-4xl font-bold tracking-tight">Neeko Plus</h1>
        </div>
        <p className="text-lg text-muted-foreground">
          Unlock premium sports analytics and advanced AI insights
        </p>
      </div>

      {/* PREMIUM ONLY CARD */}
      <Card className="relative border-primary/80 hover:shadow-[0_0_25px_rgba(255,204,0,0.4)] transition-all duration-300">

        {/* Glow Ring */}
        {isPremium && (
          <div className="absolute -inset-1 rounded-2xl border-2 border-primary/50 animate-pulse pointer-events-none" />
        )}

        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-2xl">
            <Sparkles className="h-6 w-6 text-primary" />
            Neeko Plus
            <Badge className="bg-primary text-black">Premium</Badge>
          </CardTitle>

          <p className="text-muted-foreground mt-1">
            Advanced analytics and AI insights across AFL, EPL & NBA
          </p>

          {/* PRICE */}
          <div className="pt-6">
            <span
              className={`text-5xl font-extrabold transition-all ${
                pulse ? "animate-pulse" : "opacity-0"
              }`}
            >
              ${price}
            </span>
            <span className="text-muted-foreground text-lg ml-1">/week</span>
          </div>
        </CardHeader>

        <CardContent>

          {/* FEATURES */}
          <div className="space-y-3 mt-4">
            {features.map((item, idx) => (
              <div
                key={idx}
                className="flex items-center gap-2 opacity-0 animate-fade-in forwards"
                style={{ animationDelay: `${idx * 70}ms` }}
              >
                <Check className="h-5 w-5 text-primary" />
                <span>{item}</span>
              </div>
            ))}
          </div>

          {/* COMPARISON TABLE */}
          <div className="mt-10 border-t border-primary/20 pt-6">
            <p className="font-semibold text-lg mb-3">Compare Plans</p>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Full AI Insights</span> <span>✔️</span>
              </div>
              <div className="flex justify-between">
                <span>Unlimited Stats</span> <span>✔️</span>
              </div>
              <div className="flex justify-between">
                <span>All Free Limitations Removed</span> <span>✔️</span>
              </div>
            </div>
          </div>
        </CardContent>

        <CardFooter className="flex flex-col gap-4 mt-4">

          {/* SUBSCRIBE BUTTON */}
          <Button
            className="w-full py-6 text-lg font-bold transition-transform hover:-translate-y-1"
            disabled={loading}
            onClick={handleSubscribe}
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

          {/* Already Premium */}
          {isPremium && (
            <Button
              variant="outline"
              className="w-full py-6 text-lg hover:-translate-y-1 transition-transform"
              onClick={() => navigate("/account")}
            >
              Go to Account
            </Button>
          )}
        </CardFooter>
      </Card>

      {/* FOOTER */}
      <p className="text-center text-muted-foreground text-sm mt-10">
        Cancel anytime. No commitments.
      </p>
    </div>
  );
};

export default NeekoPlusPurchase;
