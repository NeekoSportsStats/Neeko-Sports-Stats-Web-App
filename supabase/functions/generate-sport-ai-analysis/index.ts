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

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const serviceClient = createClient(supabaseUrl, supabaseServiceKey);
  
  const startTime = new Date();
  let logId: string | undefined;

  try {
    console.log("Generating sport AI analysis...");

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY not configured");
    }

    const body = await req.json();
    const { sport } = body;

    // Create log entry
    const { data: logEntry, error: logError } = await serviceClient
      .from('sync_logs')
      .insert({
        operation: 'generate-sport-ai-analysis',
        sport,
        status: 'running'
      })
      .select()
      .single();

    if (!logError) logId = logEntry?.id;

    if (!sport || !["afl", "nba", "epl"].includes(sport)) {
      throw new Error("Invalid sport specified");
    }

    // Fetch player stats with sport-specific ordering
    const orderColumn = sport === "nba" ? "points" : sport === "epl" ? "goals_total" : "fantasy_points";
    const { data: playerStats, error: fetchError } = await serviceClient
      .from(`${sport}_player_stats`)
      .select("*")
      .order(orderColumn, { ascending: false })
      .limit(200);

    if (fetchError) {
      console.error(`Error fetching ${sport} player stats:`, fetchError);
      throw fetchError;
    }

    if (!playerStats || playerStats.length === 0) {
      console.log(`No player stats found for ${sport}`);
      return new Response(
        JSON.stringify({ success: true, message: `No ${sport} player stats to analyze` }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create 20 AI analysis blocks (each with 10 players)
    const aiBlocks = [
      { type: "trending_hot", title: "🔥 Trending Hot", count: 10 },
      { type: "breakout_stars", title: "⭐ Breakout Stars", count: 10 },
      { type: "consistent_performers", title: "📊 Consistent Performers", count: 10 },
      { type: "value_picks", title: "💎 Value Picks", count: 10 },
      { type: "high_ceiling", title: "🚀 High Ceiling", count: 10 },
      { type: "injury_watch", title: "🏥 Injury Watch", count: 10 },
      { type: "form_slump", title: "📉 Form Slump", count: 10 },
      { type: "differential_picks", title: "🎯 Differential Picks", count: 10 },
      { type: "captain_choices", title: "👑 Captain Choices", count: 10 },
      { type: "bench_options", title: "🔄 Bench Options", count: 10 },
      { type: "sleeper_picks", title: "😴 Sleeper Picks", count: 10 },
      { type: "premium_targets", title: "💰 Premium Targets", count: 10 },
      { type: "mid_price_gems", title: "💎 Mid-Price Gems", count: 10 },
      { type: "budget_enablers", title: "🔑 Budget Enablers", count: 10 },
      { type: "trade_targets", title: "🔄 Trade Targets", count: 10 },
      { type: "hold_firm", title: "🔒 Hold Firm", count: 10 },
      { type: "sell_high", title: "📈 Sell High", count: 10 },
      { type: "buy_low", title: "📉 Buy Low", count: 10 },
      { type: "keeper_league", title: "🏆 Keeper League", count: 10 },
      { type: "rookie_watch", title: "🌟 Rookie Watch", count: 10 },
    ];

    const allAnalysisRecords: any[] = [];
    const BATCH_SIZE = 50; // Process only 50 insights immediately
    let totalProcessed = 0;
    const queuedJobs: any[] = [];

    // Generate AI analysis for each block
    for (const block of aiBlocks) {
      const playersForBlock = playerStats.slice(0, block.count);
      
      for (let i = 0; i < playersForBlock.length; i++) {
        const player = playersForBlock[i];
        
        // Get player ID based on sport
        let playerId = "";
        if (sport === "afl") {
          playerId = player.player || "unknown";
        } else if (sport === "nba") {
          playerId = `${player.player_firstname}_${player.player_lastname}` || player.player_id || "unknown";
        } else if (sport === "epl") {
          playerId = player.player_name || player.player_id || "unknown";
        }
        
        // If we've processed 50, queue the rest
        if (totalProcessed >= BATCH_SIZE) {
          queuedJobs.push({
            sport,
            player_id: playerId,
            status: 'pending'
          });
          continue;
        }
        
        totalProcessed++;
        const isPremium = i >= 4; // First 4 are free, rest are premium

        // Generate AI explanation
        const prompt = `Analyze this ${sport.toUpperCase()} player's performance in 1-2 sentences:
Player: ${player.player || player.player_name || "Unknown"}
Team: ${player.team || player.team_name || "Unknown"}
Stats: ${JSON.stringify(player)}
Context: This is for the "${block.title}" category.`;

        let explanation = "Performance analysis pending.";
        try {
          const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${LOVABLE_API_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: "google/gemini-2.5-flash",
              messages: [
                { role: "system", content: "You are a sports analyst. Provide concise, insightful analysis in 1-2 sentences." },
                { role: "user", content: prompt }
              ],
            }),
          });

          if (aiResponse.ok) {
            const aiData = await aiResponse.json();
            explanation = aiData.choices?.[0]?.message?.content || explanation;
          }
        } catch (aiError) {
          console.error("AI generation error:", aiError);
        }

        // Get real sparkline data from player stats
        let sparklineData: number[] = [];
        try {
          let statKey = '';
          if (sport === 'afl') {
            statKey = 'fantasy_points';
          } else if (sport === 'nba') {
            statKey = 'points';
          } else if (sport === 'epl') {
            statKey = 'rating';
          }

          if (sport === 'afl') {
            const { data, error } = await serviceClient
              .from(`${sport}_player_stats`)
              .select(`${statKey}, round_order`)
              .eq('player', player.player || '')
              .order('round_order', { ascending: true });
            
            if (!error && data) {
              sparklineData = data
                .map((row: any) => {
                  const val = row[statKey];
                  if (typeof val === 'number') return val;
                  if (typeof val === 'string') {
                    const parsed = parseFloat(val);
                    return isNaN(parsed) ? null : parsed;
                  }
                  return null;
                })
                .filter((v): v is number => v !== null && !isNaN(v) && isFinite(v));
            }
          } else if (sport === 'nba') {
            const { data, error } = await serviceClient
              .from(`${sport}_player_stats`)
              .select(`${statKey}, game_id`)
              .eq('player_firstname', player.player_firstname || '')
              .eq('player_lastname', player.player_lastname || '')
              .order('game_id', { ascending: true });
            
            if (!error && data) {
              sparklineData = data
                .map((row: any) => {
                  const val = row[statKey];
                  if (typeof val === 'number') return val;
                  if (typeof val === 'string') {
                    const parsed = parseFloat(val);
                    return isNaN(parsed) ? null : parsed;
                  }
                  return null;
                })
                .filter((v): v is number => v !== null && !isNaN(v) && isFinite(v));
            }
          } else if (sport === 'epl') {
            const { data, error } = await serviceClient
              .from(`${sport}_player_stats`)
              .select(`${statKey}, fixture_id`)
              .eq('player_name', player.player_name || '')
              .order('fixture_id', { ascending: true});
            
            if (!error && data) {
              sparklineData = data
                .map((row: any) => {
                  const val = row[statKey];
                  if (typeof val === 'number') return val;
                  if (typeof val === 'string') {
                    const parsed = parseFloat(val);
                    return isNaN(parsed) ? null : parsed;
                  }
                  return null;
                })
                .filter((v): v is number => v !== null && !isNaN(v) && isFinite(v));
            }
          }
        } catch (error) {
          console.error('Error fetching sparkline data:', error);
          sparklineData = [];
        }

        // Get player name based on sport structure
        let playerName = "Unknown";
        if (sport === "afl") {
          playerName = player.player || "Unknown";
        } else if (sport === "nba") {
          playerName = player.player_firstname && player.player_lastname
            ? `${player.player_firstname} ${player.player_lastname}`
            : player.player_name || "Unknown";
        } else if (sport === "epl") {
          playerName = player.player_name || "Unknown";
        }

        // Get stat value based on sport
        let statValue = 0;
        if (sport === "afl") {
          statValue = player.fantasy_points || 0;
        } else if (sport === "nba") {
          statValue = player.points || 0;
        } else if (sport === "epl") {
          statValue = player.goals_total || 0;
        }

        const analysisRecord = {
          block_title: block.title,
          block_type: block.type,
          player_name: playerName,
          team_name: player.team || player.team_name || "",
          rank: i + 1,
          stat_label: sport === "afl" ? "Fantasy" : sport === "nba" ? "Points" : "Goals",
          stat_value: String(statValue),
          explanation,
          sparkline_data: JSON.stringify(sparklineData),
          is_premium: isPremium,
          round: player.round || "R1",
        };

        allAnalysisRecords.push(analysisRecord);
      }
    }

    console.log(`Generated ${allAnalysisRecords.length} AI analysis records for ${sport} (immediate batch)`);
    console.log(`Queued ${queuedJobs.length} jobs for background processing`);

    // Clear existing analysis
    const { error: deleteError } = await serviceClient
      .from(`ai_${sport}_analysis`)
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000");

    if (deleteError) {
      console.error(`Error clearing ${sport} AI analysis:`, deleteError);
      throw deleteError;
    }

    // Insert new analysis
    const { error: insertError } = await serviceClient
      .from(`ai_${sport}_analysis`)
      .insert(allAnalysisRecords);

    if (insertError) {
      console.error(`Error inserting ${sport} AI analysis:`, insertError);
      throw insertError;
    }

    // Queue remaining jobs for background processing
    if (queuedJobs.length > 0) {
      const { error: queueError } = await serviceClient
        .from('ai_analysis_queue')
        .insert(queuedJobs);

      if (queueError) {
        console.error('Error queuing background jobs:', queueError);
        // Don't throw - immediate batch succeeded
      } else {
        console.log(`Successfully queued ${queuedJobs.length} jobs for background processing`);
      }
    }

    console.log(`${sport} AI analysis generated successfully (${allAnalysisRecords.length} immediate, ${queuedJobs.length} queued)`);

    const duration = (new Date().getTime() - startTime.getTime()) / 1000;

    // Update log entry
    if (logId) {
      await serviceClient
        .from('sync_logs')
        .update({
          status: 'success',
          completed_at: new Date().toISOString(),
          records_processed: allAnalysisRecords.length,
          records_inserted: allAnalysisRecords.length,
          duration_seconds: duration
        })
        .eq('id', logId);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `${sport.toUpperCase()} AI analysis generated successfully`,
        records: allAnalysisRecords.length,
        queuedJobs: queuedJobs.length,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error in generate-sport-ai-analysis:", error);
    
    // Update log entry with failure
    if (logId) {
      const duration = (new Date().getTime() - startTime.getTime()) / 1000;
      await serviceClient
        .from('sync_logs')
        .update({
          status: 'failed',
          completed_at: new Date().toISOString(),
          error_message: error?.message,
          error_details: { stack: error?.stack },
          duration_seconds: duration
        })
        .eq('id', logId);
    }
    
    return new Response(
      JSON.stringify({
        success: false,
        message: "Failed to generate AI analysis",
        error: error.message,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
