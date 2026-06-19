/**
 * Character picker dialog — shows skin previews, tap to select.
 * Built with LayaAir UI primitives from existing atlases.
 */

import { setSkin, getSkin, getAvailableSkins } from './skin';

const SKIN_LABELS: Record<string, string> = {
  default: 'Classic',
  bunny1: 'Toffee',
  bunny2: 'Pebble',
};

function getPreviewPath(skin: string): string {
  return `LayaScene_Role/Assets/Texture/preview-${skin}.png`;
}

// Pre-load preview images so Image.skin resolves them
function preloadPreviews(skins: string[], onReady: () => void): void {
  const tasks = skins.map((s) => ({
    url: getPreviewPath(s),
    type: 'image',
  }));
  Laya.loader.load(tasks, laya.utils.Handler.create(null, onReady));
}

let _dialog: any = null;

export function openPicker(): void {
  if (_dialog) {
    _dialog.close();
    _dialog = null;
  }

  const skins = getAvailableSkins();
  preloadPreviews(skins, () => showDialog(skins));
}

function showDialog(skins: string[]): void {
  const Dialog: any = laya.ui.Dialog;
  const dialog: any = new Dialog();
  dialog.width = 750;
  dialog.height = 1334;

  // ── Background ──────────────────────────────────────────
  const bg: any = new laya.ui.Image();
  bg.skin = 'settle/bg_revive.png';
  bg.width = 750;
  bg.height = 1334;
  dialog.addChild(bg);

  // ── Title ───────────────────────────────────────────────
  const title: any = new laya.ui.Label();
  title.text = 'Choose Character';
  title.fontSize = 48;
  title.color = '#ffffff';
  title.align = 'center';
  title.width = 750;
  title.y = 60;
  dialog.addChild(title);

  // ── Skin previews ───────────────────────────────────────
  const current = getSkin();
  const previewW = 159;
  const gap = 30;
  const totalW = skins.length * previewW + (skins.length - 1) * gap;
  const startX = (750 - totalW) / 2;
  const previewY = 200;

  skins.forEach((skin, i) => {
    const x = startX + i * (previewW + gap);

    // Preview image
    const img: any = new laya.ui.Image();
    img.skin = getPreviewPath(skin);
    img.width = previewW;
    img.height = 120;
    img.x = x;
    img.y = previewY;
    img.mouseEnabled = true;
    dialog.addChild(img);

    // Selection highlight border
    if (skin === current) {
      const border: any = new laya.ui.Image();
      border.skin = 'comp.clip_selectBox.png';
      border.width = previewW + 12;
      border.height = 130;
      border.x = x - 6;
      border.y = previewY - 5;
      dialog.addChild(border);
    }

    // Label
    const label: any = new laya.ui.Label();
    label.text = SKIN_LABELS[skin] || skin;
    label.fontSize = 28;
    label.color = '#ffffff';
    label.align = 'center';
    label.width = previewW;
    label.y = previewY + 130;
    label.x = x;
    dialog.addChild(label);

    // Click handler on the image
    img.on('click', null, () => {
      setSkin(skin);
      dialog.close();
      _dialog = null;
    });
  });

  // ── Close button ────────────────────────────────────────
  const closeBtn: any = new laya.ui.Button();
  closeBtn.skin = 'settle/btnEnd.png';
  closeBtn.centerX = 0;
  closeBtn.y = 1050;
  closeBtn.on('click', null, () => {
    dialog.close();
    _dialog = null;
  });
  dialog.addChild(closeBtn);

  dialog.popup();
  _dialog = dialog;
}
