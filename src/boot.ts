/**
 * Bootstrapping — runs after the game engine initializes.
 * Imported as a module (deferred), so the game scripts have
 * already executed by the time this runs.
 */

console.log('[boot] Mayan Jump 2 — web boot complete, waiting for engine init...');

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
