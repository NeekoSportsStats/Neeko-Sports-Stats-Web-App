import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Sport configuration
const SPORT_CONFIG = {
  afl: { 
    statsTable: "afl_stats",
    blockPrefix: "afl_",
    statLabels: ["Goals", "Disposals", "Tackles", "Marks", "Hitouts", "Fantasy Score"]
  },
  nrl: { 
    statsTable: "nrl_stats",
    blockPrefix: "nrl_",
    statLabels: ["Tries", "Try Assists", "Tackles", "Running Metres", "Linebreaks", "Fantasy Score"]
  },
  epl: { 
    statsTable: "epl_stats",
    blockPrefix: "epl_",
    statLabels: ["Goals", "Assists", "Shots", "Passes", "Tackles", "Fantasy Score"]
  },
  nba: { 
    statsTable: "nba_stats",
    blockPrefix: "nba_",
    statLabels: ["Points", "Rebounds", "Assists", "Steals", "Blocks", "Fantasy Score"]
  }
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Starting AI insights generation...");

    // Verify admin authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY")!;

    if (!lovableApiKey) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Create client for verifying user
    const supabaseClient = createClient(
      supabaseUrl,
      Deno.env.get("SUPABASE_ANON_KEY")!,
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
        JSON.stringify({ error: "Access denied" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Define validation schema
    const insightsSchema = z.object({
      sport: z.enum(['afl', 'nrl', 'epl', 'nba'])
    });

    // Parse and validate request body
    let sport: string;
    
    try {
      const body = await req.json();
      const validated = insightsSchema.parse(body);
      sport = validated.sport;
    } catch (error) {
      console.error("Validation error:", error);
      return new Response(
        JSON.stringify({ error: "Invalid parameters" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    const sportLower = sport.toLowerCase() as keyof typeof SPORT_CONFIG;

    const config = SPORT_CONFIG[sportLower];
    console.log(`Generating insights for ${sportLower.toUpperCase()}...`);

    // Use service role client for data operations
    const serviceClient = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch stats from database
    const { data: stats, error: statsError } = await serviceClient
      .from(config.statsTable)
      .select("*")
      .order("fantasy_score", { ascending: false });

    if (statsError) {
      console.error(`Error fetching ${sport} stats:`, statsError);
      throw statsError;
    }

    if (!stats || stats.length === 0) {
      throw new Error(`No ${sport} stats found in database`);
    }

    console.log(`Fetched ${stats.length} ${sport} player records`);

    // Prepare data summary for AI
    const topPlayers = stats.slice(0, 50).map(s => {
      const statValues = Object.entries(s)
        .filter(([key]) => !['id', 'updated_at', 'player', 'team', 'round'].includes(key))
        .map(([key, val]) => `${key}: ${val}`)
        .join(', ');
      return `${s.player} (${s.team}): ${statValues}`;
    }).join("\n");

    // Construct prompt for AI
    const sportName = sport.toUpperCase();
    const prompt = `You are a ${sportName} Fantasy expert. Analyze this player data and create exactly 20 analysis blocks.

BLOCK 1 MUST BE: "Trending Hot" with exactly 10 players
- First 5 players are FREE content (is_premium: false, rank: 1-5)
- Last 5 players are PREMIUM content (is_premium: true, rank: 6-10)

BLOCKS 2-20: Create 19 more diverse analysis categories with 4-5 players each (all FREE content, is_premium: false)
Examples: Breakout Alerts, Cold Streaks, Form Spikes, Consistency Ratings, Efficiency Anomalies, Rising Stars, High-Impact Rounds, Role Changes, Hot Start Indicators, Differential Targets, Captain Candidates, Bargain Picks, Premium Performers, etc.

For each player provide:
1. Player name (exact match from data)
2. 1-2 sentence explanation of why they're in this category
3. A sparkline array of 8 numbers representing recent form trend (e.g., [45, 52, 48, 67, 71, 68, 75, 82])

Top 50 players by fantasy score:
${topPlayers}

Return ONLY a valid JSON array with this exact structure:
[
  {
    "block_type": "${config.blockPrefix}trending_hot",
    "block_title": "Trending Hot",
    "rank": 1,
    "player": "Player Name",
    "explanation": "Brief explanation here.",
    "stats": {"label": "Fantasy Score", "value": "120"},
    "sparkline": [45, 52, 48, 67, 71, 68, 75, 82],
    "is_premium": false
  }
]

CRITICAL: All block_type values MUST start with "${config.blockPrefix}" (e.g., "${config.blockPrefix}trending_hot", "${config.blockPrefix}breakout_alerts", etc.)

Make sure the first block has exactly 10 players (ranks 1-10), with ranks 1-5 as is_premium: false and ranks 6-10 as is_premium: true.
All other blocks should have 4-5 players each, all with is_premium: false.`;

    console.log("Calling Lovable AI...");
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${lovableApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: `You are a ${sportName} Fantasy expert. Return only valid JSON arrays.` },
          { role: "user", content: prompt }
        ],
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("AI API error:", aiResponse.status, errorText);
      throw new Error(`AI API error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const aiContent = aiData.choices?.[0]?.message?.content;

    if (!aiContent) {
      throw new Error("No content from AI");
    }

    console.log("AI response received, parsing...");

    // Extract JSON from response (handle markdown code blocks)
    let jsonContent = aiContent.trim();
    if (jsonContent.startsWith("```json")) {
      jsonContent = jsonContent.replace(/```json\n?/g, "").replace(/```\n?/g, "");
    } else if (jsonContent.startsWith("```")) {
      jsonContent = jsonContent.replace(/```\n?/g, "");
    }

    const insights = JSON.parse(jsonContent);

    if (!Array.isArray(insights) || insights.length === 0) {
      throw new Error("Invalid insights format from AI");
    }

    console.log(`Generated ${insights.length} insights, clearing old ${sport} data...`);

    // Clear existing AI insights for this sport
    console.log(`Clearing existing ${sport} AI insights...`);
    const { error: deleteError } = await serviceClient
      .from("ai_insights")
      .delete()
      .like("block_type", `${config.blockPrefix}%`);

    if (deleteError) {
      console.error("Error clearing existing insights:", deleteError);
      throw deleteError;
    }

    // Insert new insights
    console.log("Inserting new insights...");
    const { error: insertError } = await serviceClient
      .from("ai_insights")
      .insert(insights);

    if (insertError) {
      console.error("Error inserting insights:", insertError);
      throw insertError;
    }

    console.log(`${sport} AI insights generation completed successfully`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `${sport} AI insights generated successfully`,
        sport,
        insightsGenerated: insights.length 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in generate-ai-insights:", error);
    return new Response(
      JSON.stringify({ 
        error: "Operation failed" 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});
