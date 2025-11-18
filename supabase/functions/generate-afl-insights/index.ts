import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PlayerStats {
  Player: string;
  Team: string;
  Position: string;
  [key: string]: any;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    
    if (!lovableApiKey) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    // Initialize Supabase client for auth
    const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2');
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

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
      console.warn(`Non-admin user ${user.id} attempted to generate AFL insights`);
      return new Response(
        JSON.stringify({ error: 'Forbidden: Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Admin user ${user.id} is generating AFL insights`);

    // Fetch AFL stats from cache using REST API
    const cacheResponse = await fetch(
      `${supabaseUrl}/rest/v1/afl_stats_cache?select=data&order=fetched_at.desc&limit=1`,
      {
        headers: {
          'apikey': Deno.env.get('SUPABASE_ANON_KEY')!,
          'Content-Type': 'application/json',
        }
      }
    );

    if (!cacheResponse.ok) {
      throw new Error('Failed to fetch AFL stats from cache');
    }

    const cacheData = await cacheResponse.json();
    if (!cacheData || cacheData.length === 0) {
      throw new Error('No cached data available');
    }

    const statsData = cacheData[0].data as { players: PlayerStats[], headers: string[] };
    
    console.log(`Analyzing ${statsData.players.length} players`);
    
    // Analyze top performers for Fantasy scores
    const playersWithFantasy = statsData.players
      .map(p => {
        const fantasyRounds = statsData.headers
          .filter(h => h.startsWith('Fantasy_R'))
          .map(h => p[h])
          .filter(v => typeof v === 'number' && !isNaN(v));
        
        const avg = fantasyRounds.length > 0 
          ? fantasyRounds.reduce((sum: number, val: number) => sum + val, 0) / fantasyRounds.length 
          : 0;
        
        const recent3 = fantasyRounds.slice(-3);
        const earlier3 = fantasyRounds.slice(-6, -3);
        const recentAvg = recent3.length > 0 ? recent3.reduce((sum: number, val: number) => sum + val, 0) / recent3.length : 0;
        const earlierAvg = earlier3.length > 0 ? earlier3.reduce((sum: number, val: number) => sum + val, 0) / earlier3.length : 0;
        const formChange = earlierAvg > 0 ? ((recentAvg - earlierAvg) / earlierAvg) * 100 : 0;
        
        return { 
          player: p.Player, 
          team: p.Team, 
          position: p.Position,
          avg, 
          formChange,
          recentAvg
        };
      })
      .filter(p => p.avg > 0);

    const topHot = playersWithFantasy
      .filter(p => p.formChange > 0)
      .sort((a, b) => b.formChange - a.formChange)
      .slice(0, 10);

    const topCold = playersWithFantasy
      .filter(p => p.formChange < 0)
      .sort((a, b) => a.formChange - b.formChange)
      .slice(0, 10);

    const topPerformers = playersWithFantasy
      .sort((a, b) => b.avg - a.avg)
      .slice(0, 10);

    // Create summary for AI
    const summary = `
Analyze the following AFL Fantasy statistics and provide 4-5 actionable insights:

Top 10 Hot Players (improving form over last 3 rounds):
${topHot.map(p => `- ${p.player} (${p.team}, ${p.position}): +${p.formChange.toFixed(1)}% form improvement, averaging ${p.recentAvg.toFixed(1)} fantasy points`).join('\n')}

Top 10 Cold Players (declining form):
${topCold.map(p => `- ${p.player} (${p.team}, ${p.position}): ${p.formChange.toFixed(1)}% form decline, recent avg ${p.recentAvg.toFixed(1)}`).join('\n')}

Top 10 Overall Performers (season average):
${topPerformers.map(p => `- ${p.player} (${p.team}, ${p.position}): ${p.avg.toFixed(1)} fantasy points/game`).join('\n')}

Provide insights in this format:
1. Key trend or pattern
2. Breakout player to watch
3. Warning sign or concern
4. Strategic recommendation

Keep each insight to 1-2 sentences. Be specific with player names and stats.
`;

    console.log('Calling Lovable AI for insights');

    // Generate free insights (7 basic insights)
    const freeInsightsPrompt = `Based on AFL Fantasy data, generate 7 brief insights for free users. Format as JSON array with objects having: category, title, description, example.

Top Hot Players: ${topHot.slice(0, 3).map(p => `${p.player} (${p.team}): +${p.formChange.toFixed(1)}%`).join(', ')}
Top Performers: ${topPerformers.slice(0, 3).map(p => `${p.player}: ${p.avg.toFixed(1)} pts`).join(', ')}

Categories to cover: Top Performers, Rising Stars, Form Guide, Position Analysis, Team Trends, Budget Picks, Captain Choices`;

    const freeResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { 
            role: 'system', 
            content: 'You are an AFL fantasy analyst. Return ONLY valid JSON array. Each insight must have category, title, description (1-2 sentences), and example (specific player/stat).' 
          },
          { role: 'user', content: freeInsightsPrompt }
        ],
      }),
    });

    if (!freeResponse.ok) {
      throw new Error(`AI API error: ${freeResponse.status}`);
    }

    const freeData = await freeResponse.json();
    const freeInsightsText = freeData.choices[0].message.content;
    
    // Parse free insights with error handling
    let freeInsights;
    try {
      const cleanedFreeText = freeInsightsText
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();
      
      freeInsights = JSON.parse(cleanedFreeText);
      
      if (!Array.isArray(freeInsights)) {
        throw new Error('Expected array of free insights');
      }
      
      console.log(`Successfully parsed ${freeInsights.length} free insights`);
    } catch (parseError) {
      console.error('Failed to parse free insights:', parseError);
      console.error('Raw free insights response (first 500 chars):', freeInsightsText.substring(0, 500));
      
      return new Response(
        JSON.stringify({ 
          error: 'Failed to generate insights',
          details: 'AI response was malformed while generating free insights'
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate premium insights (13 advanced insights)
    const premiumInsightsPrompt = `Based on AFL Fantasy data, generate 13 detailed insights for premium users. Format as JSON array with objects having: category, title, description, example.

All Data:
Top Hot: ${topHot.map(p => `${p.player} (${p.position}): +${p.formChange.toFixed(1)}%`).join(', ')}
Top Cold: ${topCold.map(p => `${p.player}: ${p.formChange.toFixed(1)}%`).join(', ')}
Top Overall: ${topPerformers.map(p => `${p.player}: ${p.avg.toFixed(1)}`).join(', ')}

Categories: Breakout Players, Injury Concerns, Value Plays, Differential Picks, Consistency Rankings, Matchup Analysis, Trade Targets, Hold/Sell Decisions, Captaincy Rankings, Rookie Watch, DPP Opportunities, Stack Strategies, Premium Picks`;

    const premiumResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { 
            role: 'system', 
            content: 'You are an AFL fantasy analyst. Return ONLY valid JSON array. Each insight must have category, title, description (2-3 sentences with data), and example (specific stats/recommendations).' 
          },
          { role: 'user', content: premiumInsightsPrompt }
        ],
      }),
    });

    if (!premiumResponse.ok) {
      throw new Error(`AI API error: ${premiumResponse.status}`);
    }

    const premiumData = await premiumResponse.json();
    const premiumInsightsText = premiumData.choices[0].message.content;
    
    // Parse premium insights with error handling
    let premiumInsights;
    try {
      const cleanedPremiumText = premiumInsightsText
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();
      
      premiumInsights = JSON.parse(cleanedPremiumText);
      
      if (!Array.isArray(premiumInsights)) {
        throw new Error('Expected array of premium insights');
      }
      
      console.log(`Successfully parsed ${premiumInsights.length} premium insights`);
    } catch (parseError) {
      console.error('Failed to parse premium insights:', parseError);
      console.error('Raw premium insights response (first 500 chars):', premiumInsightsText.substring(0, 500));
      
      // We have free insights, so return partial success
      console.warn('Returning free insights only due to premium parsing failure');
      return new Response(
        JSON.stringify({ 
          freeInsights,
          premiumInsights: [], // Empty array as fallback
          totalPlayers: statsData.players.length,
          warning: 'Premium insights could not be generated'
        }), 
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('Successfully generated AI insights');

    // Store insights in cache using service role
    const serviceClient = createClient(supabaseUrl, supabaseServiceKey);
    
    const { error: cacheError } = await serviceClient
      .from('afl_ai_insights_cache')
      .insert({
        free_insights: freeInsights,
        premium_insights: premiumInsights,
        total_players: statsData.players.length
      });

    if (cacheError) {
      console.error('Failed to cache insights:', cacheError);
      // Don't fail the request, just log the error
    } else {
      console.log('Insights cached successfully');
    }

    return new Response(
      JSON.stringify({ 
        freeInsights,
        premiumInsights,
        totalPlayers: statsData.players.length
      }), 
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error generating AFL insights:', error);
    return new Response(
      JSON.stringify({ error: 'An error occurred processing your request' }), 
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
