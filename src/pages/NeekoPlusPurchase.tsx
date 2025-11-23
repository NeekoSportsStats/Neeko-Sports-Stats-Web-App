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
      name: "— Daniel Matthews, Fantasy Coach",
    },
    {
      quote: "Exactly the kind of dashboard I wish existed years ago. Perfect for multi-sport fans.",
      name: "— Alicia Porter, AFL & NBA Fan",
    },
    {
      quote: "I use Neeko+ every week to sanity-check my bets. The stats view is insanely helpful.",
      name: "— Marcus Liu, Data Analyst",
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
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error("Failed to create checkout session");
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
    <div className="container max-w-4xl py-12">

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
      <div className="text-center mb-12">
        <div className="flex items-center justify-center gap-2 mb-4">
          <Crown className="h-10 w-10 text-primary animate-bounce" />
          <h1 className="text-5xl font-extrabold">Neeko Plus</h1>
        </div>
        <p className="text-xl text-muted-foreground">
          Unlock premium sports analytics and AI insights
        </p>
      </div>

      {/* WRAPPER CARD */}
      <div className="relative rounded-3xl p-8 md:p-12 border border-primary/30 bg-gradient-to-br from-black/40 to-yellow-900/10 shadow-xl">

        {/* FIXED FLOATING CROWN (cleaner + centered + softer glow) */}
        <div className="absolute -top-8 right-1/2 translate-x-1/2">
          <Crown className="h-12 w-12 text-yellow-300 drop-shadow-xl animate-pulse" />
        </div>

        {/* PLAN CARD */}
        <Card className="border-primary shadow-lg rounded-2xl bg-black/40 backdrop-blur-sm p-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Neeko Plus
              <Badge>Premium</Badge>
            </CardTitle>
            <CardDescription>
              Advanced analytics and AI insights for serious fans and fantasy players.
            </CardDescription>

            {/* Subtle gradient under price + smoother pulse */}
            <div className="pt-4 flex items-end gap-2 relative">
              <span
                className="text-5xl font-extrabold text-white animate-[pulse_2.6s_ease-in-out_infinite]"
              >
                ${price}
              </span>

              <div className="absolute left-0 right-0 -bottom-1 h-4 bg-gradient-to-b from-yellow-400/40 to-transparent blur-md pointer-events-none" />

              <span className="text-muted-foreground mb-1">/week – cancel anytime</span>
            </div>
          </CardHeader>

          <CardContent>
            <div className="space-y-3 mt-4">
              {features.map((feature, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 opacity-0 animate-fade-in forwards"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <Check className="h-5 w-5 text-primary" />
                  <span>{feature}</span>
                </div>
              ))}
            </div>

            {/* RENAMED SECTION */}
            <div className="mt-8 border-t pt-4">
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

          <CardFooter className="flex flex-col gap-3 pt-4">
            <Button
              onClick={handleSubscribe}
              disabled={loading}
              className="w-full text-lg font-bold hover:-translate-y-0.5 transition-all"
              size="lg"
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

      {/* BENEFITS */}
      <div className="mt-16 grid md:grid-cols-3 gap-6">
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

      {/* TESTIMONIALS — improved layout */}
      <div className="mt-16">
        <h2 className="text-2xl font-bold mb-6">What early users are saying</h2>

        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map((t, idx) => (
            <Card
              key={idx}
              className="p-6 bg-black/40 border-primary/20 flex flex-col justify-between min-h-[180px]"
            >
              <p className="mb-4 text-white/90 italic leading-relaxed">“{t.quote}”</p>
              <p className="text-muted-foreground mt-auto">{t.name}</p>
            </Card>
          ))}
        </div>
      </div>

      <p className="mt-12 text-center text-sm text-muted-foreground">
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
