/**
 * Leaderboard dialog — shows top scores, opened via the rank button.
 * Built with LayaAir Dialog primitives from existing atlases.
 * Currently shows mock data; Supabase backend coming later.
 */

// Placeholder data until Supabase is wired
const MOCK_ENTRIES = [
  { rank: 1, name: 'Toffee', score: 2847, combo: 28, coins: 12 },
  { rank: 2, name: 'Pebble', score: 2301, combo: 19, coins: 45 },
  { rank: 3, name: 'Classic', score: 1944, combo: 24, coins: 8 },
  { rank: 4, name: 'Pebble', score: 1650, combo: 15, coins: 22 },
  { rank: 5, name: 'Toffee', score: 1432, combo: 12, coins: 3 },
  { rank: 6, name: 'Classic', score: 1200, combo: 10, coins: 30 },
  { rank: 7, name: 'Toffee', score: 980, combo: 8, coins: 15 },
  { rank: 8, name: 'Pebble', score: 854, combo: 7, coins: 5 },
  { rank: 9, name: 'Classic', score: 720, combo: 6, coins: 18 },
  { rank: 10, name: 'Pebble', score: 610, combo: 5, coins: 2 },
];

let _dialog: any = null;

export function openLeaderboard(): void {
  if (_dialog) {
    _dialog.close();
    _dialog = null;
  }

  const Dialog: any = laya.ui.Dialog;
  const dialog: any = new Dialog();
  dialog.width = 750;
  dialog.height = 1334;

  // ── Dark backdrop behind content ────────────────────────
  const backdrop: any = new laya.ui.Image();
  backdrop.skin = 'settle/bg_revive.png';
  backdrop.width = 750;
  backdrop.height = 1334;
  dialog.addChild(backdrop);

  // ── Title ───────────────────────────────────────────────
  const title: any = new laya.ui.Label();
  title.text = 'Leaderboard';
  title.fontSize = 48;
  title.color = '#ffffff';
  title.align = 'center';
  title.width = 750;
  title.y = 40;
  dialog.addChild(title);

  // ── Column layout ───────────────────────────────────────
  // Canvas 750px. 5 columns: Rank, Name, Score, Combo, Coins
  const colSetup = [
    { x: 50, w: 60, align: 'left',  label: '#' },
    { x: 120,w: 240,align: 'left',  label: 'Name' },
    { x: 370,w: 100,align: 'right', label: 'Score' },
    { x: 480,w: 100,align: 'right', label: 'Combo' },
    { x: 590,w: 110,align: 'right', label: 'Coins' },
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

  // ── Divider ─────────────────────────────────────────────
  const div: any = new laya.ui.Image();
  div.skin = 'comp/blank.png';
  div.width = 660;
  div.height = 2;
  div.x = 45;
  div.y = headerY + 32;
  div.alpha = 0.3;
  dialog.addChild(div);

  // ── Rows ────────────────────────────────────────────────
  const rowH = 48;
  const startY = headerY + 50;

  MOCK_ENTRIES.forEach((entry, i) => {
    const y = startY + i * rowH;
    const isTop = entry.rank <= 3;

    // Highlight background for top 3
    if (isTop) {
      const rowBg: any = new laya.ui.Image();
      rowBg.skin = 'comp/blank.png';
      rowBg.width = 660;
      rowBg.height = rowH - 2;
      rowBg.x = 45;
      rowBg.y = y;
      rowBg.alpha = entry.rank === 1 ? 0.15 : entry.rank === 2 ? 0.1 : 0.06;
      dialog.addChild(rowBg);
    }

    const medal = entry.rank === 1 ? '1st' : entry.rank === 2 ? '2nd' : entry.rank === 3 ? '3rd' : ` ${entry.rank}`;
    const vals = [medal, entry.name, String(entry.score), `x${entry.combo}`, String(entry.coins)];

    vals.forEach((v, j) => {
      const col = colSetup[j];
      const lbl: any = new laya.ui.Label();
      lbl.text = v;
      lbl.fontSize = 26;
      lbl.color = isTop && j <= 1 ? '#FFD700' : j === 4 ? '#FFD700' : j >= 2 ? '#fff' : '#ddd';
      lbl.align = col.align;
      lbl.width = col.w;
      lbl.x = col.x;
      lbl.y = y;
      dialog.addChild(lbl);
    });
  });

  // ── Footer note ─────────────────────────────────────────
  const footer: any = new laya.ui.Label();
  footer.text = 'Sign in to save your scores';
  footer.fontSize = 20;
  footer.color = '#888';
  footer.align = 'center';
  footer.width = 750;
  footer.y = 720;
  dialog.addChild(footer);

  // ── Close button ────────────────────────────────────────
  const closeBtn: any = new laya.ui.Button();
  closeBtn.skin = 'settle/btnEnd.png';
  closeBtn.centerX = 0;
  closeBtn.y = 1250;
  closeBtn.on('click', null, () => {
    dialog.close();
    _dialog = null;
  });
  dialog.addChild(closeBtn);

  dialog.popup();
  _dialog = dialog;
}
