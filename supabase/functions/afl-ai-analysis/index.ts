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
    // Initialize Supabase client for authentication
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Verify user is authenticated
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Authentication required. Please log in to access AI analysis.' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user has premium subscription
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('is_premium')
      .eq('id', user.id)
      .single();

    if (!profile?.is_premium) {
      return new Response(
        JSON.stringify({ 
          error: 'Premium subscription required',
          message: 'Upgrade to Neeko+ to access AI-powered analysis.',
          upgradeUrl: '/premium'
        }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { type, query } = await req.json();

    // Validate input parameters
    const allowedTypes = ['player', 'team', 'matchup', 'predictive'];
    if (!allowedTypes.includes(type)) {
      return new Response(
        JSON.stringify({ error: 'Invalid analysis type' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!query || typeof query !== 'string' || query.length === 0 || query.length > 1000) {
      return new Response(
        JSON.stringify({ error: 'Query must be between 1 and 1000 characters' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Sanitize query to prevent prompt injection
    const sanitizedQuery = query
      .replace(/ignore\s+(previous|above|all)\s+instructions?/gi, '')
      .replace(/system\s+prompt/gi, '')
      .replace(/act\s+as|pretend\s+to\s+be/gi, '')
      .replace(/you\s+are\s+now/gi, '')
      .trim();

    if (sanitizedQuery.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Invalid query content' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'Service configuration error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('AFL AI Analysis request:', { type, query, userId: user.id });

    // Get AFL stats from cache using service role
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: cachedData } = await supabase
      .from('afl_stats_cache')
      .select('data')
      .order('fetched_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    let statsContext = "No AFL stats data available.";
    if (cachedData?.data) {
      const statsData = cachedData.data as { players: any[], headers: string[] };
      statsContext = `AFL Stats Summary: ${statsData.players.length} players tracked across ${statsData.headers.length} statistical columns.`;
    }

    // Build system prompt based on analysis type
    let systemPrompt = "";
    
    switch (type) {
      case "player":
        systemPrompt = `You are Neeko's AFL AI analyst specializing in player performance analysis. 
${statsContext}

Analyze the requested player's performance with focus on:
- Fantasy points trends and consistency
- Score percentage breakdowns (15+, 20+, 25+, 30+, 35+)
- Strengths and weaknesses
- Value assessment for fantasy teams
- Key statistical highlights

Keep your analysis clear, data-driven, and actionable. Use bullet points for readability.`;
        break;

      case "team":
        systemPrompt = `You are Neeko's AFL AI analyst specializing in team performance analysis.
${statsContext}

Analyze the requested team's overall performance with focus on:
- Team average scores and consistency
- Player depth and distribution
- Team strengths and weaknesses
- Best performers within the team
- Strategic insights for fantasy selection

Keep your analysis clear, data-driven, and actionable. Use bullet points for readability.`;
        break;

      case "matchup":
        systemPrompt = `You are Neeko's AFL AI analyst specializing in matchup analysis.
${statsContext}

Analyze the matchup dynamics between teams/players with focus on:
- Head-to-head performance patterns
- Key player advantages
- Strategic considerations
- Fantasy implications
- Historical trends

Keep your analysis clear, data-driven, and actionable. Use bullet points for readability.`;
        break;

      case "predictive":
        systemPrompt = `You are Neeko's AFL AI analyst specializing in predictive trend analysis.
${statsContext}

Provide predictive insights focusing on:
- Emerging performance trends
- Player form trajectories
- Potential breakout performers
- Risk assessments
- Strategic recommendations for upcoming rounds

Keep your analysis clear, data-driven, and actionable. Use bullet points for readability.`;
        break;

      default:
        systemPrompt = `You are Neeko's AFL AI analyst. Provide insightful AFL analysis based on available data.
${statsContext}

Keep your analysis clear, data-driven, and actionable.`;
    }

    console.log('Sending request to AI gateway with model: google/gemini-2.5-flash');
    console.log('Query:', query.substring(0, 100) + '...');
    
    const requestPayload = {
      model: "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: sanitizedQuery }
      ],
      temperature: 0.7,
      max_tokens: 2000
    };
    
    console.log('Request payload size:', JSON.stringify(requestPayload).length);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestPayload),
    });

    console.log('AI gateway response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error details:", {
        status: response.status,
        statusText: response.statusText,
        body: errorText.substring(0, 500)
      });
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits depleted. Please contact support." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      if (response.status === 500) {
        return new Response(
          JSON.stringify({ error: "AI service temporarily unavailable. Please try again in a few moments." }),
          { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      throw new Error(`AI gateway error: ${response.status} - ${errorText.substring(0, 200)}`);
    }

    const data = await response.json();
    const analysis = data.choices?.[0]?.message?.content || "No analysis generated.";

    console.log('Analysis generated successfully');

    return new Response(
      JSON.stringify({ analysis }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error('Error in afl-ai-analysis:', error);
    return new Response(
      JSON.stringify({ error: 'An error occurred processing your request' }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
