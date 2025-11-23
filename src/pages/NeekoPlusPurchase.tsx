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
  Sparkles,
  Star,
  TrendingUp,
  BarChart3,
  Gauge,
  Quote,
} from "lucide-react";

import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { useToast } from "@/hooks/use-toast";

const NeekoPlusPurchase = () => {
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const price = "5.99"; // Update to weekly pricing per your request

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
    <div className="container max-w-5xl py-12 space-y-16">
      {/* HEADER */}
      <div className="text-center mb-4">
        <div className="flex items-center justify-center gap-2 mb-4">
          <Sparkles className="h-8 w-8 text-primary" />
          <h1 className="text-4xl font-bold">Neeko Plus</h1>
        </div>

        <p className="text-xl text-muted-foreground">
          Unlock premium sports analytics and AI insights
        </p>
      </div>

      {/* PREMIUM CARD */}
      <Card className="border-primary shadow-xl bg-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl">
            <Sparkles className="h-5 w-5 text-primary" />
            Neeko Plus
            <Badge>Premium</Badge>
          </CardTitle>
          <CardDescription className="text-lg">
            Advanced analytics and AI insights
          </CardDescription>

          <div className="pt-6">
            <span className="text-5xl font-bold">${price}</span>
            <span className="text-muted-foreground text-lg">/week</span>
          </div>
        </CardHeader>

        <CardContent>
          <div className="space-y-3">
            {features.map((feature, index) => (
              <div key={index} className="flex items-center gap-3">
                <Check className="h-5 w-5 text-primary" />
                <span className="text-lg">{feature}</span>
              </div>
            ))}
          </div>
        </CardContent>

        <CardFooter>
          <Button
            onClick={handleSubscribe}
            disabled={loading}
            className="w-full text-lg py-6"
          >
            {loading ? "Loading..." : user ? "Subscribe Now" : "Sign in to Subscribe"}
          </Button>
        </CardFooter>
      </Card>

      {/* FREE PLAN */}
      <Card className="bg-muted/20 border border-muted-foreground/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Free Plan
            <Badge variant="secondary">Current</Badge>
          </CardTitle>
          <CardDescription>Basic sports statistics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-muted-foreground" />
              <span>Basic team stats</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-muted-foreground" />
              <span>Player performance data</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-muted-foreground" />
              <span>Match center access</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* WHAT YOU GET SECTION */}
      <section>
        <h2 className="text-3xl font-bold text-center mb-8">What You Get With Neeko+</h2>

        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              icon: TrendingUp,
              title: "AI-Powered Predictions",
              text: "Smart match outcome probabilities to improve tips.",
            },
            {
              icon: BarChart3,
              title: "Deep Player Insights",
              text: "Seasonal trends, hidden patterns, and performance arcs.",
            },
            {
              icon: Gauge,
              title: "Team Comparison Engine",
              text: "Side-by-side intelligence to reveal strengths & weaknesses.",
            },
          ].map(({ icon: Icon, title, text }, idx) => (
            <Card key={idx} className="bg-card border-primary/20">
              <CardHeader>
                <Icon className="h-6 w-6 text-primary mb-2" />
                <CardTitle>{title}</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground">{text}</CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section>
        <h2 className="text-3xl font-bold text-center mb-8">What Members Are Saying</h2>

        <div className="grid md:grid-cols-3 gap-6">
          {[
            "Neeko+ gave me an edge tipping every week. The AI predictions feel scary accurate.",
            "The player trend breakdowns are unreal. It actually feels intelligent.",
            "The comparison tool alone is worth the subscription. Makes analysis effortless.",
          ].map((quote, idx) => (
            <Card key={idx} className="bg-card border-primary/20 p-6">
              <Quote className="h-6 w-6 text-primary mb-3" />
              <p className="italic mb-4">“{quote}”</p>
              <p className="text-sm text-muted-foreground">— Neeko+ Member</p>
            </Card>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section>
        <h2 className="text-3xl font-bold text-center mb-8">Frequently Asked Questions</h2>

        <Accordion type="single" collapsible className="space-y-4">
          <AccordionItem value="item-1">
            <AccordionTrigger>What do I get with Neeko+?</AccordionTrigger>
            <AccordionContent>
              You unlock premium analytics, AI-based predictions, comparison tools, and more.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-2">
            <AccordionTrigger>Can I cancel anytime?</AccordionTrigger>
            <AccordionContent>
              Yes, you can manage or cancel your subscription at any time from your account.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-3">
            <AccordionTrigger>Do you offer refunds?</AccordionTrigger>
            <AccordionContent>
              Refunds depend on usage and timing—contact support for help.
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </section>

      {/* FOOTER */}
      <div className="text-center text-sm text-muted-foreground pt-8">
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
