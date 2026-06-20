/**
 * Leaderboard dialog — top 50 scores from Supabase.
 * Built with LayaAir Dialog primitives from existing atlases.
 */

import { supabase } from './supabase';
import { getSkin } from './skin';

interface LeaderboardEntry {
  name: string;
  score: number;
  combo: number;
  coins: number;
  skin: string;
}

let _dialog: any = null;
let _entries: LeaderboardEntry[] = [];
let _loading = false;

export function openLeaderboard(): void {
  if (_dialog) {
    _dialog.close();
    _dialog = null;
  }

  const Dialog: any = laya.ui.Dialog;
  const dialog: any = new Dialog();
  dialog.width = 750;
  dialog.height = 1334;
  _dialog = dialog;

  const backdrop: any = new laya.ui.Image();
  backdrop.skin = 'settle/bg_revive.png';
  backdrop.width = 750;
  backdrop.height = 1334;
  dialog.addChild(backdrop);

  const title: any = new laya.ui.Label();
  title.text = 'Leaderboard';
  title.fontSize = 48;
  title.color = '#ffffff';
  title.align = 'center';
  title.width = 750;
  title.y = 40;
  dialog.addChild(title);

  const statusLabel: any = new laya.ui.Label();
  statusLabel.text = 'Loading...';
  statusLabel.fontSize = 24;
  statusLabel.color = '#888';
  statusLabel.align = 'center';
  statusLabel.width = 750;
  statusLabel.y = 200;
  dialog.addChild(statusLabel);

  const closeBtn: any = new laya.ui.Button();
  closeBtn.skin = 'settle/btnEnd.png';
  closeBtn.centerX = 0;
  closeBtn.y = 1250;
  closeBtn.on('click', null, () => {
    dialog.close();
    _dialog = null;
  });
  dialog.addChild(closeBtn);

  // Footer — sign-in prompt or signed-in email
  const footer: any = new laya.ui.Label();
  footer.text = 'Sign in to save scores';
  footer.fontSize = 22;
  footer.color = '#60a5fa';
  footer.align = 'center';
  footer.width = 750;
  footer.y = 1150;
  footer.mouseEnabled = true;
  footer.on('click', null, async () => {
    const { data: session } = await supabase.auth.getSession();
    if (session.session) {
      await supabase.auth.signOut();
      footer.text = 'Sign in to save scores';
      footer.color = '#60a5fa';
      footer.fontSize = 22;
      return;
    }
    // Not signed in → email only
    const email = window.prompt('Enter your email for a magic link:');
    if (!email) return;
    footer.text = 'Sending...';
    footer.color = '#fff';
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.href },
    });
    if (error) {
      footer.text = error.message?.includes('rate') ? 'Too fast — wait a moment' : 'Error — try again';
      footer.color = '#e94560';
      setTimeout(() => { footer.text = 'Sign in to save scores'; footer.color = '#60a5fa'; }, 3000);
    } else {
      footer.text = `Magic link sent! Check ${email}`;
      footer.color = '#4ade80';
    }
  });
  dialog.addChild(footer);

  dialog.popup();

  // Update footer if already signed in; prompt for name if new user.
  // supabase.auth.getSession() reads from localStorage — no network request.
  supabase.auth.getSession().then(async ({ data }) => {
    if (data.session?.user) {
      const u = data.session.user;
      let display = u.user_metadata?.name;
      // Fetch profile name from DB (more reliable than metadata)
      const { data: profile } = await supabase
        .from('profiles')
        .select('name')
        .eq('id', u.id)
        .single();
      if (profile?.name && profile.name !== 'Player') {
        display = profile.name;
      }
      // New user — prompt for name once
      if (!display || display === 'Player') {
        const name = window.prompt('Welcome! Choose a display name:');
        if (name) {
          const { error: saveErr } = await supabase
            .from('profiles')
            .upsert({ id: u.id, name: name.slice(0, 24) });
          if (saveErr) console.warn('[leaderboard] name save failed:', saveErr);
          display = name;
        }
      }
      footer.text = `${display || 'Player'} (tap to sign out)`;
      footer.color = '#4ade80';
      footer.fontSize = 18;
    }
  });

  // Fetch scores
  if (!_loading && _entries.length === 0) {
    fetchScores(statusLabel);
  } else {
    renderRows(dialog, _entries);
    statusLabel.visible = false;
  }
}

