/**
 * Character skin system — swaps the albedo texture on the player mesh
 * at runtime. Add new skins by dropping a 512×128 3-column PNG into
 * LayaScene_Role/Assets/Texture/ and adding an entry below.
 */

const SKINS: Record<string, string> = {
  default: 'LayaScene_Role/Assets/Texture/role.png',
  bunny1: 'LayaScene_Role/Assets/Texture/role-b1.png',
  bunny2: 'LayaScene_Role/Assets/Texture/role-b2.png',
};

const SKIN_STORAGE_KEY = 'character_skin';
const ROLE_CHILD_NAME = 'Role';

// ── Skin selection ─────────────────────────────────────────

function getChosenSkin(): string {
  try {
    const stored = localStorage.getItem(SKIN_STORAGE_KEY);
    if (stored && SKINS[stored]) return stored;
  } catch {
    /* private browsing */
  }
  return 'default';
}

let currentSkin = getChosenSkin();
let appliedTo: WeakRef<object> | null = null; // track which mesh we already patched

export function setSkin(name: string | null): string {
  const keys = Object.keys(SKINS);

  if (name === null || !SKINS[name]) {
    const idx = keys.indexOf(currentSkin);
    name = keys[(idx + 1) % keys.length];
  }

  try {
    localStorage.setItem(SKIN_STORAGE_KEY, name);
  } catch {
    /* private browsing */
  }

  currentSkin = name;
  appliedTo = null; // force re-apply on next mesh detection
  console.log(`[skin] Selected "${name}"`);
  return name;
}

export function getSkin(): string {
  return currentSkin;
}

export function getAvailableSkins(): string[] {
  return Object.keys(SKINS);
}

// ── Texture application ────────────────────────────────────

// Cache: path → Texture2D loaded via the engine's own pipeline.
const textureCache: Record<string, any> = {};

function preloadSkins(): void {
  const Tex2D: any = (Laya as any).Texture2D;

  Object.entries(SKINS).forEach(([_name, path]) => {
    if (path === SKINS.default) return;
    if (textureCache[path]) return;
    // Texture2D.load(url) calls Laya.loader.create(url, null, null, Texture2D)
    // which registers the URL so subsequent load() produces a proper Texture2D.
    Tex2D.load(path);
  });

  // Now load all registered variant URLs using the same pattern as the game.
  const tasks = Object.values(SKINS)
    .filter(p => p !== SKINS.default)
    .map(url => ({ url, type: Tex2D }));

  if (tasks.length === 0) return;

  Laya.loader.load(tasks, laya.utils.Handler.create(null, () => {
    tasks.forEach((t: any) => {
      const tex = Laya.loader.getRes(t.url);
      if (tex) {
        textureCache[t.url] = tex;
        console.log(`[skin] Preloaded Texture2D "${t.url}" → ${tex.constructor?.name}`);
      }
    });
  }));
}

function applyToMesh(mesh: any): void {
  const texturePath = SKINS[currentSkin];
  if (!texturePath) return;

  // Default skin: the .lh loader already created a perfect Texture2D.
  if (texturePath === SKINS.default) return;

  const material = mesh.meshRender?.sharedMaterial;
  if (!material) return;

  const tex = textureCache[texturePath];
  if (!tex) return; // not loaded yet, retry next scan

  material.albedoTexture = tex;
  console.log(`[skin] Applied "${currentSkin}"`);
}

// ── Scene polling — find the player mesh ───────────────────

let watchHandle: any = null;

function scanScene(): void {
  try {
    const GameViewClass = Laya.__classmap?.['com.bdoggame.GameView'];
    const gv = GameViewClass?._instance;
    if (!gv) return;

    const scene = gv.scene;
    if (!scene) return;

    const found = findRoleMesh(scene);
    if (!found) return;

    if (appliedTo?.deref() === found) return;
    applyToMesh(found);
    appliedTo = new WeakRef(found);
  } catch (e) {
    console.warn('[skin] scanScene error:', e);
  }
}

function findRoleMesh(node: any): any | null {
  if (!node) return null;
  if (node.name === ROLE_CHILD_NAME && node.meshRender?.sharedMaterial) {
    return node;
  }
  const children = node._childs || node.child || node.children || [];
  for (const c of children) {
    const r = findRoleMesh(c);
    if (r) return r;
  }
  return null;
}

function startWatching(): void {
  if (watchHandle) return;
  scanScene();
  watchHandle = setInterval(scanScene, 500);
  console.log('[skin] Scene watcher started');
}

// ── Init ───────────────────────────────────────────────────

function init(): void {
  preloadSkins();
  const GameViewClass = Laya.__classmap?.['com.bdoggame.GameView'];
  if (GameViewClass) {
    startWatching();
  } else {
    setTimeout(init, 200);
  }
}

// Wait for the game IIFE to run (scripts load synchronously, so
// by the time our module runs, Jump3d.max.js has executed).
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => setTimeout(init, 100));
} else {
  setTimeout(init, 100);
}

// Dev-only: expose the skin API on window for console testing.
// In production the UI will call these via proper imports.
if (import.meta.env.DEV) {
  (window as any).setSkin = setSkin;
  (window as any).getSkin = getSkin;
  (window as any).getAvailableSkins = getAvailableSkins;
}
