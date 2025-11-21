import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import Stripe from "npm:stripe@14.21.0";
import { createClient } from "npm:@supabase/supabase-js@2";

// Basic CORS config
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    // --- Env vars (match your other functions like stripe-webhook) ---
    const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const defaultPriceId = Deno.env.get("STRIPE_PRICE_ID");

    if (!stripeSecretKey || !supabaseUrl || !supabaseServiceKey || !defaultPriceId) {
      console.error("Missing environment variables");
      return new Response(
        JSON.stringify({ error: "Server misconfigured: missing Stripe/Supabase env vars" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: "2024-11-20.acacia",
    });

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // --- Auth: get the Supabase user from the Bearer token ---
    const authHeader = req.headers.get("Authorization") ?? "";
    const token = authHeader.replace("Bearer ", "").trim();

    if (!token) {
      return new Response(
        JSON.stringify({ error: "No access token provided" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      console.error("Auth error:", authError);
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // --- Body: allow overriding priceId but default to STRIPE_PRICE_ID ---
    const body = await req.json().catch(() => ({}));
    const priceId = body.priceId || defaultPriceId;

    // --- Get or create Stripe customer in stripe_customers table ---
    let customerId: string;

    const { data: existingCustomer, error: customerErr } = await supabase
      .from("stripe_customers")
      .select("customer_id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (customerErr) {
      console.error("Error querying stripe_customers:", customerErr);
    }

    if (existingCustomer?.customer_id) {
      customerId = existingCustomer.customer_id;
    } else {
      const customer = await stripe.customers.create({
        email: user.email ?? undefined,
        metadata: {
          supabase_user_id: user.id,
        },
      });

      customerId = customer.id;

      const { error: insertErr } = await supabase.from("stripe_customers").insert({
        user_id: user.id,
        customer_id: customer.id,
      });

      if (insertErr) {
        console.error("Error inserting stripe_customers:", insertErr);
      }
    }

    // --- Build success/cancel URLs based on origin ---
    const origin = req.headers.get("origin") ?? "https://neekostats.com.au";

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${origin}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/neeko-plus`,
      metadata: {
        email: user.email ?? "",
        supabase_user_id: user.id,
      },
    });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: any) {
    console.error("ERROR in create-checkout-session:", error);
    return new Response(
      JSON.stringify({ error: error.message ?? "Unknown error" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
    );
  }
});
