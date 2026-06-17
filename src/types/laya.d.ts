/**
 * Ambient type declarations for LayaAir v2.1.3.1 engine.
 *
 * The engine is vendored (laya.js loaded via <script> tag) — it exposes
 * the global `Laya` namespace and `laya.*` module objects. This file
 * declares only the APIs actually used by Mayan Jump 2, keeping it lean.
 */

/* ─── Laya top-level namespace ─────────────────────────────── */

declare namespace Laya {
  /* -- Framework helpers ------------------------------------ */
  function un(target: any, name: string, value: any): void
  function uns(target: any, name: string, value: any): void
  function static<T extends new (...args: any[]) => any>(ctor: T, props: Partial<InstanceType<T>>): void
  // Laya.class is a reserved word — access via (Laya as any)['class']
  // The game aliases it as __class = Laya.class internally
  function getset(isStatic: 0 | 1, proto: any, name: string, getter: () => any, setter?: (v: any) => void): void
  function __newvec<T>(ctor: new (...args: any[]) => T): T
  function __typeof(this: any, interfaceName: string): boolean
  function imps(proto: any, interfaceName: string): void
  function interface(name: string, members: Record<string, string>): void
  function superSet(proto: any, name: string, value: any): void

  /* -- Core singletons -------------------------------------- */
  const stage: laya.display.Stage
  const timer: Timer
  const loader: LoaderManager

  /* -- Top-level classes ------------------------------------ */
  class Laya3D {
    static init(width: number, height: number, webgl: boolean): void
  }

  class Browser {
    static clientWidth: number
    static clientHeight: number
    static width: number
    static height: number
    static window: Window & typeof globalThis
    static document: Document
    static onAndroid: boolean
    static canvas: HTMLCanvasElement | null
  }

  class Render {
    static _mainCanvas: { source: HTMLCanvasElement }
  }

  // Engine aliases module classes onto the Laya namespace
  const SoundManager: typeof laya.media.SoundManager

  /* -- PlatformClass (android bridge, shimmed) --------------- */
  class PlatformClass {
    static createClass(className: string): {
      call: (...args: any[]) => void
    }
  }
}

/* ─── Core modules ──────────────────────────────────────────── */

declare namespace laya.utils {
  class Browser {
    static clientWidth: number
    static clientHeight: number
    static width: number
    static height: number
    static window: Window
    static document: Document
    static onAndroid: boolean
    static canvas: HTMLCanvasElement | null
  }

  class Handler {
    static create(caller: any, method: (...args: any[]) => void, args?: any[], once?: boolean): Handler
  }

  class Tween {
    static to(target: any, props: Record<string, any>, duration: number, ease?: any, complete?: Handler, delay?: number): void
  }

  class Pool {
    static getItemByClass<T>(sign: string, cls: new () => T): T
    static recover(sign: string, item: any): void
  }
}

declare namespace laya.events {
  class Event {
    static readonly RESIZE: string
    static readonly CLICK: string
    static readonly COMPLETE: string
    static readonly ERROR: string
    static readonly PROGRESS: string
    constructor(type?: string, data?: any)
  }

  class EventDispatcher {
    on(type: string, caller: any, listener: (...args: any[]) => void): void
    off(type: string, caller: any, listener: (...args: any[]) => void): void
    event(type: string, data?: any): void
    _set$instance: any
  }

  class MouseManager {
    static multiTouchEnabled: boolean
  }
}

declare namespace laya.net {
  class Loader {
    create(url: string, config: any, complete?: laya.utils.Handler): void
    load(tasks: any[], complete?: laya.utils.Handler): void
    getRes<T = any>(url: string): T
  }

  class LocalStorage {
    static getItem(key: string): string | null
    static setItem(key: string, value: string): void
    static removeItem(key: string): void
  }

  class ResourceVersion {
    static enable(configUrl: string, errorHandler?: laya.utils.Handler): void
  }
}

/* ─── Display ────────────────────────────────────────────────── */

declare namespace laya.display {
  class Stage {
    bgColor: string
    screenMode: string
    scaleMode: string
    mouseX: number
    mouseY: number
    canvasRotation: boolean

    addChild(child: any): void
    on(type: string, caller: any, listener: (...args: any[]) => void): void
    _canvasTransform: CanvasTransform
  }

  class Sprite {
    width: number
    height: number
    x: number
    y: number
    alpha: number
    visible: boolean
    skin: string
    centerX: number
    centerY: number
    anchorX: number
    anchorY: number

    addChild(child: any): any
    removeChild(child: any): any
    removeSelf(): void
    destroy(destroyChildren?: boolean): void
  }

  class Animation extends Sprite {
    play(start?: number, loop?: boolean, name?: string): void
  }

  interface CanvasTransform {
    invertTransformPoint(input: { x: number; y: number }): { x: number; y: number }
  }
}

/* ─── UI ──────────────────────────────────────────────────────── */

declare namespace laya.ui {
  class Component {
    width: number
    height: number
    mouseEnabled: boolean
    visible: boolean
    top: number
    bottom: number
    left: number
    right: number
    centerX: number
    centerY: number
    anchorX: number
    anchorY: number

    addChild(child: any): any
    removeSelf(): void
    destroy(destroyChildren?: boolean): void
    _set$instance: any
    static prototype: Component
    createChildren(): void
  }

  class Box extends Component {
    _childs: any[]
    _set$instance: any
    static prototype: Box
  }

  class View extends Component {
    createView(uiView: any): void
  }

  class Dialog extends View {
    popup(): void
    close(): void
    static manager: { closeAll(): void }
  }

