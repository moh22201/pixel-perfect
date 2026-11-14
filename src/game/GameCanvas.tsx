import { useEffect, useRef } from 'react';
import type { GameCallbacks, GameCommand } from './events';
import type { FarmScene } from './FarmScene';

export default function GameCanvas({ callbacks, commandRef }: { callbacks: GameCallbacks; commandRef: React.RefObject<((command: GameCommand) => void) | null> }) {
  const container = useRef<HTMLDivElement>(null);
  const callbackRef = useRef(callbacks);
  callbackRef.current = callbacks;
  useEffect(() => {
    let disposed = false;
    let game: import('phaser').Game | undefined;
    let scene: FarmScene | undefined;
    async function start() {
      const [Phaser, { FarmScene }] = await Promise.all([import('phaser'), import('./FarmScene')]);
      if (disposed || !container.current) return;
      scene = new FarmScene({ ready: () => callbackRef.current.ready(), arrived: o => callbackRef.current.arrived(o), moving: m => callbackRef.current.moving(m), position: (x, y) => callbackRef.current.position(x, y) });
      game = new Phaser.Game({ type: Phaser.AUTO, parent: container.current, transparent: true, pixelArt: true, antialias: false, scale: { mode: Phaser.Scale.RESIZE, width: container.current.clientWidth, height: container.current.clientHeight }, scene: [scene], audio: { noAudio: true } });
      commandRef.current = command => scene?.command(command);
    }
    start();
    return () => { disposed = true; game?.destroy(true); commandRef.current = null; };
  }, [commandRef]);
  return <div ref={container} className="game-canvas" role="application" aria-label="عالم المزرعة، انقر على الأرض لتحريك المزارع" />;
}