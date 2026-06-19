# Mayan Jump 2 — Web Port

**▶ [Play now](https://mayan-web.vercel.app)**

Web port of **Mayan Jump 2**, a 3D endless jumper game extracted from the last public Android APK (2018) by BadDog Game. The game was unlisted from the Play Store and development stopped. This port preserves the original game logic and assets, running directly in a browser using WebGL.

| Desktop | Mobile |
|---------|--------|
| ![Desktop screenshot](desktop.png) | ![Mobile screenshot](mobile.png) |

**📝 [Read the full backstory](https://jisena.bearblog.dev/how-i-ported-an-abandoned-android-game-to-the-web-in-a-few-hours-with-ai/)** — how this port was built, step by step.

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

## Browser Compatibility

Tested on iPhone 16 (iOS 18) and desktop (macOS).

| Browser | Platform | Centered | Fits viewport | Notes |
|---------|----------|----------|---------------|-------|
| Safari | iOS | ✅ | ✅ | Perfect — fills width and height |
| Opera | iOS | ✅ | ✅ | Perfect — fills width and height |
| Arc Search | iOS | ✅ | ✅ | Perfect — fills width and height |
| Chrome | iOS | ✅ | ❌ | Centered but has black margins left and right |
| Firefox | iOS | ✅ | ❌ | Centered but has black margins left and right |
| Chrome | desktop | ✅ | ❌ | Centered, letterboxed on wide screens |
| Firefox | desktop | ✅ | ❌ | Centered, letterboxed on wide screens |
| Safari | desktop | ✅ | ❌ | Centered, letterboxed on wide screens |

**Known issue:** Chrome iOS and Firefox iOS don't fill the viewport width, leaving thin black bars on the sides. This is due to how these browsers report `innerWidth` vs the actual visual viewport width. Safari, Opera, and Arc Search handle this correctly. Pull requests welcome.

## Custom Skins

The character texture is a **3-column sprite sheet** animated by shifting the UV offset. You can add new skins by dropping a correctly formatted PNG into the texture folder and registering it in `src/skin.ts`.

### Technical Spec

| Property | Value |
|----------|-------|
| **Canvas size** | 512 × 128 pixels |
| **Format** | PNG, RGBA (with alpha) |
| **Layout** | 3 equal columns, left to right |
| **Column width** | ~171 pixels each |
| **Column 0 (idle)** | Normal/neutral pose |
| **Column 1 (action)** | Angry/determined pose |
| **Column 2 (hurt)** | Knocked-out/dizzy pose |
| **Centering** | Each sprite centered vertically within its column |
| **Background** | Transparent |

The engine's material uses `tilingOffset: [0.333, 1, 0, 0]` — at any moment only one column is visible. The animation system slides the U-offset to switch between states. Make sure no sprite bleeds into the next column.

### Adding a New Skin

1. **Create the sprite sheet** following the spec above, e.g. `role-cat.png`
2. **Drop it in** `LayaScene_Role/Assets/Texture/`
3. **Register it** in `src/skin.ts`:

```ts
const SKINS: Record<string, string> = {
  default: 'LayaScene_Role/Assets/Texture/role.png',
  bunny1:  'LayaScene_Role/Assets/Texture/role-b1.png',
  bunny2:  'LayaScene_Role/Assets/Texture/role-b2.png',
  cat:     'LayaScene_Role/Assets/Texture/role-cat.png', // ← add this
};
```

4. **Refresh** — the new skin is available. In the console (dev only):

```js
setSkin('cat')
```

The chosen skin persists in `localStorage` under `character_skin`. A proper UI selector is planned for production.

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
