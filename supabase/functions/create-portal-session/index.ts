import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ALLOWED_ORIGINS = [
  "http://localhost:8080",
  "https://lovable.dev",
  "https://gmrxkdgsmwnzwphymmtf.lovableproject.com",
  "https://94e9fd21-67be-471d-8760-6cfcd452056e.lovableproject.com"
];

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate origin
    const origin = req.headers.get("origin");
    if (!origin || !ALLOWED_ORIGINS.some(allowed => origin.includes(allowed.replace("https://", "").replace("http://", "")))) {
      console.warn("Request from invalid origin:", origin);
      return new Response(
        JSON.stringify({ error: "Invalid request origin" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 403 }
      );
    }
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") as string, {
      apiVersion: "2023-10-16",
    });

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      throw new Error("Unauthorized");
    }

    // Get or create Stripe customer
    let customerId: string;
    
    const { data: stripeCustomer } = await supabase
      .from("stripe_customers")
      .select("customer_id")
      .eq("user_id", user.id)
      .single();

    if (stripeCustomer?.customer_id) {
      customerId = stripeCustomer.customer_id;
    } else {
      // Create new Stripe customer if one doesn't exist
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          supabase_user_id: user.id,
        },
      });

      // Store the customer ID in the database
      await supabase
        .from("stripe_customers")
        .insert({
          user_id: user.id,
          customer_id: customer.id,
        });

      customerId = customer.id;
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${req.headers.get("origin")}/account`,
    });

    return new Response(
      JSON.stringify({ url: session.url }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Portal session error:", error);
    
    // Map errors to safe messages
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    const safeMessages: Record<string, string> = {
      "No authorization header": "Authentication required",
      "Unauthorized": "Invalid credentials",
      "No customer ID found": "Account setup incomplete"
    };

    const safeError = safeMessages[errorMessage] || "An error occurred processing your request";

    return new Response(
      JSON.stringify({ error: safeError }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: errorMessage.includes("authorization") || errorMessage.includes("Unauthorized") ? 401 : 400,
      }
    );
  }
});
