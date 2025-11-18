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
    console.log("Starting master sync pipeline...");

    // Verify admin authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    
    // Create client for verifying user
    const supabaseClient = createClient(
      supabaseUrl,
      supabaseAnonKey,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      console.error("Authentication failed:", userError);
      return new Response(
        JSON.stringify({ error: "Access denied" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if user is admin
    const { data: isAdmin } = await supabaseClient.rpc("has_role", {
      _user_id: user.id,
      _role: "admin"
    });

    if (!isAdmin) {
      console.error("User is not admin:", user.id);
      return new Response(
        JSON.stringify({ error: "Access denied - admin only" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Admin verified:", user.email);

    const client = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const results: any = {
      sync: null,
      teamStats: {},
      aiAnalysis: {},
    };

    // Step 1: Sync Google Sheets
    console.log("Step 1: Syncing Google Sheets data...");
    const { data: syncData, error: syncError } = await client.functions.invoke('sync-googlesheet', {
      body: { trigger: "manual_sync" }
    });

    if (syncError) {
      console.error("Sync error:", syncError);
      results.sync = { success: false, error: syncError.message };
    } else {
      results.sync = syncData;
    }

    // Step 2: Compute team stats for all sports
    console.log("Step 2: Computing team stats...");
    for (const sport of ["afl", "nba", "epl"]) {
      try {
        const { data, error } = await client.functions.invoke('compute-team-stats', {
          body: { sport }
        });
        results.teamStats[sport] = error ? { success: false, error: error.message } : data;
      } catch (err: any) {
        results.teamStats[sport] = { success: false, error: err.message };
      }
    }

    // Step 3: Generate AI analysis for all sports
    console.log("Step 3: Generating AI analysis...");
    for (const sport of ["afl", "nba", "epl"]) {
      try {
        const { data, error } = await client.functions.invoke('generate-sport-ai-analysis', {
          body: { sport }
        });
        results.aiAnalysis[sport] = error ? { success: false, error: error.message } : data;
      } catch (err: any) {
        results.aiAnalysis[sport] = { success: false, error: err.message };
      }
    }

    console.log("Master sync pipeline completed");

    return new Response(
      JSON.stringify({
        success: true,
        message: "Master sync completed",
        results,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error in master-sync:", error);
    return new Response(
      JSON.stringify({
        success: false,
        message: "Master sync failed",
        error: error.message,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
