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
    console.log("Processing AI jobs queue...");

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY not configured");
    }

    // Fetch up to 50 pending jobs
    const { data: pendingJobs, error: fetchError } = await serviceClient
      .from('ai_jobs_queue')
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

    for (const job of pendingJobs) {
      try {
        // Mark as processing
        await serviceClient
          .from('ai_jobs_queue')
          .update({ status: 'processing', updated_at: new Date().toISOString() })
          .eq('id', job.id);

        const player = job.player_data;
        const sport = job.sport;
        const blockType = job.block_type;
        const blockTitle = job.block_title;

        // Determine if premium (jobs beyond first 4 per block are premium)
        const isPremium = true; // Queue jobs are always premium (beyond first 4)

        // Generate AI explanation
        const prompt = `Analyze this ${sport.toUpperCase()} player's performance in 1-2 sentences:
Player: ${player.player || player.player_name || `${player.player_firstname} ${player.player_lastname}` || "Unknown"}
Team: ${player.team || player.team_name || "Unknown"}
Stats: ${JSON.stringify(player)}
Context: This is for the "${blockTitle}" category.`;

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

        // Determine rank based on existing records in this block
        const { data: existingRecords } = await serviceClient
          .from(`ai_${sport}_analysis`)
          .select('rank')
          .eq('block_type', blockType)
          .order('rank', { ascending: false })
          .limit(1);

        const nextRank = existingRecords && existingRecords.length > 0 
          ? existingRecords[0].rank + 1 
          : 1;

        const analysisRecord = {
          block_title: blockTitle,
          block_type: blockType,
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
          .from('ai_jobs_queue')
          .update({ 
            status: 'done', 
            processed_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', job.id);

        successCount++;
        console.log(`Processed job ${job.id} successfully`);

      } catch (jobError: any) {
        console.error(`Error processing job ${job.id}:`, jobError);
        
        // Mark job as failed
        await serviceClient
          .from('ai_jobs_queue')
          .update({ 
            status: 'failed',
            error_message: jobError.message,
            updated_at: new Date().toISOString()
          })
          .eq('id', job.id);

        failCount++;
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
    console.error("Error in process-ai-queue:", error);
    
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
