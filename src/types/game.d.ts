/**
 * Ambient type declarations for Mayan Jump 2 game classes.
 *
 * These classes are defined in jump3d.max.js (inside an IIFE) and
 * registered in Laya.__classmap via Laya.class(). They're not
 * global variables — access via Laya.__classmap['com.bdoggame.X'].
 */

/* ─── GameSDK ──────────────────────────────────────────────── */

declare var GameSDK: {
  addGameOver(fn: () => void): void
  removeGameOver(fn: () => void): void
  init(): void
  updateScore(score: number): void
  getVideoReady(): boolean
  onCoinVideo(): void
  onRank(): void
  _callbacks: Record<string, (result: any) => void>
}

/* ─── EventCenter (singleton) ──────────────────────────────── */

interface EventCenter {
  on(event: string, caller: any, listener: (...args: any[]) => void, once?: boolean): void
  off(event: string, caller: any, listener: (...args: any[]) => void): void
  event(event: string, data?: any): void
}

declare namespace EventCenter {
  // __getset getter on prototype → static-like access
  const instance: EventCenter
  const COIN_VIDEO_BACK: string
  const VIDEO_READY: string
  const _instance: EventCenter | null
}

/* ─── Player class ─────────────────────────────────────────── */

interface Player {
  jumpIndex: number
  die(): void
  fire(): void
  onChange(rotation: number): void
  stop(rotation: number): void
}

/* ─── GameView (main game scene, singleton) ────────────────── */

interface GameView {
  combo: number
  _score: number
  labelScore: { text: string }
  mHighScore: number
  mRevived: boolean
  mouseEnabled: boolean
  player: Player
  imgWarning: { alpha: number }

  score: number
  width: number
  height: number
}

declare namespace GameView {
  const instance: () => GameView
  const NUM: number
  const _instance: GameView | null
}

/* ─── HomeView (home screen) ───────────────────────────────── */

interface HomeView {
  btnStart: { on(type: string, caller: any, fn: () => void): void }
  btnWelfare: { visible: boolean; on(type: string, caller: any, fn: () => void): void }
  btnRank: { on(type: string, caller: any, fn: () => void): void }
  labCoins: { text: string }
}

/* ─── SettleDialog (game over, singleton) ──────────────────── */

interface SettleDialog {
  labCurScore: { text: string }
  labHighScore: { text: string }
  mCurScore: number
  mHighScore: number
  popup(): void
  updateScore(curScore: number, highScore: number): void
}

declare namespace SettleDialog {
  const instance: () => SettleDialog
  const _instance: SettleDialog | null
}

/* ─── ReviveDialog (revive prompt, singleton) ──────────────── */

interface ReviveDialog {
  labCurScore: { text: string }
  labHighScore: { text: string }
  mCurScore: number
  mHighScore: number
  popup(): void
  updateScore(curScore: number, highScore: number): void
}

declare namespace ReviveDialog {
  const instance: () => ReviveDialog
  const _instance: ReviveDialog | null
}

/* ─── SceneManager (singleton) ─────────────────────────────── */

interface SceneManager {
  replaceScene(view: any): void
}

declare namespace SceneManager {
  const instance: () => SceneManager
  const _instance: SceneManager | null
}

/* ─── SoundManager (game-specific wrapper) ─────────────────── */

interface GameSoundManager {
  playSound(url: string): void
}
