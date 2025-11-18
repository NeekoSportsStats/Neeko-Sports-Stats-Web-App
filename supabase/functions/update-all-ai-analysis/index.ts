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
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Get the user making the request
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check if user is admin using the has_role function
    const { data: isAdmin, error: roleError } = await supabaseClient
      .rpc('has_role', { _user_id: user.id, _role: 'admin' });

    if (roleError || !isAdmin) {
      return new Response(JSON.stringify({ error: 'Forbidden: Admin access only' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check rate limiting - prevent refreshes within 5 minutes
    const { data: lastRefresh } = await supabaseClient
      .from('ai_insights_public')
      .select('updated_at')
      .order('updated_at', { ascending: false })
      .limit(1)
      .single();

    if (lastRefresh) {
      const cooldownMinutes = 5;
      const lastUpdate = new Date(lastRefresh.updated_at);
      const now = new Date();
      const minutesSinceUpdate = (now.getTime() - lastUpdate.getTime()) / 1000 / 60;

      if (minutesSinceUpdate < cooldownMinutes) {
        return new Response(
          JSON.stringify({ 
            error: `Please wait ${Math.ceil(cooldownMinutes - minutesSinceUpdate)} minutes before refreshing again`,
            nextRefreshAvailable: new Date(lastUpdate.getTime() + cooldownMinutes * 60000).toISOString()
          }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Check if refresh is already in progress
    const { data: lock } = await supabaseClient
      .from('system_locks')
      .select('locked, locked_by, locked_at')
      .eq('operation', 'ai_refresh')
      .maybeSingle();

    if (lock?.locked) {
      return new Response(
        JSON.stringify({ 
          error: 'Refresh already in progress',
          lockedBy: lock.locked_by,
          lockedAt: lock.locked_at
        }),
        { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Set lock
    await supabaseClient
      .from('system_locks')
      .upsert({
        operation: 'ai_refresh',
        locked: true,
        locked_by: user.id,
        locked_at: new Date().toISOString()
      });

    // Log admin action
    await supabaseClient
      .from('admin_audit_log')
      .insert({
        user_id: user.id,
        action: 'ai_insights_refresh',
        details: { timestamp: new Date().toISOString() }
      });

    const sports = ['AFL', 'NRL', 'EPL', 'NBA'];
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    // First, refresh AFL stats from Google Sheets
    console.log('Fetching latest AFL stats from Google Sheets...');
    try {
      const { error: fetchError } = await supabaseClient.functions.invoke('fetch-afl-stats');
      if (fetchError) {
        console.error('Error fetching AFL stats:', fetchError);
      } else {
        console.log('AFL stats refreshed successfully');
      }
    } catch (e) {
      console.error('Failed to invoke fetch-afl-stats:', e);
    }

    // Now update AI insights for all sports
    for (const sport of sports) {
      console.log(`Updating ${sport} insights...`);

      // Fetch latest stats for the sport
      let statsData = null;
      try {
        const { data: cachedStats } = await supabaseClient
          .from(`${sport.toLowerCase()}_stats_cache`)
          .select('data')
          .order('fetched_at', { ascending: false })
          .limit(1)
          .single();
        
        statsData = cachedStats?.data;
      } catch (e) {
        console.log(`No stats cache for ${sport}, continuing...`);
      }

      // Build consolidated prompt
      const systemPrompt = `You are an expert ${sport} analyst. Generate insights based on the latest player and team statistics.
      
Return insights in the following JSON format:
{
  "topInsights": [
    {"title": "string", "description": "string", "category": "string"}
  ],
  "freeInsights": [
    {"title": "string", "description": "string", "category": "string"}
  ],
  "premiumInsights": [
    {"title": "string", "description": "string", "category": "string"}
  ]
}

Guidelines:
- Top Insights: 4-7 most important findings
- Free Insights: 7 actionable insights for fantasy coaches
- Premium Insights: 13 advanced insights with detailed analysis
- All insights must be specific, actionable, and data-driven`;

      const userPrompt = `Analyze the following ${sport} statistics and generate comprehensive insights:\n\n${JSON.stringify(statsData || 'No data available - generate sample insights')}`;

      // Call Lovable AI
      const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${LOVABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
        }),
      });

      if (!aiResponse.ok) {
        console.error(`AI API error for ${sport}:`, aiResponse.status);
        continue;
      }

      const aiData = await aiResponse.json();
      const content = aiData.choices?.[0]?.message?.content;

      // Parse the JSON response - strip markdown code blocks if present
      let insights = {
        topInsights: [],
        freeInsights: [],
        premiumInsights: []
      };

      try {
        // Remove markdown code blocks if present
        let jsonContent = content.trim();
        if (jsonContent.startsWith('```json')) {
          jsonContent = jsonContent.replace(/```json\s*/g, '').replace(/```\s*$/g, '');
        } else if (jsonContent.startsWith('```')) {
          jsonContent = jsonContent.replace(/```\s*/g, '');
        }
        
        insights = JSON.parse(jsonContent);
      } catch (e) {
        console.error(`Failed to parse AI response for ${sport}:`, e);
        console.error('Raw content:', content);
        continue;
      }

      // Save public insights (top + free)
      const { error: publicError } = await supabaseClient
        .from('ai_insights_public')
        .upsert({
          sport: sport,
          top_insights: insights.topInsights,
          free_insights: insights.freeInsights,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'sport'
        });

      // Save premium insights separately
      const { error: premiumError } = await supabaseClient
        .from('ai_insights_premium')
        .upsert({
          sport: sport,
          premium_insights: insights.premiumInsights,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'sport'
        });

      if (publicError || premiumError) {
        console.error(`Error saving ${sport} insights:`, publicError || premiumError);
      } else {
        console.log(`${sport} insights updated successfully`);
      }
    }

    // Release lock
    await supabaseClient
      .from('system_locks')
      .upsert({
        operation: 'ai_refresh',
        locked: false,
        locked_by: null,
        locked_at: null
      });

    return new Response(
      JSON.stringify({ message: 'All sports updated successfully' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in update-all-ai-analysis:', error);
    
    // Release lock on error
    try {
      const supabaseClient = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_ANON_KEY') ?? ''
      );
      await supabaseClient
        .from('system_locks')
        .upsert({
          operation: 'ai_refresh',
          locked: false,
          locked_by: null,
          locked_at: null
        });
    } catch (e) {
      console.error('Failed to release lock:', e);
    }
    
    return new Response(
      JSON.stringify({ error: 'An error occurred processing your request' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});