import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Rate limiting map (IP -> array of timestamps)
const rateLimitMap = new Map<string, number[]>();
const MAX_REQUESTS_PER_HOUR = 5;
const HOUR_IN_MS = 3600000;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Rate limiting check
    const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0] || 
                     req.headers.get('x-real-ip') || 
                     'unknown';
    const now = Date.now();
    const hourAgo = now - HOUR_IN_MS;

    // Clean up old timestamps and get recent requests
    const recentRequests = (rateLimitMap.get(clientIp) || [])
      .filter(timestamp => timestamp > hourAgo);

    if (recentRequests.length >= MAX_REQUESTS_PER_HOUR) {
      console.warn(`Rate limit exceeded for IP: ${clientIp}`);
      return new Response(
        JSON.stringify({ error: "Too many requests. Please try again later." }),
        {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Record this request
    recentRequests.push(now);
    rateLimitMap.set(clientIp, recentRequests);

    const { session_id } = await req.json();
    
    if (!session_id || typeof session_id !== 'string') {
      return new Response(
        JSON.stringify({ error: "Invalid request" }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400 
        }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Query checkout session from database instead of Stripe API
    const { data: sessionData, error: sessionError } = await supabase
      .from("checkout_sessions")
      .select("email, user_id, expires_at, used")
      .eq("session_id", session_id)
      .single();

    if (sessionError || !sessionData) {
      console.error("Session lookup failed:", sessionError);
      return new Response(
        JSON.stringify({ error: "Invalid request" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }

    // Validate session hasn't been used
    if (sessionData.used) {
      return new Response(
        JSON.stringify({ error: "Invalid request" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }

    // Validate session hasn't expired
    if (new Date(sessionData.expires_at) < new Date()) {
      return new Response(
        JSON.stringify({ error: "Session expired" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }

    // Additional security: Only allow sessions created within the last hour
    // This prevents enumeration of old session IDs
    const sessionCreatedAt = new Date(sessionData.created_at || 0);
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    if (sessionCreatedAt < oneHourAgo) {
      return new Response(
        JSON.stringify({ error: "Session expired" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }

    return new Response(
      JSON.stringify({ 
        email: sessionData.email,
        user_id: sessionData.user_id,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Verify session error:", error);
    return new Response(
      JSON.stringify({ error: "Operation failed" }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});