// ── Fetch scores ────────────────────────────────────────────

async function fetchScores(statusLabel: any): Promise<void> {
  _loading = true;
  statusLabel.text = 'Loading...';

  try {
    const { data, error } = await supabase
      .from('scores')
      .select('score, combo, coins, skin, profiles(name)')
      .order('score', { ascending: false })
      .limit(20);

    if (error) throw error;

    _entries = (data || []).map((row: any) => ({
      name: row.profiles?.name || 'Player',
      score: row.score,
      combo: row.combo || 0,
      coins: row.coins || 0,
      skin: row.skin || 'default',
    }));

    if (_dialog) {
      statusLabel.visible = false;
      renderRows(_dialog, _entries);
    }
  } catch (err) {
    console.warn('[leaderboard] fetch failed:', err);
    statusLabel.text = 'Could not load leaderboard';
    statusLabel.color = '#e94560';
  } finally {
    _loading = false;
  }
}

// ── Render rows ─────────────────────────────────────────────

function renderRows(dialog: any, entries: LeaderboardEntry[]): void {
  if (entries.length === 0) return;

  const colSetup = [
    { x: 50, w: 60, align: 'left', label: '#' },
    { x: 120, w: 240, align: 'left', label: 'Name' },
    { x: 370, w: 100, align: 'right', label: 'Score' },
    { x: 480, w: 100, align: 'right', label: 'Combo' },
    { x: 590, w: 110, align: 'right', label: 'Coins' },
  ];

  const headerY = 110;
  colSetup.forEach((col) => {
    const lbl: any = new laya.ui.Label();
    lbl.text = col.label;
    lbl.fontSize = 22;
    lbl.color = '#aaa';
    lbl.align = col.align;
    lbl.width = col.w;
    lbl.x = col.x;
    lbl.y = headerY;
    dialog.addChild(lbl);
  });

  const div: any = new laya.ui.Image();
  div.skin = 'comp/blank.png';
  div.width = 660;
  div.height = 2;
  div.x = 45;
  div.y = headerY + 32;
  div.alpha = 0.3;
  dialog.addChild(div);

  const rowH = 48;
  const startY = headerY + 50;

  entries.forEach((entry, i) => {
    const rank = i + 1;
    const y = startY + i * rowH;
    const isTop = rank <= 3;

    if (isTop) {
      const rowBg: any = new laya.ui.Image();
      rowBg.skin = 'comp/blank.png';
      rowBg.width = 660;
      rowBg.height = rowH - 2;
      rowBg.x = 45;
      rowBg.y = y;
      rowBg.alpha = rank === 1 ? 0.15 : rank === 2 ? 0.1 : 0.06;
      dialog.addChild(rowBg);
    }

    const medal = rank === 1 ? '1st' : rank === 2 ? '2nd' : rank === 3 ? '3rd' : ` ${rank}`;
    const vals = [medal, entry.name, String(entry.score), `x${entry.combo}`, String(entry.coins)];

    vals.forEach((v, j) => {
      const col = colSetup[j];
      const lbl: any = new laya.ui.Label();
      lbl.text = v;
      lbl.fontSize = 26;
      if (isTop && j <= 1) lbl.color = '#FFD700';
      else if (j === 4) lbl.color = '#FFD700';
      else if (j >= 2) lbl.color = '#fff';
      else lbl.color = '#ddd';
      lbl.align = col.align;
      lbl.width = col.w;
      lbl.x = col.x;
      lbl.y = y;
      dialog.addChild(lbl);
    });
  });
}

// ── Submit score ────────────────────────────────────────────

export async function submitScoreToLeaderboard(
  score: number,
  combo: number,
  coins: number,
): Promise<void> {
  const { data: session } = await supabase.auth.getSession();
  if (!session.session) return;

  try {
    const { error } = await supabase.functions.invoke('submit-score', {
      body: {
        score: Math.round(score),
        combo: Math.round(combo),
        coins: Math.round(coins),
        skin: getSkin(),
      },
    });
    if (error) throw error;
    _entries = []; // refresh on next open
  } catch (err) {
    console.warn('[leaderboard] submit failed:', err);
  }
}
