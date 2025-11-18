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
    // Extract and validate JWT
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      console.error("Missing authorization header");
      return new Response(
        JSON.stringify({ error: "Authentication required" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 401 }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get authenticated user
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      console.error("Invalid authentication token");
      return new Response(
        JSON.stringify({ error: "Authentication required" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 401 }
      );
    }

    const { password, session_id } = await req.json();
    
    // Validate password strength
    if (!password || password.length < 12 || password.length > 128) {
      return new Response(
        JSON.stringify({ error: "Password must be 12-128 characters" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    if (!/[A-Z]/.test(password)) {
      return new Response(
        JSON.stringify({ error: "Password must contain at least one uppercase letter" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    if (!/[a-z]/.test(password)) {
      return new Response(
        JSON.stringify({ error: "Password must contain at least one lowercase letter" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    if (!/[0-9]/.test(password)) {
      return new Response(
        JSON.stringify({ error: "Password must contain at least one number" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    // Validate checkout session if provided (for post-purchase password creation)
    if (session_id) {
      const { data: sessionData, error: sessionError } = await supabase
        .from("checkout_sessions")
        .select("*")
        .eq("session_id", session_id)
        .eq("user_id", user.id)
        .single();

      if (sessionError || !sessionData) {
        console.error("Invalid or expired session");
        return new Response(
          JSON.stringify({ error: "Invalid request" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
        );
      }

      if (sessionData.used) {
        console.error("Session already used");
        return new Response(
          JSON.stringify({ error: "Invalid request" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
        );
      }

      if (new Date(sessionData.expires_at) < new Date()) {
        console.error("Session expired");
        return new Response(
          JSON.stringify({ error: "Session expired" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
        );
      }

      // Mark session as used
      await supabase
        .from("checkout_sessions")
        .update({ used: true })
        .eq("session_id", session_id);
    }

    // Update user password
    const { error: updateError } = await supabase.auth.admin.updateUserById(
      user.id,
      { password }
    );
    
    if (updateError) {
      console.error("Password update failed:", updateError);
      return new Response(
        JSON.stringify({ error: "Operation failed" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    console.log(`Password updated successfully for user ${user.id}`);
    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error) {
    console.error("Set password error:", error);
    return new Response(
      JSON.stringify({ error: "Operation failed" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
    );
  }
});
