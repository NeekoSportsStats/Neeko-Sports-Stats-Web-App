// api/create-checkout-session.js
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  console.log("=== REQUEST BODY ===");
  console.log(req.body);

  const { priceId, userId } = req.body;

  if (!priceId || !userId) {
    console.log("=== ERROR: Missing priceId or userId ===");
    return res.status(400).json({ error: "Missing priceId or userId" });
  }

  if (!process.env.STRIPE_SECRET_KEY || !process.env.SUPABASE_SERVICE_ROLE_KEY || !process.env.NEXT_PUBLIC_SUPABASE_URL) {
    console.error("Missing required environment variables");
    return res.status(500).json({ error: "Server misconfiguration" });
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const { data: profile, error: profileErr } = await supabase
    .from("profiles")
    .select("email")
    .eq("id", userId)
    .single();

  console.log("=== PROFILE LOOKUP ===", profile, profileErr);

  if (profileErr || !profile?.email) {
    return res.status(400).json({ error: "User email not found in profile" });
  }

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer_email: profile.email,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/account`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/account`,
    });

    console.log("=== STRIPE SESSION CREATED ===", session.url);

    return res.status(200).json({ url: session.url });
  } catch (err) {
    console.error("Stripe create session error:", err);
    return res.status(500).json({ error: "Stripe create session error" });
  }
}
