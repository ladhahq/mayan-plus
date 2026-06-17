/**
 * Aspect Ratio + Canvas Position Fix
 *
 * 1. Patches Browser.clientWidth/clientHeight to return portrait-proportioned
 *    values (750:1334 ratio), fixing the WebGL framebuffer aspect ratio.
 *
 * 2. Patches _canvasTransform to account for the canvas's position in the
 *    viewport, fixing mouse/touch coordinate mapping when the game is not
 *    at viewport (0,0).
 *
 * This MUST run AFTER laya.js loads but BEFORE jump3d.max.js
 * calls new LayaAir3D().
 */

(() => {
  console.log('[fix-aspect] Waiting for Laya.Browser...');

  const DESIGN_W = 750;
  const DESIGN_H = 1334;
  // ---- Phase 1: Patch Browser dimensions for portrait aspect ratio ----

  function patchBrowser(): void {
    if (!window.Laya?.Browser) {
      setTimeout(patchBrowser, 10);
      return;
    }

    const Browser = window.Laya.Browser;

    Object.defineProperty(Browser, 'clientWidth', {
      get(): number {
        const vw = window.innerWidth;
        const vh = window.innerHeight;
        return Math.min(vw, (vh * DESIGN_W) / DESIGN_H);
      },
      configurable: true,
    });

    Object.defineProperty(Browser, 'clientHeight', {
      get(): number {
        const vw = window.innerWidth;
        const vh = window.innerHeight;
        return Math.min(vh, (vw * DESIGN_H) / DESIGN_W);
      },
      configurable: true,
    });

    console.log('[fix-aspect] Browser.clientWidth/Height patched');
    console.log(`[fix-aspect]   inner=${window.innerWidth}x${window.innerHeight}`);
    console.log(`[fix-aspect]   clientWidth=${Browser.clientWidth} clientHeight=${Browser.clientHeight}`);

    // Start phase 2
    patchCanvasTransform();
  }

  // ---- Phase 2: Patch _canvasTransform for canvas viewport offset ----

  function applyPatch(ct: laya.display.CanvasTransform): void {
    if ((ct as any).__patched) return;
    const origInvert = ct.invertTransformPoint;

    ct.invertTransformPoint = function (point: { x: number; y: number }) {
      let canvas: HTMLCanvasElement | null = null;
      if (window.Laya?.Render?._mainCanvas) {
        canvas = window.Laya.Render._mainCanvas.source;
      }
      if (!canvas) {
        canvas = document.querySelector('canvas');
      }
      if (canvas) {
        const rect = canvas.getBoundingClientRect();
        point.x -= rect.left;
        point.y -= rect.top;
      }
      return origInvert.call(this, point);
    };
    (ct as any).__patched = true;
  }

  function patchCanvasTransform(): void {
    const stage = window.Laya?.stage;
    if (!stage?._canvasTransform) {
      setTimeout(patchCanvasTransform, 50);
      return;
    }

    const ct = stage._canvasTransform;
    if (!(ct as any).__patched) {
      applyPatch(ct);
      console.log('[fix-aspect] _canvasTransform.invertTransformPoint patched');
    }

    // Re-apply on resize in case the transform gets rebuilt
    window.addEventListener('resize', () => {
      const ct2 = window.Laya?.stage?._canvasTransform;
      if (ct2 && !(ct2 as any).__patched) {
        applyPatch(ct2);
      }
    });
  }

  patchBrowser();
})();
