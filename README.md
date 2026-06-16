# Mayan Jump 2 — Web Port

**▶ [Play now](https://mayan-web.vercel.app)**

Web port of **Mayan Jump 2**, a 3D endless jumper game extracted from the last public Android APK (2018) by BadDog Game. The game was unlisted from the Play Store and development stopped. This port preserves the original game logic and assets, running directly in a browser using WebGL.

## Quick Start

Serve the directory with any HTTP server:

```bash
python3 -m http.server 8080
```

Open `http://localhost:8080` in a browser with WebGL support (Chrome, Firefox, Safari, Edge).

## How It Works

The original game was built with **LayaAir v2.1.3.1** and wrapped in **LayaNative** (Conch) for Android. The APK was essentially a web app in a native shell. This port removes the native wrapper and runs the game directly in the browser.

```
Original APK                          This Port
─────────────                         ─────────
assets/scripts/index.js  ← native    (removed — browser loads HTML directly)
assets/scripts/config.js ← splash    (removed)
assets/scripts/async.js  ← download  (removed)
       ↓
extracted/index.html     ← web app → index.html (loads engine + game)
  laya.js                ← engine  → laya.js
  utils.min.js           ← utils   → utils.min.js
  jump3d.max.js          ← game    → jump3d.max.js
       +
  conch-shim.js          ← NEW: Conch API stubs
  fix-aspect-ratio.js    ← NEW: Engine bug fixes
```

## Project Structure

```
mayan-jump-web/
├── index.html              Entry point
├── conch-shim.js           Conch/LayaNative API stubs for web
├── fix-aspect-ratio.js     Engine patches (aspect ratio + mouse coords)
├── laya.js                 LayaAir v2.1.3.1 engine (unmodified)
├── utils.min.js            Game utilities (unmodified)
├── jump3d.max.js           Game logic — full readable source (unmodified)
├── version.json            Resource version map
├── unpack.json             Asset unpacking list
│
├── game/                   Game textures
├── home/                   Home screen textures
├── settle/                 Settlement screen textures
├── sound/                  WAV sound effects (jump, break stone, role hit)
├── font/                   layabox.ttf (Chinese font, 10MB)
│
├── res/atlas/              Sprite atlases (game, home, settle, comp)
├── Role.ani                Player animation
├── JumpEffect_*.ani        Jump effect animations
│
├── LayaScene_JumpDown/     Main cylinder scene (3D models + textures)
├── LayaScene_Role/         Player character (3D model + animations)
├── LayaScene_JumpCircle/   Combo circle effect
├── LayaScene_JumpCircleBig/ Big combo circle effect
├── LayaScene_GoingDown/    Fire trail effect
└── LayaScene_Trail/        Trail effect
```

## Engine Patches

Two bugs in the LayaAir engine were fixed to make the game work correctly on desktop browsers:

### 1. Portrait Aspect Ratio (`fix-aspect-ratio.js`)

The engine uses `window.innerWidth/innerHeight` to size the WebGL framebuffer. On desktop (landscape viewport ~16:9), this creates a landscape-shaped canvas that clips the portrait game (750×1334). **Fix:** Override `Browser.clientWidth/clientHeight` to return portrait-proportioned values that fit within the viewport while maintaining the 750:1334 ratio.

### 2. Mouse Coordinate Mapping (`fix-aspect-ratio.js`)

The engine's `_canvasTransform.invertTransformPoint()` converts viewport mouse coordinates to design coordinates but doesn't account for the canvas element's position when it's not at viewport (0,0). **Fix:** Patch the transform to subtract `getBoundingClientRect()` offset, correcting hit-testing when the game is centered on screen.

## Known Limitations

- **Background music**: Not present in the APK assets (likely handled by the Android native layer)
- **Ads, ranking, video rewards**: Android-specific features stubbed out via `conch-shim.js`
- **Audio autoplay**: Chrome blocks audio until first user interaction; LayaAir auto-recovers on click
- **Font**: The 10MB `layabox.ttf` is included for Chinese text rendering; English-only users could omit it

## Gameplay

- **Resolution**: 750×1334 portrait
- **Controls**: Tap and drag left/right to rotate the cylinder. Player auto-jumps on blocks.
- **Mechanics**: Combo system, fire/power mode (combo ≥ 3), walls (instant death), trap blocks
- **Scenes**: Home → Game → Revive/Settle dialogs

## Credits

- Original game by BadDog Game (http://www.baddog-game.com)
- Built with LayaAir by LayaBox (http://www.layabox.com)
- Web port reverse-engineered from the 2018 Android APK
