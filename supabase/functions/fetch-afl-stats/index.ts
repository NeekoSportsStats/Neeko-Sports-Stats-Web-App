import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client for auth and database operations
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verify user authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      console.error('Authentication error:', userError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user has admin role
    const { data: isAdmin, error: roleError } = await supabase
      .rpc('has_role', { _user_id: user.id, _role: 'admin' });

    if (roleError) {
      console.error('Role check error:', roleError);
      return new Response(
        JSON.stringify({ error: 'Failed to verify permissions' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!isAdmin) {
      console.warn(`Non-admin user ${user.id} attempted to fetch AFL stats`);
      return new Response(
        JSON.stringify({ error: 'Forbidden: Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Admin user ${user.id} is fetching AFL stats`);

    // Get Google Sheets configuration from environment
    const SHEET_ID = Deno.env.get('AFL_SHEET_ID');
    const GID = Deno.env.get('AFL_SHEET_GID');

    if (!SHEET_ID || !GID) {
      console.error('Missing required environment variables: AFL_SHEET_ID or AFL_SHEET_GID');
      throw new Error('Server configuration error: Missing Google Sheets credentials');
    }

    const CSV_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=${GID}`;

    console.log('Fetching AFL stats from Google Sheets...');
    console.log('Sheet ID:', SHEET_ID);
    console.log('GID:', GID);
    console.log('URL:', CSV_URL);
    
    const response = await fetch(CSV_URL);
    console.log('Response status:', response.status);
    console.log('Response status text:', response.statusText);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Fetch failed. Response body:', errorText);
      throw new Error(`Failed to fetch sheet: ${response.statusText}. Sheet must be publicly accessible. Status: ${response.status}`);
    }

    const csvText = await response.text();
    const lines = csvText.split('\n');
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    
    console.log('Headers:', headers);

    // Parse CSV data - each row is a game
    const gameRecords = [];
    for (let i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue;
      
      const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
      const record: any = {};
      
      headers.forEach((header, index) => {
        const value = values[index];
        // Convert numeric values
        if (!isNaN(Number(value)) && value !== '') {
          record[header] = Number(value);
        } else {
          record[header] = value;
        }
      });
      
      gameRecords.push(record);
    }

    console.log(`Parsed ${gameRecords.length} game records`);

    // Pivot data: group by player and create columns for each stat+round
    const playerMap = new Map<string, any>();
    const statColumns = ['Fantasy Points', 'Super Coach Points', 'Disposals', 'Kicks', 'Handballs', 'Marks', 'Tackles', 'Goals'];
    
    gameRecords.forEach(record => {
      const playerName = record.player || record.Player;
      if (!playerName) return;

      if (!playerMap.has(playerName)) {
        playerMap.set(playerName, {
          Player: playerName,
          Position: record.Position,
          Team: record.Team,
        });
      }

      const player = playerMap.get(playerName);
      const roundLabel = record.Round_Display || record.Round || '';
      
      // Map round labels to simplified format
      let roundKey = '';
      if (roundLabel.includes('Opening')) {
        roundKey = 'Opening';
      } else if (roundLabel.includes('Round')) {
        const roundNum = roundLabel.match(/Round (\d+)/)?.[1];
        if (roundNum) roundKey = `R${roundNum}`;
      } else if (roundLabel.includes('Finals')) {
        const weekNum = roundLabel.match(/Week (\d+)/)?.[1];
        if (weekNum) roundKey = `FW${weekNum}`;
      }

      if (roundKey) {
        // Create columns for each stat type
        statColumns.forEach(statCol => {
          const value = record[statCol];
          if (value !== undefined && value !== null && value !== '') {
            // Shorten column names
            let shortStatName = statCol;
            if (statCol === 'Fantasy Points') shortStatName = 'Fantasy';
            else if (statCol === 'Super Coach Points') shortStatName = 'SuperCoach';
            
            const columnName = `${shortStatName}_${roundKey}`;
            player[columnName] = value;
          }
        });
      }
    });

    const players = Array.from(playerMap.values());
    console.log(`Pivoted into ${players.length} unique players`);

    // Build headers list
    const pivotHeaders = ['Player', 'Position', 'Team'];
    const roundKeys = new Set<string>();
    
    players.forEach(player => {
      Object.keys(player).forEach(key => {
        if (key.includes('_')) {
          const round = key.split('_')[1];
          roundKeys.add(round);
        }
      });
    });

    const sortedRounds = Array.from(roundKeys).sort((a, b) => {
      if (a === 'Opening') return -1;
      if (b === 'Opening') return 1;
      if (a.startsWith('R') && b.startsWith('R')) {
        return parseInt(a.substring(1)) - parseInt(b.substring(1));
      }
      if (a.startsWith('FW') && b.startsWith('FW')) {
        return parseInt(a.substring(2)) - parseInt(b.substring(2));
      }
      return a.localeCompare(b);
    });

    statColumns.forEach(statCol => {
      let shortStatName = statCol;
      if (statCol === 'Fantasy Points') shortStatName = 'Fantasy';
      else if (statCol === 'Super Coach Points') shortStatName = 'SuperCoach';
      
      sortedRounds.forEach(round => {
        pivotHeaders.push(`${shortStatName}_${round}`);
      });
    });

    console.log('Generated headers:', pivotHeaders);

    // Delete old cache and insert new data (supabase client already initialized)
    await supabase.from('afl_stats_cache').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    const { error: insertError } = await supabase
      .from('afl_stats_cache')
      .insert({ data: { players, headers: pivotHeaders, fetched_at: new Date().toISOString() } });

    if (insertError) {
      console.error('Cache insert error:', insertError);
    }

    return new Response(
      JSON.stringify({ players, headers: pivotHeaders }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in fetch-afl-stats:', error);
    return new Response(
      JSON.stringify({ error: 'An error occurred processing your request' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});