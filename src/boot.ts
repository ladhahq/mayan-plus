/**
 * Bootstrapping — runs after the game engine initializes.
 * Imported as a module (deferred), so the game scripts have
 * already executed by the time this runs.
 */

import './skin';
import { initRewards } from './rewards';
import { openPicker } from './character-picker';
initRewards();

// ── Enable revive mechanic ─────────────────────────────────
// The original game required the Android ad SDK to call
// eventVideoReady(true) before the revive dialog would appear.
// On web, we enable it unconditionally and seed 3 free coins.
(function enableRevive() {
  if (typeof GameSDK === 'undefined') {
    setTimeout(enableRevive, 100);
    return;
  }
  GameSDK.mVideoReady = true;
  try {
    if (localStorage.getItem('COIN_NUM') == null) {
      localStorage.setItem('COIN_NUM', '3');
      console.log('[boot] Seeded 3 revive coins');
    }
  } catch { /* private browsing */ }

  // The original ReviveDialog layout assumed only one button would be visible
  // (video OR coin, never both). Both are 258×257px with only 175px gap → overlap.
  // Reposition for side-by-side layout: video left, coin right, 24px gap.
  const patchReviveLayout = () => {
    const ReviveDialog = (Laya as any).__classmap?.['com.bdoggame.ReviveDialog'];
    if (!ReviveDialog) { setTimeout(patchReviveLayout, 200); return; }
    const REVIVE_COST = 3;

    // Override onCoinClick: spend 3 coins instead of 1
    ReviveDialog.prototype.onCoinClick = function () {
      let coin = parseInt(String(localStorage.getItem('COIN_NUM') || '0'), 10);
      if (coin >= REVIVE_COST) {
        coin -= REVIVE_COST;
        localStorage.setItem('COIN_NUM', String(coin));
        GameSDK.revive();
        this.close();
      }
    };

    const origSetCoin = ReviveDialog.prototype.setCoin;
    ReviveDialog.prototype.setCoin = function () {
      origSetCoin.call(this);
      this.btnCoin.visible = true;
      const coin = parseInt(String(localStorage.getItem('COIN_NUM') || '0'), 10);
      this.btnCoin.disabled = coin < REVIVE_COST;
      this.labCoin.text = String(coin);
      // Reposition: both 258px wide, canvas 750px. Center the pair.
      // video @ 105, coin @ 387 (gap = 24px)
      this.btnVideo.x = 105;
      this.btnCoin.x = 387;
    };
    console.log('[boot] Revive button layout patched');
  };
  patchReviveLayout();

  console.log('[boot] Revive enabled — video ready + coins seeded');
})();

// ── Enable hidden home screen UI elements ────────────────────
// The original game hid the coin display and welfare (ad) button
// behind Android ad SDK checks. On web, we show everything.
(function enableHomeUI() {
  const HomeView = (Laya as any).__classmap?.['com.bdoggame.HomeView'];
  if (!HomeView) { setTimeout(enableHomeUI, 200); return; }

  // Add a skin picker button on the right side, mirroring the coin counter
  let _skinBtnAdded = false;
  const addSkinBtn = function (this: any) {
    if (_skinBtnAdded) return;
    _skinBtnAdded = true;

    // Background panel (matches coin counter style: toolsbg on the left)
    const bg: any = new laya.ui.Image();
    bg.skin = 'home/toolsbg.png';
    bg.width = 140;
    bg.height = 54;
    bg.right = 20;
    bg.top = 50;
    (this as any).addChild(bg);

    // Label inside the panel — matches coin counter style (fontSize 40, Arial)
    const label: any = new laya.ui.Label();
    label.text = 'Theme';
    label.fontSize = 40;
    label.font = 'Arial';
    label.color = '#ffffff';
    label.align = 'center';
    label.valign = 'middle';
    label.width = 140;
    label.height = 54;
    label.right = 20;
    label.top = 50;
    (this as any).addChild(label);

    // Make the whole area clickable via the background
    bg.on('click', this, () => openPicker());
    console.log('[boot] Skin picker button added');
  };

  // Override setCoin to show hidden elements + remove "/5" cap label
  HomeView.prototype.setCoin = function () {
    const coin = parseInt(String(localStorage.getItem('COIN_NUM') || '0'), 10);
    this.labCoins.text = String(coin);
    if (this.labCoins?.parent) this.labCoins.parent.visible = true;
    this.btnWelfare.visible = true;
    addSkinBtn.call(this);
  };

  // Raise welfare cap from 5 to 99
  HomeView.prototype.updateWelfareStatus = function (coin: number) {
    if (GameSDK.getVideoReady()) {
      this.btnWelfare.visible = coin < 99;
    } else {
      this.btnWelfare.visible = false;
    }
  };

  // Override welfare click: no-op on web (ads don't work)
  HomeView.prototype.onWelfareClick = function () {
    console.log('[boot] Welfare clicked — no-op on web');
  };

  console.log('[boot] Home screen UI elements enabled');
})();

