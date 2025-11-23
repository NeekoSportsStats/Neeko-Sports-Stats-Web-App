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
import {
  Check,
  Crown,
  Sparkles,
  Loader2,
  Brain,
  BarChart3,
  Target,
} from "lucide-react";
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

      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error("Failed to create checkout session");
      }
    } catch (err: any) {
      toast({
        title: "Checkout failed",
        description: err.message || "Unable to start checkout process",
        variant: "destructive",
      });
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Local animations/styles */}
      <style>{`
        @keyframes neeko-floating {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-6px); }
          100% { transform: translateY(0px); }
        }
        @keyframes neeko-price-pop {
          0% { transform: scale(0.9); opacity: 0; }
          40% { transform: scale(1.04); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes neeko-feature-fade {
          0% { opacity: 0; transform: translateY(6px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        .neeko-price-pop {
          animation: neeko-price-pop 0.6s ease-out 0.1s both;
        }
        .neeko-feature {
          animation: neeko-feature-fade 0.5s ease-out both;
        }
      `}</style>

      <div className="container max-w-5xl mx-auto px-4 py-12 md:py-16">
        {/* HERO + SPLIT GRADIENT BACKGROUND */}
        <section className="relative overflow-hidden rounded-3xl border border-primary/40 bg-gradient-to-r from-black via-background to-black px-6 py-10 md:px-10 md:py-14 mb-12">
          {/* Split gradient overlay */}
          <div className="pointer-events-none absolute inset-0 opacity-60 mix-blend-screen bg-[radial-gradient(circle_at_top_left,rgba(250,204,21,0.25),transparent_55%),radial-gradient(circle_at_bottom_right,rgba(250,204,21,0.2),transparent_55%)]" />

          {/* Floating crown */}
          <div className="absolute -top-6 right-10 hidden md:block">
            <div
              className="flex h-14 w-14 items-center justify-center rounded-full border border-primary/60 bg-black/60 shadow-[0_0_30px_rgba(250,204,21,0.7)]"
              style={{ animation: "neeko-floating 3s ease-in-out infinite" }}
            >
              <Crown className="h-7 w-7 text-primary" />
            </div>
          </div>

          <div className="relative z-10 max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary mb-4">
              <Sparkles className="h-3 w-3" />
              <span>Premium Membership</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold mb-3">
              Neeko Plus
            </h1>
            <p className="text-base md:text-lg text-muted-foreground max-w-xl">
              Unlock full AI insights, unlimited stats and advanced analytics
              across AFL, EPL and NBA.
            </p>
          </div>

          {/* MAIN PLAN CARD */}
          <div className="relative mt-10 flex justify-center">
            <Card className="w-full max-w-xl border-primary/70 bg-black/70 backdrop-blur-sm transition-all duration-300 hover:shadow-[0_0_35px_rgba(250,204,21,0.4)] hover:-translate-y-1">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-primary" />
                    <CardTitle className="text-2xl">Neeko Plus</CardTitle>
                    <Badge className="text-xs">Premium</Badge>
                  </div>
                  {isPremium && (
                    <Badge variant="outline" className="text-xs border-primary/60">
                      Active
                    </Badge>
                  )}
                </div>
                <CardDescription className="mt-2">
                  Advanced analytics and AI insights for serious fans and
                  fantasy players.
                </CardDescription>

                {/* PRICE */}
                <div className="pt-4 flex items-baseline gap-2">
                  <span className="neeko-price-pop text-4xl md:text-5xl font-extrabold text-primary">
                    ${price}
                  </span>
                  <span className="text-muted-foreground text-sm md:text-base">
                    /week – cancel anytime
                  </span>
                </div>
              </CardHeader>

              <CardContent className="space-y-5">
                {/* Key bullets with checkmarks */}
                <div className="space-y-2">
                  {features.map((feature, index) => (
                    <div
                      key={feature}
                      className="neeko-feature flex items-center gap-2 text-sm md:text-base"
                      style={{ animationDelay: `${index * 90}ms` }}
                    >
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/15">
                        <Check className="h-3.5 w-3.5 text-primary" />
                      </div>
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>

                {/* Compare row */}
                <div className="mt-4 border-t border-border pt-4 text-sm">
                  <p className="font-semibold mb-2">Compare Plans</p>
                  <div className="grid grid-cols-2 gap-y-1">
                    <span>Full AI Insights</span>
                    <span className="text-right">Included</span>
                    <span>Unlimited stats</span>
                    <span className="text-right">Included</span>
                    <span>All free limitations removed</span>
                    <span className="text-right">Included</span>
                  </div>
                </div>
              </CardContent>

              <CardFooter className="flex flex-col gap-3 pt-0">
                <Button
                  onClick={handleSubscribe}
                  disabled={loading || isPremium}
                  size="lg"
                  className="w-full font-semibold transform transition-transform duration-200 hover:-translate-y-0.5"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin mr-2" />
                      Processing…
                    </>
                  ) : isPremium ? (
                    "Already Subscribed"
                  ) : user ? (
                    "Subscribe Now"
                  ) : (
                    "Sign In to Subscribe"
                  )}
                </Button>

                {isPremium && (
                  <Button
                    variant="outline"
                    className="w-full text-sm"
                    onClick={() => navigate("/account")}
                  >
                    Go to Account
                  </Button>
                )}
              </CardFooter>
            </Card>
          </div>
        </section>

        {/* BENEFITS WITH ICONS */}
        <section className="mb-12">
          <div className="grid gap-6 md:grid-cols-3">
            <Card className="bg-background/60 border-border">
              <CardContent className="pt-6 space-y-3">
                <div className="h-10 w-10 rounded-xl bg-primary/15 flex items-center justify-center mb-1">
                  <Brain className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-semibold text-lg">AI-Powered Edge</h3>
                <p className="text-sm text-muted-foreground">
                  Spot hot & cold players, matchup risks and hidden trends
                  before everyone else.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-background/60 border-border">
              <CardContent className="pt-6 space-y-3">
                <div className="h-10 w-10 rounded-xl bg-primary/15 flex items-center justify-center mb-1">
                  <BarChart3 className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-semibold text-lg">Deeper Stats</h3>
                <p className="text-sm text-muted-foreground">
                  Unlimited access to player & team metrics across AFL, EPL and
                  NBA – no blur, no gating.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-background/60 border-border">
              <CardContent className="pt-6 space-y-3">
                <div className="h-10 w-10 rounded-xl bg-primary/15 flex items-center justify-center mb-1">
                  <Target className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-semibold text-lg">Game Day Ready</h3>
                <p className="text-sm text-muted-foreground">
                  Build better multis, fantasy lineups and tipping decisions
                  with data-backed insights.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* TESTIMONIALS */}
        <section className="mb-10">
          <h2 className="text-xl md:text-2xl font-bold mb-4">
            What early users are saying
          </h2>
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="bg-background/60 border-border">
              <CardContent className="pt-5 text-sm">
                <p className="mb-3">
                  “The AI trends make it so much easier to spot form swings. It
                  feels like cheating.”
                </p>
                <p className="text-xs text-muted-foreground">— Fantasy Coach</p>
              </CardContent>
            </Card>
            <Card className="bg-background/60 border-border">
              <CardContent className="pt-5 text-sm">
                <p className="mb-3">
                  “Exactly the kind of dashboard I wish existed years ago.
                  Perfect for multi-sport fans.”
                </p>
                <p className="text-xs text-muted-foreground">— AFL & NBA Fan</p>
              </CardContent>
            </Card>
            <Card className="bg-background/60 border-border">
              <CardContent className="pt-5 text-sm">
                <p className="mb-3">
                  “I use Neeko+ every week to sanity-check my bets. The stats
                  view is insanely helpful.”
                </p>
                <p className="text-xs text-muted-foreground">
                  — Data-obsessed Punter
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* FOOTER COPY */}
        <div className="mt-6 text-center text-xs md:text-sm text-muted-foreground">
          <p>Cancel anytime. No lock-in contracts.</p>
          <p className="mt-2">
            By subscribing, you agree to our{" "}
            <a href="/policies/terms" className="text-primary hover:underline">
              Terms of Service
            </a>{" "}
            and{" "}
            <a
              href="/policies/privacy"
              className="text-primary hover:underline"
            >
              Privacy Policy
            </a>
            .
          </p>
        </div>
      </div>
    </div>
  );
};

export default NeekoPlusPurchase;
