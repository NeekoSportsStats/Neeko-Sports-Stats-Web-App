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
    console.log("Computing team stats from player data...");

    const body = await req.json();
    const { sport } = body;

    // Create log entry
    const { data: logEntry, error: logError } = await serviceClient
      .from('sync_logs')
      .insert({
        operation: 'compute-team-stats',
        sport,
        status: 'running'
      })
      .select()
      .single();

    if (!logError) logId = logEntry?.id;

    if (!sport || !["afl", "nba", "epl"].includes(sport)) {
      throw new Error("Invalid sport specified");
    }

    // Get player stats
    const { data: playerStats, error: fetchError } = await serviceClient
      .from(`${sport}_player_stats`)
      .select("*");

    if (fetchError) {
      console.error(`Error fetching ${sport} player stats:`, fetchError);
      throw fetchError;
    }

    if (!playerStats || playerStats.length === 0) {
      console.log(`No player stats found for ${sport}`);
      return new Response(
        JSON.stringify({ success: true, message: `No ${sport} player stats to process` }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Group by team and round
    const teamStatsMap = new Map<string, any>();

    playerStats.forEach((player: any) => {
      // Get the correct team field for each sport
      let team;
      if (sport === "afl") {
        team = player.team;
      } else if (sport === "nba") {
        team = player.team_name;
      } else if (sport === "epl") {
        team = player.team_name;
      }
      
      // Skip players without a team
      if (!team) return;
      
      const round = player.round || "R1";
      const key = `${team}_${round}`;

      if (!teamStatsMap.has(key)) {
        teamStatsMap.set(key, {
          team,
          round,
          player_count: 0,
          games_played: 1,
        });

        // Initialize sport-specific stats
        if (sport === "afl") {
          Object.assign(teamStatsMap.get(key), {
            total_disposals: 0,
            total_goals: 0,
            total_behinds: 0,
            total_marks: 0,
            total_tackles: 0,
            total_hitouts: 0,
            total_fantasy_points: 0,
          });
        } else if (sport === "nba") {
          Object.assign(teamStatsMap.get(key), {
            total_points: 0,
            total_rebounds: 0,
            total_assists: 0,
            total_steals: 0,
            total_blocks: 0,
          });
        } else if (sport === "epl") {
          Object.assign(teamStatsMap.get(key), {
            total_goals: 0,
            total_assists: 0,
            total_shots: 0,
            total_passes: 0,
            total_tackles: 0,
          });
        }
      }

      const teamData = teamStatsMap.get(key);
      teamData.player_count++;

      // Aggregate sport-specific stats
      if (sport === "afl") {
        teamData.total_disposals += player.disposals || 0;
        teamData.total_goals += player.goals || 0;
        teamData.total_behinds += player.behinds || 0;
        teamData.total_marks += player.marks || 0;
        teamData.total_tackles += player.tackles || 0;
        teamData.total_hitouts += player.hitouts || 0;
        teamData.total_fantasy_points += player.fantasy_points || 0;
      } else if (sport === "nba") {
        teamData.total_points += player.points || 0;
        teamData.total_rebounds += player.totreb || 0;
        teamData.total_assists += player.assists || 0;
        teamData.total_steals += player.steals || 0;
        teamData.total_blocks += player.blocks || 0;
      } else if (sport === "epl") {
        teamData.total_goals += player.goals_total || 0;
        teamData.total_assists += player.goals_assists || 0;
        teamData.total_shots += player.shots_total || 0;
        teamData.total_passes += player.passes_total || 0;
        teamData.total_tackles += player.tackles_total || 0;
      }
    });

    // Calculate averages
    const teamStatsArray = Array.from(teamStatsMap.values()).map((team: any) => {
      const playerCount = team.player_count || 1;
      
      if (sport === "afl") {
        team.avg_disposals = team.total_disposals / playerCount;
        team.avg_goals = team.total_goals / playerCount;
        team.avg_fantasy_points = team.total_fantasy_points / playerCount;
      } else if (sport === "nba") {
        team.avg_points = team.total_points / playerCount;
        team.avg_rebounds = team.total_rebounds / playerCount;
        team.avg_assists = team.total_assists / playerCount;
      } else if (sport === "epl") {
        team.avg_goals = team.total_goals / playerCount;
        team.avg_passes = team.total_passes / playerCount;
        team.avg_shots = team.total_shots / playerCount;
      }

      team.updated_at = new Date().toISOString();
      return team;
    });

    console.log(`Computed ${teamStatsArray.length} team stat records for ${sport}`);

    // Clear existing team stats
    const { error: deleteError } = await serviceClient
      .from(`${sport}_team_stats`)
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000");

    if (deleteError) {
      console.error(`Error clearing ${sport} team stats:`, deleteError);
      throw deleteError;
    }

    // Insert new team stats
    const { error: insertError } = await serviceClient
      .from(`${sport}_team_stats`)
      .insert(teamStatsArray);

    if (insertError) {
      console.error(`Error inserting ${sport} team stats:`, insertError);
      throw insertError;
    }

    console.log(`${sport} team stats computed successfully`);

    const duration = (new Date().getTime() - startTime.getTime()) / 1000;

    // Update log entry
    if (logId) {
      await serviceClient
        .from('sync_logs')
        .update({
          status: 'success',
          completed_at: new Date().toISOString(),
          records_processed: teamStatsArray.length,
          records_inserted: teamStatsArray.length,
          duration_seconds: duration
        })
        .eq('id', logId);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `${sport.toUpperCase()} team stats computed successfully`,
        records: teamStatsArray.length,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error in compute-team-stats:", error);
    
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
        message: "Failed to compute team stats",
        error: error.message,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
