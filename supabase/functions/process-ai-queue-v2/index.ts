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

  // Validate CRON secret for additional security
  const cronSecret = req.headers.get("x-cron-secret");
  const expectedSecret = Deno.env.get("CRON_SECRET");
  
  if (expectedSecret && cronSecret !== expectedSecret) {
    console.warn("Invalid CRON secret provided");
    return new Response(
      JSON.stringify({ error: "Unauthorized" }),
      { 
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const serviceClient = createClient(supabaseUrl, supabaseServiceKey);
  
  const startTime = new Date();

  try {
    console.log("Processing AI analysis queue (v2)...");

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY not configured");
    }

    // Fetch up to 50 pending jobs
    const { data: pendingJobs, error: fetchError } = await serviceClient
      .from('ai_analysis_queue')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: true })
      .limit(50);

    if (fetchError) {
      console.error('Error fetching pending jobs:', fetchError);
      throw fetchError;
    }

    if (!pendingJobs || pendingJobs.length === 0) {
      console.log('No pending jobs in queue');
      return new Response(
        JSON.stringify({ success: true, message: 'No pending jobs', processed: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Processing ${pendingJobs.length} pending jobs`);
    let successCount = 0;
    let failCount = 0;

    // Group jobs by sport for efficient batch processing
    const jobsBySport = pendingJobs.reduce((acc: any, job: any) => {
      if (!acc[job.sport]) acc[job.sport] = [];
      acc[job.sport].push(job);
      return acc;
    }, {});

    for (const [sport, jobs] of Object.entries(jobsBySport) as [string, any][]) {
      console.log(`Processing ${jobs.length} ${sport.toUpperCase()} jobs`);

      // Fetch player stats for this sport
      const orderColumn = sport === "nba" ? "points" : sport === "epl" ? "goals_total" : "fantasy_points";
      const { data: playerStats, error: fetchError } = await serviceClient
        .from(`${sport}_player_stats`)
        .select("*")
        .order(orderColumn, { ascending: false })
        .limit(200);

      if (fetchError || !playerStats) {
        console.error(`Error fetching ${sport} player stats:`, fetchError);
        continue;
      }

      // Define AI analysis blocks (same as generate-sport-ai-analysis)
      const aiBlocks = [
        { type: "trending_hot", title: "🔥 Trending Hot" },
        { type: "breakout_stars", title: "⭐ Breakout Stars" },
        { type: "consistent_performers", title: "📊 Consistent Performers" },
        { type: "value_picks", title: "💎 Value Picks" },
        { type: "high_ceiling", title: "🚀 High Ceiling" },
        { type: "injury_watch", title: "🏥 Injury Watch" },
        { type: "form_slump", title: "📉 Form Slump" },
        { type: "differential_picks", title: "🎯 Differential Picks" },
        { type: "captain_choices", title: "👑 Captain Choices" },
        { type: "bench_options", title: "🔄 Bench Options" },
        { type: "sleeper_picks", title: "😴 Sleeper Picks" },
        { type: "premium_targets", title: "💰 Premium Targets" },
        { type: "mid_price_gems", title: "💎 Mid-Price Gems" },
        { type: "budget_enablers", title: "🔑 Budget Enablers" },
        { type: "trade_targets", title: "🔄 Trade Targets" },
        { type: "hold_firm", title: "🔒 Hold Firm" },
        { type: "sell_high", title: "📈 Sell High" },
        { type: "buy_low", title: "📉 Buy Low" },
        { type: "keeper_league", title: "🏆 Keeper League" },
        { type: "rookie_watch", title: "🌟 Rookie Watch" },
      ];

      for (const job of jobs) {
        try {
          // Mark as processing
          await serviceClient
            .from('ai_analysis_queue')
            .update({ 
              status: 'processing', 
              started_at: new Date().toISOString() 
            })
            .eq('id', job.id);

          // Find the player in stats
          let player;
          if (sport === "afl") {
            player = playerStats.find((p: any) => p.player === job.player_id);
          } else if (sport === "nba") {
            const [firstName, lastName] = job.player_id.split('_');
            player = playerStats.find((p: any) => 
              p.player_firstname === firstName && p.player_lastname === lastName
            );
          } else if (sport === "epl") {
            player = playerStats.find((p: any) => p.player_name === job.player_id);
          }

          if (!player) {
            throw new Error(`Player ${job.player_id} not found in ${sport} stats`);
          }

          // Determine block (cycle through blocks, premium after rank 4)
          const blockIndex = Math.floor(Math.random() * aiBlocks.length);
          const block = aiBlocks[blockIndex];
          const isPremium = true; // All queued jobs are premium

          // Generate AI explanation
          const prompt = `Analyze this ${sport.toUpperCase()} player's performance in 1-2 sentences:
Player: ${player.player || player.player_name || `${player.player_firstname} ${player.player_lastname}` || "Unknown"}
Team: ${player.team || player.team_name || "Unknown"}
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

          // Get sparkline data
          let sparklineData: number[] = [];
          try {
            let statKey = sport === 'afl' ? 'fantasy_points' : sport === 'nba' ? 'points' : 'rating';

            if (sport === 'afl') {
              const { data } = await serviceClient
                .from(`${sport}_player_stats`)
                .select(`${statKey}, round_order`)
                .eq('player', player.player || '')
                .order('round_order', { ascending: true });
              
              if (data) {
                sparklineData = data
                  .map((row: any) => parseFloat(row[statKey]))
                  .filter((v: number) => !isNaN(v) && isFinite(v));
              }
            } else if (sport === 'nba') {
              const { data } = await serviceClient
                .from(`${sport}_player_stats`)
                .select(`${statKey}, game_id`)
                .eq('player_firstname', player.player_firstname || '')
                .eq('player_lastname', player.player_lastname || '')
                .order('game_id', { ascending: true });
              
              if (data) {
                sparklineData = data
                  .map((row: any) => parseFloat(row[statKey]))
                  .filter((v: number) => !isNaN(v) && isFinite(v));
              }
            } else if (sport === 'epl') {
              const { data } = await serviceClient
                .from(`${sport}_player_stats`)
                .select(`${statKey}, fixture_id`)
                .eq('player_name', player.player_name || '')
                .order('fixture_id', { ascending: true});
              
              if (data) {
                sparklineData = data
                  .map((row: any) => parseFloat(row[statKey]))
                  .filter((v: number) => !isNaN(v) && isFinite(v));
              }
            }
          } catch (error) {
            console.error('Error fetching sparkline data:', error);
          }

          // Get player name
          let playerName = "Unknown";
          if (sport === "afl") {
            playerName = player.player || "Unknown";
          } else if (sport === "nba") {
            playerName = `${player.player_firstname} ${player.player_lastname}`;
          } else if (sport === "epl") {
            playerName = player.player_name || "Unknown";
          }

          // Get stat value
          let statValue = 0;
          if (sport === "afl") statValue = player.fantasy_points || 0;
          else if (sport === "nba") statValue = player.points || 0;
          else if (sport === "epl") statValue = player.goals_total || 0;

          // Determine rank
          const { data: existingRecords } = await serviceClient
            .from(`ai_${sport}_analysis`)
            .select('rank')
            .eq('block_type', block.type)
            .order('rank', { ascending: false })
            .limit(1);

          const nextRank = existingRecords && existingRecords.length > 0 
            ? existingRecords[0].rank + 1 
            : 5; // Start at 5 since first 4 are free

          const analysisRecord = {
            block_title: block.title,
            block_type: block.type,
            player_name: playerName,
            team_name: player.team || player.team_name || "",
            rank: nextRank,
            stat_label: sport === "afl" ? "Fantasy" : sport === "nba" ? "Points" : "Goals",
            stat_value: String(statValue),
            explanation,
            sparkline_data: JSON.stringify(sparklineData),
            is_premium: isPremium,
            round: player.round || "R1",
          };

          // Insert into AI analysis table
          const { error: insertError } = await serviceClient
            .from(`ai_${sport}_analysis`)
            .insert([analysisRecord]);

          if (insertError) {
            throw insertError;
          }

          // Mark job as done
          await serviceClient
            .from('ai_analysis_queue')
            .update({ 
              status: 'done', 
              completed_at: new Date().toISOString()
            })
            .eq('id', job.id);

          successCount++;
          console.log(`Processed job ${job.id} successfully (${sport} - ${playerName})`);

        } catch (jobError: any) {
          console.error(`Error processing job ${job.id}:`, jobError);
          
          // Mark job as failed
          await serviceClient
            .from('ai_analysis_queue')
            .update({ 
              status: 'failed',
              error_message: jobError.message,
              completed_at: new Date().toISOString()
            })
            .eq('id', job.id);

          failCount++;
        }
      }
    }

    const duration = (new Date().getTime() - startTime.getTime()) / 1000;
    console.log(`Queue processing complete: ${successCount} succeeded, ${failCount} failed in ${duration}s`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Processed ${successCount + failCount} jobs`,
        succeeded: successCount,
        failed: failCount,
        duration_seconds: duration
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("Error in process-ai-queue-v2:", error);
    
    return new Response(
      JSON.stringify({
        success: false,
        message: "Failed to process AI queue",
        error: error.message,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
