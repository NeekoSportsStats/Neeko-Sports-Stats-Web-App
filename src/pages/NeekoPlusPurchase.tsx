// src/pages/NeekoPlusPurchase.tsx
import { useState } from "react";
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
import { Check, Crown, Sparkles, Loader2, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const NeekoPlusPurchase = () => {
  const [loading, setLoading] = useState(false);
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

  const testimonials = [
    {
      quote: "The AI trends make it so much easier to spot form swings. It feels like cheating.",
      name: "— Daniel Matthews",
    },
    {
      quote: "Exactly the kind of dashboard I wish existed years ago. Perfect for multi-sport fans.",
      name: "— Alicia Porter",
    },
    {
      quote: "I use Neeko+ every week to sanity-check my bets. The stats view is insanely helpful.",
      name: "— Marcus Liu",
    },
  ];

  const handleSubscribe = async () => {
    setLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();

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
    <div className="container max-w-4xl py-10 px-4 md:px-0">

      {/* BACK BUTTON */}
      <Button
        variant="ghost"
        className="mb-6 flex items-center gap-2 text-muted-foreground hover:text-primary"
        onClick={() => navigate(-1)}
      >
        <ArrowLeft className="h-5 w-5" />
        Back
      </Button>

      {/* HEADER */}
      <div className="text-center mb-10 md:mb-12">
        <div className="flex items-center justify-center gap-2 mb-4">
          <Crown className="h-10 w-10 text-primary" />
          <h1 className="text-4xl md:text-5xl font-extrabold">Neeko+</h1>
        </div>
        <p className="text-lg md:text-xl text-muted-foreground">
          Unlock premium sports analytics and AI insights
        </p>
      </div>

      {/* MAIN CARD (outer glow removed) */}
      <div className="relative">

        {/* PLAN CARD */}
        <Card className="border-primary/40 hover:border-primary transition-all shadow-xl rounded-2xl bg-black/40 backdrop-blur-sm p-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Neeko+
              <Badge>Premium</Badge>
            </CardTitle>

            <CardDescription>
              Advanced analytics and AI insights for serious fans and fantasy players.
            </CardDescription>

            {/* Smooth pulsing price + yellow soft glow line */}
            <div className="pt-4 flex items-end gap-2 relative">
              <span className="text-4xl md:text-5xl font-extrabold text-white animate-[pulse_3s_ease-in-out_infinite]">
                ${price}
              </span>
              <span className="text-muted-foreground mb-1">/week – cancel anytime</span>

              {/* subtle sunlight-like gradient under price */}
              <div className="absolute left-0 right-0 -bottom-2 h-3 bg-gradient-to-r from-transparent via-yellow-500/25 to-transparent rounded-full blur-lg" />
            </div>
          </CardHeader>

          <CardContent>
            <div className="space-y-3 mt-6">
              {features.map((feature, index) => (
                <div key={index} className="flex items-center gap-3">
                  <Check className="h-5 w-5 text-primary" />
                  <span>{feature}</span>
                </div>
              ))}
            </div>

            {/* WHAT YOU GET */}
            <div className="mt-8 border-t border-white/10 pt-4">
              <p className="font-semibold mb-3">What You Get</p>
              <table className="w-full text-sm">
                <tbody>
                  <tr>
                    <td>Full AI Insights</td>
                    <td className="text-right">Included</td>
                  </tr>
                  <tr>
                    <td>Unlimited stats</td>
                    <td className="text-right">Included</td>
                  </tr>
                  <tr>
                    <td>All free limitations removed</td>
                    <td className="text-right">Included</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>

          {/* BUTTONS */}
          <CardFooter className="flex flex-col gap-3 pt-4">
            <Button
              onClick={handleSubscribe}
              disabled={loading}
              className="w-full text-lg font-bold transition-all hover:-translate-y-0.5"
              size="lg"
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin mr-2" />
                  Processing…
                </>
              ) : (
                "Get Neeko+ Now"
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

      {/* BENEFITS */}
      <div className="mt-16 md:mt-20 grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6 bg-black/40 border-primary/20">
          <h3 className="font-bold text-lg mb-2">AI-Powered Edge</h3>
          <p className="text-muted-foreground">Spot hot & cold players before everyone else.</p>
        </Card>

        <Card className="p-6 bg-black/40 border-primary/20">
          <h3 className="font-bold text-lg mb-2">Deeper Stats</h3>
          <p className="text-muted-foreground">Unlimited access to all player & team data.</p>
        </Card>

        <Card className="p-6 bg-black/40 border-primary/20">
          <h3 className="font-bold text-lg mb-2">Game Day Ready</h3>
          <p className="text-muted-foreground">Build better multis and bets with confidence.</p>
        </Card>
      </div>

      {/* TESTIMONIALS */}
      <div className="mt-16 md:mt-20">
        <h2 className="text-2xl font-bold mb-6">What early users are saying</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((t, idx) => (
            <Card key={idx} className="p-6 bg-black/40 border-primary/20">
              <p className="mb-4 text-white/90 italic leading-relaxed">“{t.quote}”</p>
              <p className="text-muted-foreground">{t.name}</p>
            </Card>
          ))}
        </div>
      </div>

      <p className="mt-12 text-center text-sm text-muted-foreground pb-10">
        Cancel anytime. No lock-in contracts.
        <br />
        By subscribing, you agree to our{" "}
        <a href="/policies/terms" className="text-primary hover:underline">
          Terms of Service
        </a>{" "}
        and{" "}
        <a href="/policies/privacy" className="text-primary hover:underline">
          Privacy Policy
        </a>.
      </p>
    </div>
  );
};

export default NeekoPlusPurchase;
