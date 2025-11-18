import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") as string, {
  apiVersion: "2023-10-16",
});

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

// Helper function to update user premium role (single source of truth)
async function updatePremiumStatus(
  supabase: any,
  userId: string,
  isPremium: boolean
) {
  console.log(`Updating premium status for user ${userId} to ${isPremium}`);

  if (isPremium) {
    // Add premium role
    const { error: roleError } = await supabase
      .from('user_roles')
      .upsert({
        user_id: userId,
        role: 'premium'
      }, { 
        onConflict: 'user_id,role',
        ignoreDuplicates: false 
      });

    if (roleError) {
      console.error("Error adding premium role:", roleError);
      throw roleError;
    }
    console.log(`✅ User ${userId} granted premium access`);
  } else {
    // Remove premium role
    const { error: roleError } = await supabase
      .from('user_roles')
      .delete()
      .eq('user_id', userId)
      .eq('role', 'premium');

    if (roleError) {
      console.error("Error removing premium role:", roleError);
      throw roleError;
    }
    console.log(`❌ User ${userId} premium access revoked`);
  }
}

serve(async (req) => {
  // Validate webhook secret is configured
  const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
  if (!webhookSecret) {
    console.error("STRIPE_WEBHOOK_SECRET not configured");
    return new Response("Service misconfigured", { status: 500 });
  }

  // Validate signature is present
  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    console.warn("Webhook received without signature");
    return new Response("Missing signature", { status: 401 });
  }

  try {
    const body = await req.text();
    const event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // SECURITY: Check for replay attacks by verifying event hasn't been processed
    const { data: existingEvent } = await supabase
      .from("stripe_events")
      .select("id")
      .eq("event_id", event.id)
      .single();

    if (existingEvent) {
      console.log(`Event ${event.id} already processed - ignoring replay`);
      return new Response(JSON.stringify({ received: true }), {
        headers: { "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Validate event timestamp (reject events older than 5 minutes)
    const eventAge = Date.now() / 1000 - event.created;
    if (eventAge > 300) {
      console.warn(`Event ${event.id} is ${eventAge}s old - potential replay attack`);
      return new Response("Event too old", { status: 400 });
    }

    // Log all events
    await supabase.from("stripe_events").insert({
      event_id: event.id,
      type: event.type,
      data: event.data.object as any,
    });

    console.log(`Processing webhook event: ${event.type}`);

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const customerEmail = session.customer_details?.email;
        
        if (customerEmail && session.subscription) {
          console.log(`Checkout completed for email ending in ${customerEmail.slice(-10)}`);

          // Check if user exists
          const { data: existingUsers } = await supabase.auth.admin.listUsers();
          let user = existingUsers?.users?.find(u => u.email === customerEmail);
          
          if (!user) {
            // Create new user with random password (they'll set it later)
            const randomPassword = crypto.randomUUID();
            const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
              email: customerEmail,
              password: randomPassword,
              email_confirm: true,
            });
            
            if (createError) {
              console.error("Error creating user:", createError);
            } else {
              user = newUser.user;
              console.log(`Created new user: ${user.id}`);
              
              // Store checkout session for password creation with 24 hour expiry
              await supabase.from("checkout_sessions").insert({
                session_id: session.id,
                email: customerEmail,
                user_id: user.id,
                expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
              });
            }
          }
          
          if (user) {
            // Create stripe customer record
            await supabase.from("stripe_customers").upsert({
              user_id: user.id,
              customer_id: session.customer as string,
            }, {
              onConflict: "user_id"
            });

            // Get subscription details
            const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
            
            // Create subscription record
            await supabase.from("subscriptions").upsert({
              id: subscription.id,
              user_id: user.id,
              status: subscription.status,
              price_id: subscription.items.data[0]?.price.id || "",
              current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
            }, {
              onConflict: "id"
            });

            // CRITICAL: Grant premium access
            await updatePremiumStatus(supabase, user.id, true);
          }
        }
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        
        // Find user by subscription ID
        const { data: existingSub } = await supabase
          .from("subscriptions")
          .select("user_id")
          .eq("id", subscription.id)
          .single();

        if (existingSub) {
          // Update subscription record
          await supabase
            .from("subscriptions")
            .update({
              status: subscription.status,
              current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq("id", subscription.id);

          // Update premium status based on subscription status
          const isPremium = ['active', 'trialing'].includes(subscription.status);
          await updatePremiumStatus(supabase, existingSub.user_id, isPremium);
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        
        // Find user by subscription ID
        const { data: existingSub } = await supabase
          .from("subscriptions")
          .select("user_id")
          .eq("id", subscription.id)
          .single();

        if (existingSub) {
          // Update subscription record
          await supabase
            .from("subscriptions")
            .update({
              status: "canceled",
              updated_at: new Date().toISOString(),
            })
            .eq("id", subscription.id);

          // CRITICAL: Revoke premium access
          await updatePremiumStatus(supabase, existingSub.user_id, false);
        }
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        
        if (invoice.subscription) {
          // Find user by subscription ID
          const { data: existingSub } = await supabase
            .from("subscriptions")
            .select("user_id")
            .eq("id", invoice.subscription as string)
            .single();

          if (existingSub) {
            // Update subscription record
            await supabase
              .from("subscriptions")
              .update({
                status: "past_due",
                updated_at: new Date().toISOString(),
              })
              .eq("id", invoice.subscription as string);

            // CRITICAL: Revoke premium access on payment failure
            await updatePremiumStatus(supabase, existingSub.user_id, false);
          }
        }
        break;
      }
    }

    console.log(`✅ Webhook processed successfully: ${event.type}`);
    return new Response(JSON.stringify({ received: true }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });
  } catch (err) {
    console.error("Webhook error:", err);
    return new Response("Webhook processing failed", { status: 400 });
  }
});
