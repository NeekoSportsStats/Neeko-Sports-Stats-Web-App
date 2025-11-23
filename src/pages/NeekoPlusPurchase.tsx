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

import { Check, Crown, Sparkles } from "lucide-react"; // ⭐ Restore original icons
import { useToast } from "@/hooks/use-toast";

const NeekoPlusPurchase = () => {
  const [loading, setLoading] = useState(false);
  const { user, isPremium } = useAuth(); // ⭐ Use real subscription state
  const navigate = useNavigate();
  const { toast } = useToast();

  const price = "5.99"; // ⭐ Restore correct price

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

      // ⭐ Correct Supabase Edge Function URL
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
      console.error("Checkout error:", err);
      toast({
        title: "Checkout failed",
        description: err.message || "Unable to start checkout process",
        variant: "destructive",
      });
      setLoading(false);
    }
  };

  return (
    <div className="container max-w-4xl py-12">
      <div className="text-center mb-8">
        {/* ⭐ Restore original icon + colours */}
        <div className="flex items-center justify-center gap-2 mb-4">
          <Crown className="h-8 w-8 text-primary" />
          <h1 className="text-4xl font-bold">Neeko Plus</h1>
        </div>

        <p className="text-xl text-muted-foreground">
          Unlock premium sports analytics and AI insights
        </p>
      </div>

      {/* ⭐ Restore original spacing + layout */}
      <div className="grid gap-8 md:grid-cols-2 items-start">
        {/* Free Plan */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Free Plan
              {/* ⭐ Dynamic badge */}
              <Badge variant={isPremium ? "outline" : "secondary"}>
                {isPremium ? "Not Current" : "Current"}
              </Badge>
            </CardTitle>
            <CardDescription>Basic sports statistics</CardDescription>
          </CardHeader>

          <CardContent>
            <div className="space-y-2">
              {["Basic team stats", "Player performance data", "Match center access"].map(
                (item, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-muted-foreground" />
                    <span>{item}</span>
                  </div>
                )
              )}
            </div>
          </CardContent>
        </Card>

        {/* Neeko Plus */}
        <Card className="border-primary shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Neeko Plus
              <Badge>Premium</Badge>
            </CardTitle>

            <CardDescription>Advanced analytics and AI insights</CardDescription>

            <div className="pt-4">
              <span className="text-4xl font-bold">${price}</span>
              <span className="text-muted-foreground">/week</span>
            </div>
          </CardHeader>

          <CardContent>
            <div className="space-y-2">
              {features.map((feature, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-primary" />
                  <span>{feature}</span>
                </div>
              ))}
            </div>
          </CardContent>

          <CardFooter>
            <Button
              onClick={handleSubscribe}
              disabled={loading}
              className="w-full"
              size="lg"
            >
              {loading ? "Loading..." : user ? "Subscribe Now" : "Sign In to Subscribe"}
            </Button>
          </CardFooter>
        </Card>
      </div>

      <div className="mt-12 text-center text-sm text-muted-foreground">
        <p>Cancel anytime. No commitments.</p>
        <p className="mt-2">
          By subscribing, you agree to our{" "}
          <a href="/policies/terms" className="text-primary hover:underline">
            Terms of Service
          </a>{" "}
          and{" "}
          <a href="/policies/privacy" className="text-primary hover:underline">
            Privacy Policy
          </a>
          .
        </p>
      </div>
    </div>
  );
};

export default NeekoPlusPurchase;
