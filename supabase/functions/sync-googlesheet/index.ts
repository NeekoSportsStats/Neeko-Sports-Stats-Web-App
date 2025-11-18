import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Tab configurations
const TAB_CONFIG = {
  afl_fixtures: {
    table: "afl_fixtures",
    columns: ["round", "date", "home_team", "away_team", "crowd", "result"],
  },
  afl_player_stats: {
    table: "afl_player_stats",
    columns: [
      "player", "position", "team", "opponent", "disposals", "kicks", "handballs",
      "marks", "tackles", "frees_for", "frees_against", "hitouts", "goals", "behinds",
      "ruck_contests", "center_bounce_attendance", "kick_ins", "kick_ins_play_on",
      "time_on_ground", "fantasy_points", "super_coach_points", "games_played",
      "round", "round_order", "round_label", "round_sort_label", "round_display"
    ],
  },
  epl_fixtures: {
    table: "epl_fixtures",
    columns: ["fixture_id", "date_edst", "time_edst", "status", "season", "round", "home_team_id", "home_team", "away_team_id", "away_team", "processed"],
  },
  epl_player_stats: {
    table: "epl_player_stats",
    columns: [
      "fixture_id", "team_id", "team_name", "team_logo", "player_id", "player_name",
      "player_number", "player_pos", "player_grid", "minutes", "rating", "shots_total",
      "shots_on", "goals_total", "goals_conceded", "goals_assists", "goals_saves",
      "passes_total", "passes_key", "passes_accuracy", "tackles_total", "tackles_blocks",
      "tackles_interceptions", "duels_total", "duels_won", "dribbles_attempts",
      "dribbles_success", "fouls_drawn", "fouls_committed", "cards_yellow", "cards_red",
      "penalty_won", "penalty_committed", "penalty_scored", "penalty_missed", "penalty_saved",
      "json_raw", "column_1"
    ],
  },
  nba_fixtures: {
    table: "nba_fixtures",
    columns: ["game_id", "date_edst", "time_edst", "status", "season", "stage", "home_team_id", "home_team_name", "away_team_id", "away_team_name", "column_1"],
  },
  nba_player_stats: {
    table: "nba_player_stats",
    columns: [
      "game_id", "player_id", "player_firstname", "player_lastname", "team_id", "team_name",
      "team_nickname", "team_code", "team_logo", "game_ref_id", "points", "pos", "min",
      "fgm", "fga", "fgp", "ftm", "fta", "ftp", "tpm", "tpa", "tpp", "offreb", "defreb",
      "totreb", "assists", "pfouls", "steals", "turnovers", "blocks", "plusminus", "comment", "raw_json"
    ],
  },
};