console.log('[boot] Mayan Plus — web boot complete, waiting for engine init...');

// ── Body sizing ────────────────────────────────────────────
// Keep body sized correctly as mobile browser chrome shows/hides.
// CSS uses dvh/dvw; we also set explicit px values for cross-browser
// consistency on browsers with partial dvh support.

function updateBodySize(): void {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const w = Math.min(vw, (vh * 750) / 1334);
  const h = Math.min(vh, (vw * 1334) / 750);
  document.body.style.width = `${w}px`;
  document.body.style.height = `${h}px`;
}

updateBodySize();
window.addEventListener('resize', updateBodySize);
window.addEventListener('orientationchange', () => {
  setTimeout(updateBodySize, 100);
});

// ── Canvas checker ─────────────────────────────────────────
// Poll until the canvas is ready, then hide the loading indicator.

(function checkCanvas(): void {
  const canvas = document.querySelector('canvas');
  if (canvas && canvas.width > 0) {
    const cr = canvas.getBoundingClientRect();
    console.log(
      `[boot] Canvas ready — internal=${canvas.width}x${canvas.height}` +
        ` viewport=${window.innerWidth}x${window.innerHeight}`,
    );
    console.log(
      `[boot]   canvas rect: left=${Math.round(cr.left)} top=${Math.round(cr.top)}` +
        ` w=${Math.round(cr.width)} h=${Math.round(cr.height)}`,
    );

    const loading = document.getElementById('loading');
    if (loading) {
      loading.style.opacity = '0';
      loading.style.transition = 'opacity 0.3s';
      setTimeout(() => loading.remove(), 300);
    }
  } else {
    setTimeout(checkCanvas, 50);
  }
})();

// ── Audio unlock ───────────────────────────────────────────
// Chrome blocks audio until first user interaction.
// Resume any suspended AudioContexts on click/touch/keydown.

function unlockAllAudio(): void {
  if (window.Laya?.SoundManager) {
    const sm = window.Laya.SoundManager;
    if (sm._audioContext && sm._audioContext.state === 'suspended') {
      sm._audioContext.resume();
    }
    if (sm._ctx && sm._ctx.state === 'suspended') {
      sm._ctx.resume();
    }
    console.log(
      '[boot] Audio unlock attempted, AudioContext state:',
      sm._audioContext ? sm._audioContext.state : 'none',
    );
  }
}

document.addEventListener('click', unlockAllAudio, { once: true });
document.addEventListener('touchstart', unlockAllAudio, { once: true });
document.addEventListener('keydown', unlockAllAudio, { once: true });

// ── Global error handler ───────────────────────────────────

window.onerror = (msg, url, line) => {
  console.error('[boot] Global error:', msg, 'at', `${url}:${line}`);
  const loading = document.getElementById('loading');
  if (loading) {
    loading.innerHTML =
      '<div style="color:#f44;font-size:14px;">⚠️ Error loading game<br><small>' +
      String(msg).substring(0, 80) +
      '</small></div>';
    loading.style.color = '#f44';
  }
};
