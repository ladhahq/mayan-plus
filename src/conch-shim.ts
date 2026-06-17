/**
 * Conch/LayaNative Compatibility Shim for Web
 *
 * The LayaAir engine was wrapped in LayaNative (Conch) for the Android APK.
 * On web, we bypass the native runtime entirely. This shim provides minimal
 * stubs for any Conch APIs that the engine might call without proper guards.
 *
 * Key design choice: we deliberately leave window.conch as UNDEFINED.
 * This causes all `if (conch)` / `if (window.conch)` guards to fail,
 * making the engine use its standard WebGL rendering path.
 *
 * We only stub what might be accessed without a guard.
 */

(() => {
  console.log('[conch-shim] Setting up web compatibility layer');

  // ============================================================
  // CRITICAL: Do NOT set ConchRenderType to a value that has bit 0x04.
  // The game's native config.js sets ConchRenderType = 6 (0b0110),
  // which makes Render.isConchApp = true. On web we want isConchApp = false
  // so the engine uses standard WebGL, not the Conch rendering backend.
  //
  // By NOT setting this at all, (undefined & 4) = 0, so isConchApp = false.
  // ============================================================

  // Provide a minimal conchConfig for any unguarded access.
  // In the engine, most conchConfig accesses are guarded by
  // `Browser.window.conch &&` or `window.conch ?`, but we provide
  // stubs just in case.
  window.conchConfig = {
    getOS: () => 0,
    getRuntimeVersion: () => '2.1.3.1-web',
    getIsPlug: () => false,
    // localizable: when false, the game loads from the network.
    // When true, it tries to use local assets via the DCC system.
    // For web, we want local assets to work without the DCC cache.
    localizable: true,
    setScreenOrientation: (orientation: string) => {
      console.log(`[conch-shim] setScreenOrientation(${orientation}) — ignored`);
    },
    setLimitFPS: () => {},
    setSlowFrame: (..._args: any[]) => {},
    setMouseFrame: (..._args: any[]) => {},
  };

  // The game code calls GameSDK.init() which references:
  //   Browser.onAndroid — engine provides this via user agent detection
  //   PlatformClass.createClass("demo.MainActivity") — only on Android
  // These calls are guarded by `if (Browser.onAndroid)`, so on web
  // they're skipped automatically.

  // Stub the PlatformClass in case it's referenced without Android guard
  window.PlatformClass = {
    createClass: (className: string) => {
      console.warn(`[conch-shim] PlatformClass.createClass("${className}") called on web — returning stub`);
      return {
        call: (...args: any[]) => {
          console.warn(`[conch-shim] PlatformClass.call(${args.map(String).join(', ')}) — ignored on web`);
        },
      };
    },
  };

  // Filesystem stubs — the engine's font initialization code in the native
  // bootstrapper calls these. On web, font loading uses CSS @font-face.
  window.fs_exists = (path: string) => {
    console.warn(`[conch-shim] fs_exists("${path}") — returning false`);
    return false;
  };
  window.fs_mkdir = (path: string) => {
    console.warn(`[conch-shim] fs_mkdir("${path}") — ignored`);
  };
  window.fs_writeFileSync = (_path: string, _data: any) => {
    console.warn(`[conch-shim] fs_writeFileSync("${_path}") — ignored`);
  };

  // The native bootstrapper stores version info here
  window._conchInfo = { version: '2.1.3.1' };

  console.log('[conch-shim] Web compatibility layer ready');
  console.log('[conch-shim] Render.isConchApp will be false → engine uses WebGL');
  console.log('[conch-shim] Browser.onAndroid will be false → SDK calls skipped');
})();
