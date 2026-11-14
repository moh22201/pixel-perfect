import type { WorldObject } from './world';
export type GameCommand = 'home' | 'fields' | 'center' | 'zoom-in' | 'zoom-out';
export type GameCallbacks = { ready: () => void; arrived: (object: WorldObject) => void; moving: (moving: boolean) => void; position: (x: number, y: number) => void };