import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const results = {
      test1_signup: { status: "pending", details: "" },
      test2_subscription_update: { status: "pending", details: "" },
      test3_cancellation: { status: "pending", details: "" },
    };

    // TEST 1: Simulate customer signup
    console.log("TEST 1: Simulating customer signup...");
    const testEmail = `test-${Date.now()}@example.com`;
    const testUserId = crypto.randomUUID();
    
    try {
      // Create test user
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email: testEmail,
        password: "test-password-123",
        email_confirm: true,
        user_metadata: { test: true }
      });

      if (createError) throw createError;

      // Create stripe customer
      await supabase.from("stripe_customers").insert({
        user_id: newUser.user.id,
        customer_id: `cus_test_${Date.now()}`,
      });

      // Create active subscription
      const subscriptionId = `sub_test_${Date.now()}`;
      await supabase.from("subscriptions").insert({
        id: subscriptionId,
        user_id: newUser.user.id,
        status: "active",
        price_id: "price_test_123",
        current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      });

      // Verify user role was set to premium by trigger
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait for trigger
      
      const { data: userRole, error: roleError } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", newUser.user.id)
        .single();

      if (roleError) throw roleError;

      if (userRole?.role === "premium") {
        results.test1_signup.status = "✅ SUCCESS";
        results.test1_signup.details = `User created with premium role. Email: ${testEmail}`;
      } else {
        results.test1_signup.status = "❌ FAILED";
        results.test1_signup.details = `User role is '${userRole?.role}' instead of 'premium'`;
      }
    } catch (error) {
      results.test1_signup.status = "❌ FAILED";
      results.test1_signup.details = `Error: ${error instanceof Error ? error.message : String(error)}`;
    }

    // TEST 2: Simulate subscription update
    console.log("TEST 2: Simulating subscription update...");
    try {
      // Find a test subscription to update
      const { data: testSub } = await supabase
        .from("subscriptions")
        .select("*")
        .limit(1)
        .single();

      if (testSub) {
        // Update to trialing status
        await supabase
          .from("subscriptions")
          .update({
            status: "trialing",
            updated_at: new Date().toISOString(),
          })
          .eq("id", testSub.id);

        // Verify role is still premium
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait for trigger

        const { data: userRole } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", testSub.user_id)
          .single();

        if (userRole?.role === "premium") {
          results.test2_subscription_update.status = "✅ SUCCESS";
          results.test2_subscription_update.details = "Subscription updated, user remains premium";
        } else {
          results.test2_subscription_update.status = "❌ FAILED";
          results.test2_subscription_update.details = `Role changed to '${userRole?.role}'`;
        }
      } else {
        results.test2_subscription_update.status = "⚠️ SKIPPED";
        results.test2_subscription_update.details = "No subscription found to test";
      }
    } catch (error) {
      results.test2_subscription_update.status = "❌ FAILED";
      results.test2_subscription_update.details = `Error: ${error instanceof Error ? error.message : String(error)}`;
    }

    // TEST 3: Simulate cancellation
    console.log("TEST 3: Simulating cancellation...");
    try {
      // Find a test subscription to cancel
      const { data: testSub } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("status", "active")
        .limit(1)
        .single();

      if (testSub) {
        // Cancel subscription
        await supabase
          .from("subscriptions")
          .update({
            status: "canceled",
            updated_at: new Date().toISOString(),
          })
          .eq("id", testSub.id);

        // Verify role changed to free
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait for trigger

        const { data: userRole } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", testSub.user_id)
          .single();

        if (userRole?.role === "free") {
          results.test3_cancellation.status = "✅ SUCCESS";
          results.test3_cancellation.details = "Subscription canceled, user downgraded to free";
        } else {
          results.test3_cancellation.status = "❌ FAILED";
          results.test3_cancellation.details = `Role is '${userRole?.role}' instead of 'free'`;
        }
      } else {
        results.test3_cancellation.status = "⚠️ SKIPPED";
        results.test3_cancellation.details = "No active subscription found to test";
      }
    } catch (error) {
      results.test3_cancellation.status = "❌ FAILED";
      results.test3_cancellation.details = `Error: ${error instanceof Error ? error.message : String(error)}`;
    }

    // Overall summary
    const allPassed = Object.values(results).every(r => r.status.includes("SUCCESS"));
    const summary = {
      overall: allPassed ? "✅ ALL TESTS PASSED" : "❌ SOME TESTS FAILED",
      timestamp: new Date().toISOString(),
      results,
      webhook_url: `${supabaseUrl}/functions/v1/stripe-webhook`,
      config: {
        stripe_secret_key: Deno.env.get("STRIPE_SECRET_KEY") ? "✅ Configured" : "❌ Missing",
        stripe_webhook_secret: Deno.env.get("STRIPE_WEBHOOK_SECRET") ? "✅ Configured" : "❌ Missing",
        stripe_price_id: Deno.env.get("STRIPE_PRICE_ID") ? "✅ Configured" : "❌ Missing",
      },
    };

    console.log("Test Summary:", JSON.stringify(summary, null, 2));

    return new Response(JSON.stringify(summary, null, 2), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Test error:", error);
    return new Response(
      JSON.stringify({ 
        error: "Test failed", 
        message: error instanceof Error ? error.message : String(error)
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});