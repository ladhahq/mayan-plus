/**
 * Coin reward system — awards coins for milestones, combos, and daily login.
 * Patches GameView to track in-game achievements.
 */

const COIN_KEY = 'COIN_NUM';
const DAILY_KEY = 'reward_last_daily';
const MAX_COINS = 99;

// ── Reward definitions ──────────────────────────────────────

const SCORE_MILESTONES: [number, number][] = [
  [100, 1],
  [250, 2],
  [500, 3],
  [750, 4],
  [1000, 5],
  [1500, 5],
  [2000, 5],
];

const COMBO_TIERS: [number, number][] = [
  [2, 1],
  [5, 1],
  [10, 2],
  [15, 3],
  [20, 5],
];

const HIGH_SCORE_REWARD = 3;
const DAILY_REWARD = 2;

// ── Helpers ─────────────────────────────────────────────────

function getCoins(): number {
  try {
    return parseInt(String(localStorage.getItem(COIN_KEY) || '0'), 10) || 0;
  } catch {
    return 0;
  }
}

function addCoins(amount: number, reason: string, showToast = true): number {
  let coins = getCoins();
  coins = Math.min(MAX_COINS, coins + amount);
  try {
    localStorage.setItem(COIN_KEY, String(coins));
  } catch {
    /* noop */
  }
  console.log(
    `[rewards] +${amount} coin${amount > 1 ? 's' : ''} (${reason}) — total: ${coins}`,
  );
  if (showToast) showCoinToast(amount);
  return coins;
}

function showCoinToast(amount: number): void {
  try {
    const count = Math.min(amount, 5); // cap visual at 5 coins
    const coinW = 50; // native 157 × 0.28 scale
    const gap = 8; // px between coins
    const totalW = count * coinW + (count - 1) * gap;

    const box: any = new laya.ui.Box();
    box.width = totalW;
    box.height = 50;
    box.centerX = 0;
    box.y = 270;

    // Stagger: add each coin with a 60ms delay, fade in, then float up
    for (let i = 0; i < count; i++) {
      const delay = i * 60;
      (laya.utils.Handler.create(null, () => {
        const coin: any = new laya.ui.Image();
        coin.skin = 'home/revivecoins.png';
        coin.scaleX = 0.32;
        coin.scaleY = 0.32;
        coin.x = i * (coinW + gap);
        coin.y = 10;
        coin.alpha = 0;
        box.addChild(coin);
        (laya.utils.Tween as any).to(coin, { alpha: 1 }, 150, null, null, delay);
      }) as any).run();
    }

    Laya.stage.addChild(box);

    // Float up and remove after all coins have appeared
    const totalDelay = count * 60 + 200;
    (laya.utils.Handler.create(null, () => {
      laya.utils.Tween.to(
        box,
        { y: 200 },
        800,
        null,
        laya.utils.Handler.create(null, () => box.removeSelf()),
        0,
      );
    }) as any).runWith(totalDelay);
  } catch {
    /* UI not ready */
  }
}

// ── Daily bonus ─────────────────────────────────────────────

function checkDailyBonus(): void {
  try {
    const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
    const last = localStorage.getItem(DAILY_KEY);
    if (last !== today) {
      localStorage.setItem(DAILY_KEY, today);
      addCoins(DAILY_REWARD, 'daily bonus', false);
    }
  } catch {
    /* private browsing */
  }
}

// ── Per-game tracking ───────────────────────────────────────

interface GameRewards {
  scoreMilestones: Set<number>;
  comboTiers: Set<number>;
  highScoreAwarded: boolean;
}

const gameRewardsMap = new WeakMap<object, GameRewards>();

function getRewards(gv: any): GameRewards {
  let r = gameRewardsMap.get(gv);
  if (!r) {
    r = {
      scoreMilestones: new Set(),
      comboTiers: new Set(),
      highScoreAwarded: false,
    };
    gameRewardsMap.set(gv, r);
  }
  return r;
}

// ── GameView patching ───────────────────────────────────────

function patchGameView(): void {
  const GameView = (Laya as any).__classmap?.['com.bdoggame.GameView'];
  if (!GameView) {
    setTimeout(patchGameView, 200);
    return;
  }

  const _proto = GameView.prototype;

  // ── Patch the score setter (where the existing score popup lives) ──
  const scoreDesc = Object.getOwnPropertyDescriptor(_proto, 'score');
  if (scoreDesc?.set) {
    const origScoreSet = scoreDesc.set;
    Object.defineProperty(_proto, 'score', {
      get: scoreDesc.get,
      set(this: any, value: number) {
        origScoreSet.call(this, value);
        const r = getRewards(this);
        const s = this._score;
        for (const [threshold, reward] of SCORE_MILESTONES) {
          if (s >= threshold && !r.scoreMilestones.has(threshold)) {
            r.scoreMilestones.add(threshold);
            addCoins(reward, `score ${threshold}`);
          }
        }
        const combo = this.combo;
        for (const [tier, reward] of COMBO_TIERS) {
          if (combo >= tier && !r.comboTiers.has(tier)) {
            r.comboTiers.add(tier);
            addCoins(reward, `${tier}x combo`);
          }
        }
      },
      configurable: true,
    });
    console.log('[rewards] Score setter patched for milestone/coin checks');
  }

  // ── Patch die() for high score ──
  const origDie = _proto.die;
  _proto.die = function (this: any) {
    const r = getRewards(this);
    if (this._score >= this.mHighScore && !r.highScoreAwarded) {
      r.highScoreAwarded = true;
      addCoins(HIGH_SCORE_REWARD, 'new high score', false);
    }
    origDie.call(this);
  };

  // ── Patch gameStart to reset per-game rewards ─────────
  const origGameStart = _proto.gameStart;
  _proto.gameStart = function (this: any, revive?: boolean) {
    if (!revive) gameRewardsMap.delete(this);
    origGameStart.call(this, revive);
  };

  console.log('[rewards] GameView patched — milestones + combos + high score');
}

// ── Init ────────────────────────────────────────────────────

export function initRewards(): void {
  checkDailyBonus();
  patchGameView();
}