  class Button extends Component {
    skin: string
    stateNum: number
    on(type: string, caller: any, listener: (...args: any[]) => void): void
  }

  class Image extends Component {
    skin: string
    scaleX: number
    scaleY: number
    on(type: string, caller: any, listener: (...args: any[]) => void): void
  }

  class Label extends Component {
    text: string
    fontSize: number
    font: string
    color: string
    align: string
    valign: string
    width: number
    height: number
    offset: number
    anchorX: number
    anchorY: number
    clipNum: number
    registerString: string
    skin: string
  }

  class Clip extends Component {
    clipX: number
    clipY: number
    width: number
    height: number
    index: number
    skin: string
  }
}

/* ─── 3D Core ─────────────────────────────────────────────────── */

declare namespace laya.d3.core {
  class Camera {
    transform: laya.d3.core.Transform3D
    clearColor: [number, number, number, number]
    fieldOfView: number
    nearPlane: number
    farPlane: number
    viewport: laya.d3.math.Viewport
    addComponent<T>(component: T): T
  }

  class Sprite3D {
    transform: laya.d3.core.Transform3D
    meshRender: any
    _childs: Sprite3D[]
    addChild(child: any): void
    removeSelf(): void
    destroy(): void
  }

  class MeshSprite3D extends Sprite3D {
    meshFilter: any
  }

  class ComponentNode {}

  class Transform3D {
    position: laya.d3.math.Vector3
    rotation: laya.d3.math.Vector3
    rotationEuler: laya.d3.math.Vector3
    localPosition: laya.d3.math.Vector3
    scale: laya.d3.math.Vector3
    getForward(v3: laya.d3.math.Vector3): void
  }

  class Scene {
    addChild(child: any): void
    width: number
    height: number
  }

  namespace render {
    class RenderState {}
  }

  namespace material {
    class StandardMaterial {
      static load(url: string): StandardMaterial
    }
  }

  namespace scene {
    class Scene extends laya.d3.core.Scene {}
  }
}

declare namespace laya.d3.component {
  class Animator {
    static readonly EVENT_PLAY_OVER: string
    play(name: string, loop?: boolean, speed?: number, startTime?: number): void
    addEvent(name: string, eventType: string, callback: (...args: any[]) => void): void
    removeEvent(name: string, eventType: string): void
    removeEvents(name: string): void
  }

  class Script {
    owner: laya.d3.core.Sprite3D
    enabled: boolean
  }

  class Component3D {
    static prototype: Component3D
    _load(owner: any): void
    _update(dt: number): void
  }
}

/* ─── 3D Math ─────────────────────────────────────────────────── */

declare namespace laya.d3.math {
  class Vector3 {
    x: number
    y: number
    z: number
    constructor(x?: number, y?: number, z?: number)
    length(): number
    normalize(): Vector3
    clone(): Vector3
    setValue(x: number, y: number, z: number): void
  }

  class Quaternion {}

  class BoundBox {
    max: Vector3
    min: Vector3
    constructor(min: Vector3, max: Vector3)
  }

  class Viewport {
    x: number
    y: number
    width: number
    height: number
    constructor(x: number, y: number, width: number, height: number)
  }
}

/* ─── 3D Graphics ─────────────────────────────────────────────── */

declare namespace laya.d3.graphics {
  class StaticBatchManager {
    static combine(gameObject: laya.d3.core.MeshSprite3D): void
  }
}

/* ─── 3D Resource Models ──────────────────────────────────────── */

declare namespace laya.d3.resource.models {
  class Mesh {}
}

/* ─── Media ───────────────────────────────────────────────────── */

declare namespace laya.media {
  class SoundManager {
    static playSound(url: string, loops?: number, complete?: laya.utils.Handler, offset?: number, volume?: number): void
    static _audioContext: AudioContext | null
    static _ctx: AudioContext | null
  }
}

/* ─── Maths ───────────────────────────────────────────────────── */

declare namespace laya.maths {
  class Point {
    x: number
    y: number
    constructor(x: number, y: number)
  }
}

/* ─── Timer ───────────────────────────────────────────────────── */

declare class Timer {
  delta: number
  scale: number
  currTimer: number
  frameLoop(delay: number, caller: any, fn: (...args: any[]) => void): void
  frameOnce(delay: number, caller: any, fn: (...args: any[]) => void): void
  once(delay: number, caller: any, fn: (...args: any[]) => void): void
  clear(caller: any, fn: (...args: any[]) => void): void
}

declare class LoaderManager {
  create(url: string, config: any, complete?: laya.utils.Handler): void
  load(tasks: any[], complete?: laya.utils.Handler): void
  getRes<T = any>(url: string): T
}

/* ─── Type aliases from game IIFE (used as constructor/instanceof) ─ */

declare function __typeof(this: any, interfaceName: string): boolean

/* ─── Conch/LayaNative globals (shimmed in conch-shim.js) ──────── */

interface ConchConfig {
  getOS(): number
  getRuntimeVersion(): string
  getIsPlug(): boolean
  localizable: boolean
  setScreenOrientation(orientation: string): void
  setLimitFPS(): void
  setSlowFrame(...args: any[]): void
  setMouseFrame(...args: any[]): void
}

interface Window {
  conchConfig: ConchConfig
  PlatformClass: {
    createClass(className: string): { call(...args: any[]): void }
  }
  fs_exists(path: string): boolean
  fs_mkdir(path: string): void
  fs_writeFileSync(path: string, data: any): void
  _conchInfo: { version: string }
}
