import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import Stripe from "npm:stripe@14.21.0";
import { createClient } from "npm:@supabase/supabase-js@2";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") as string, {
  apiVersion: "2024-11-20.acacia",
});

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

async function updatePremiumStatus(
  supabase: any,
  userId: string,
  isPremium: boolean
) {
  console.log(`Updating premium status for user ${userId} to ${isPremium}`);

  if (isPremium) {
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

Deno.serve(async (req: Request) => {
  const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
  if (!webhookSecret) {
    console.error("STRIPE_WEBHOOK_SECRET not configured");
    return new Response("Service misconfigured", { status: 500 });
  }

  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    console.warn("Webhook received without signature");
    return new Response("Missing signature", { status: 401 });
  }

  try {
    const body = await req.text();
    const event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: existingEvent } = await supabase
      .from("stripe_events")
      .select("id")
      .eq("event_id", event.id)
      .maybeSingle();

    if (existingEvent) {
      console.log(`Event ${event.id} already processed - ignoring replay`);
      return new Response(JSON.stringify({ received: true }), {
        headers: { "Content-Type": "application/json" },
        status: 200,
      });
    }

    await supabase.from("stripe_events").insert({
      event_id: event.id,
      type: event.type,
      data: event.data.object as any,
    });

    console.log(`Processing webhook event: ${event.type}`);

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.user_id;

        if (userId && session.subscription) {
          await supabase.from("stripe_customers").upsert({
            user_id: userId,
            customer_id: session.customer as string,
          }, {
            onConflict: "user_id"
          });

          const subscription = await stripe.subscriptions.retrieve(session.subscription as string);

          await supabase.from("subscriptions").upsert({
            id: subscription.id,
            user_id: userId,
            status: subscription.status,
            price_id: subscription.items.data[0]?.price.id || "",
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
          }, {
            onConflict: "id"
          });

          await updatePremiumStatus(supabase, userId, true);
        }
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;

        const { data: existingSub } = await supabase
          .from("subscriptions")
          .select("user_id")
          .eq("id", subscription.id)
          .maybeSingle();

        if (existingSub) {
          await supabase
            .from("subscriptions")
            .update({
              status: subscription.status,
              current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq("id", subscription.id);

          const isPremium = ['active', 'trialing'].includes(subscription.status);
          await updatePremiumStatus(supabase, existingSub.user_id, isPremium);
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;

        const { data: existingSub } = await supabase
          .from("subscriptions")
          .select("user_id")
          .eq("id", subscription.id)
          .maybeSingle();

        if (existingSub) {
          await supabase
            .from("subscriptions")
            .update({
              status: "canceled",
              updated_at: new Date().toISOString(),
            })
            .eq("id", subscription.id);

          await updatePremiumStatus(supabase, existingSub.user_id, false);
        }
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;

        if (invoice.subscription) {
          const { data: existingSub } = await supabase
            .from("subscriptions")
            .select("user_id")
            .eq("id", invoice.subscription as string)
            .maybeSingle();

          if (existingSub) {
            await supabase
              .from("subscriptions")
              .update({
                status: "past_due",
                updated_at: new Date().toISOString(),
              })
              .eq("id", invoice.subscription as string);

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
