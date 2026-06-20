/**
 * Edge Function: submit-score
 *
 * POST { score: number, combo: number, skin: string }
 * Requires Authorization: Bearer <supabase_access_token>
 *
 * Uses the built-in submit_score() RPC function.
 * Anti-tampering: scores are accepted only for the authenticated user.
 * The database keeps only the best score per user (upsert).
 */

import { createClient } from 'jsr:@supabase/supabase-js@2';

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-client-info, apikey',
      },
    });
  }

  if (req.method !== 'POST') {
    return Response.json({ error: 'Method not allowed' }, { status: 405 });
  }

  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return Response.json({ error: 'Sign in to submit scores' }, { status: 401 });
  }

  try {
    const { score, combo, coins, skin } = await req.json();

    if (!score || typeof score !== 'number' || score < 1 || score > 999999) {
      return Response.json({ error: 'Invalid score' }, { status: 400 });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } },
    );

    const { data, error } = await supabase.rpc('submit_score', {
      p_score: Math.round(score),
      p_combo: Math.round(combo || 0),
      p_coins: Math.round(coins || 0),
      p_skin: (skin || 'default').slice(0, 20),
    });

    if (error) throw error;

    return Response.json(data, {
      headers: { 'Access-Control-Allow-Origin': '*' },
    });
  } catch (err: any) {
    return Response.json(
      { error: err.message || 'Submission failed' },
      { status: 500, headers: { 'Access-Control-Allow-Origin': '*' } },
    );
  }
});
