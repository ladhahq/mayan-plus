/**
 * Edge Function: manage-coins
 *
 * POST { action: 'add' | 'spend', amount: number }
 * Requires Authorization: Bearer <supabase_access_token>
 *
 * Server-side coin balance. All mutations go through here
 * when the user is authenticated. LocalStorage fallback for offline.
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
    return Response.json({ error: 'Sign in required' }, { status: 401 });
  }

  try {
    const { action, amount } = await req.json();

    if (!['add', 'spend'].includes(action)) {
      return Response.json({ error: 'Invalid action' }, { status: 400 });
    }
    if (typeof amount !== 'number' || amount < 1 || amount > 9999) {
      return Response.json({ error: 'Invalid amount' }, { status: 400 });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } },
    );

    // Get user ID from auth
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData.user?.id;
    if (!userId) return Response.json({ error: 'Not authenticated' }, { status: 401 });

    // Get current balance
    const { data: row, error: fetchErr } = await supabase
      .from('coins')
      .select('balance')
      .eq('user_id', userId)
      .single();

    if (fetchErr && fetchErr.code !== 'PGRST116') throw fetchErr;

    let balance = row?.balance ?? 3;

    if (action === 'add') {
      balance = Math.min(9999, balance + amount);
    } else {
      if (balance < amount) {
        return Response.json(
          { error: 'Insufficient coins', balance },
          { status: 402, headers: { 'Access-Control-Allow-Origin': '*' } },
        );
      }
      balance -= amount;
    }

    await supabase.from('coins').upsert({
      user_id: userId,
      balance,
      updated_at: new Date().toISOString(),
    });

    return Response.json({ balance }, {
      headers: { 'Access-Control-Allow-Origin': '*' },
    });
  } catch (err: any) {
    return Response.json(
      { error: err.message || 'Coin operation failed' },
      { status: 500, headers: { 'Access-Control-Allow-Origin': '*' } },
    );
  }
});