const parseCSV = (csvText: string, allowedColumns?: string[]) => {
  const lines = csvText.split("\n").filter(line => line.trim());
  const headers = lines[0].split(",")
    .map(h => h.trim().toLowerCase().replace(/"/g, '').replace(/\s+/g, '_'))
    .filter(h => h && h !== ''); // Filter out empty headers
  
  const records = [];
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g)?.map(v => v.replace(/^"|"$/g, '').trim()) || [];
    if (values.length < 2) continue;
    
    const record: any = {};
    headers.forEach((header, idx) => {
      // Skip if column not in allowed list
      if (allowedColumns && !allowedColumns.includes(header)) return;
      
      const value = values[idx] || '';
      
      // Handle empty values - set to null for all types
      if (value === '' || value === null || value === undefined) {
        record[header] = null;
        return;
      }
      
      // Parse numeric values
      if (/^-?\d+$/.test(value)) {
        record[header] = parseInt(value);
      } else if (/^-?\d+\.\d+$/.test(value)) {
        record[header] = parseFloat(value);
      } else if (value.toLowerCase() === 'true') {
        record[header] = true;
      } else if (value.toLowerCase() === 'false') {
        record[header] = false;
      } else {
        record[header] = value;
      }
    });
    
    record.updated_at = new Date().toISOString();
    records.push(record);
  }
  
  return records;
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
  let userId: string | undefined;

  try {
    console.log("Starting Google Sheet sync...");

    // Verify admin authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
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

    userId = user.id;

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

    const sheetId = Deno.env.get("SPORTS_SHEET_ID");
    
    if (!sheetId) {
      throw new Error("SPORTS_SHEET_ID not configured");
    }

    const body = await req.json();
    const { trigger } = body;

    if (trigger !== "manual_sync") {
      return new Response(
        JSON.stringify({ error: "Invalid trigger" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create log entry
    const { data: logEntry, error: logError } = await serviceClient
      .from('sync_logs')
      .insert({
        operation: 'sync-googlesheet',
        status: 'running',
        triggered_by: userId,
        metadata: { trigger }
      })
      .select()
      .single();

    if (logError) console.error("Failed to create log entry:", logError);
    logId = logEntry?.id;

    const results: any = {};
    const errors: any = {};

    // Sync all tabs
    for (const [tabName, config] of Object.entries(TAB_CONFIG)) {
      try {
        const sheetTabName = tabName.replace(/_/g, '_').split('_').map((word, idx) => 
          idx === 0 ? word.toUpperCase() : word.charAt(0).toUpperCase() + word.slice(1)
        ).join('_');
        
        const sheetUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&sheet=${sheetTabName}`;
        console.log(`Fetching ${sheetTabName} from:`, sheetUrl);
        
        const response = await fetch(sheetUrl);
        if (!response.ok) {
          throw new Error(`Failed to fetch sheet: ${response.statusText}`);
        }

        const csvText = await response.text();
        const records = parseCSV(csvText, config.columns);

        if (records.length === 0) {
          console.log(`No records found in ${sheetTabName}`);
          results[tabName] = { synced: 0 };
          continue;
        }

        // Clear existing data
        const { error: deleteError } = await serviceClient
          .from(config.table)
          .delete()
          .neq("id", "00000000-0000-0000-0000-000000000000");

        if (deleteError) {
          console.error(`Error clearing ${config.table}:`, deleteError);
          throw deleteError;
        }

        // Insert in batches to avoid CPU timeout
        const BATCH_SIZE = 500;
        let insertedCount = 0;
        
        for (let i = 0; i < records.length; i += BATCH_SIZE) {
          const batch = records.slice(i, i + BATCH_SIZE);
          const { error: insertError } = await serviceClient
            .from(config.table)
            .insert(batch);

          if (insertError) {
            console.error(`Error inserting batch into ${config.table}:`, insertError);
            throw insertError;
          }
          
          insertedCount += batch.length;
          console.log(`${config.table}: ${insertedCount}/${records.length} records inserted...`);
        }

        console.log(`${config.table}: ${records.length} records synced`);
        results[tabName] = { synced: records.length };
      } catch (error: any) {
        console.error(`Error syncing ${tabName}:`, error);
        errors[tabName] = error.message;
      }
    }

    const hasErrors = Object.keys(errors).length > 0;
    const totalRecords = Object.values(results).reduce((sum: number, r: any) => sum + (r.synced || 0), 0);
    const duration = (new Date().getTime() - startTime.getTime()) / 1000;

    // Update log entry with success
    if (logId) {
      await serviceClient
        .from('sync_logs')
        .update({
          status: hasErrors ? 'completed_with_errors' : 'success',
          completed_at: new Date().toISOString(),
          records_processed: totalRecords,
          records_inserted: totalRecords,
          duration_seconds: duration,
          error_message: hasErrors ? JSON.stringify(errors) : null,
          metadata: { trigger, results, errors }
        })
        .eq('id', logId);
    }

    return new Response(
      JSON.stringify({ 
        success: !hasErrors,
        message: hasErrors ? "Sync completed with errors" : "All stats synced successfully",
        results,
        errors: hasErrors ? errors : undefined
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error in sync-googlesheet:", error);
    
    // Update log entry with failure
    if (logId) {
      const duration = (new Date().getTime() - startTime.getTime()) / 1000;
      await serviceClient
        .from('sync_logs')
        .update({
          status: 'failed',
          completed_at: new Date().toISOString(),
          error_message: error?.message || "Unknown error",
          error_details: { stack: error?.stack, details: error },
          duration_seconds: duration
        })
        .eq('id', logId);
    }
    
    return new Response(
      JSON.stringify({ 
        success: false,
        message: "Sync failed",
        details: error?.message || "Unknown error"
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});