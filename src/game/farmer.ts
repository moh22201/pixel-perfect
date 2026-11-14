import type * as Phaser from 'phaser';

// Original pixel sprite palette; each frame is drawn at native resolution.
const palette: Record<string, string> = { h: '#68492f', H: '#c69751', Y: '#edcc79', s: '#f2b989', S: '#ca8966', e: '#322e28', g: '#527963', G: '#83a173', b: '#486b85', B: '#7292aa', w: '#f7e8ca', f: '#554638' };
export function createFarmer(scene: Phaser.Scene) {
  for (const direction of ['down', 'up', 'left', 'right']) {
    for (let frame = 0; frame < 4; frame++) {
      const texture = scene.textures.createCanvas(`farmer-${direction}-${frame}`, 24, 32);
      if (!texture) continue;
      const ctx = texture.context;
      const pixel = (key: string, x: number, y: number, w: number, h: number) => { const color = palette[key]; if (!color) return; ctx.fillStyle = color; ctx.fillRect(x, y, w, h); };
      const bob = frame % 2;
      const shift = frame === 1 ? 1 : frame === 3 ? -1 : 0;
      pixel('h', 6, 8 + bob, 12, 11); pixel('s', 7, 10 + bob, 10, 9);
      pixel('S', 7, 17 + bob, 10, 2);
      if (direction === 'up') pixel('h', 7, 10 + bob, 10, 8);
      else if (direction === 'down') { pixel('e', 9, 13 + bob, 1, 2); pixel('e', 15, 13 + bob, 1, 2); pixel('S', 11, 16 + bob, 3, 1); }
      else { pixel('s', direction === 'left' ? 5 : 17, 13 + bob, 2, 3); pixel('e', direction === 'left' ? 7 : 16, 13 + bob, 1, 2); }
      pixel('H', 7, 3 + bob, 10, 6); pixel('Y', 8, 2 + bob, 8, 4); pixel('h', 7, 7 + bob, 10, 2);
      pixel('H', 3, 9 + bob, 18, 2); pixel('Y', 4, 8 + bob, 16, 1);
      pixel('g', 6, 19 + bob, 12, 6); pixel('G', 7, 19 + bob, 3, 5);
      pixel('s', 4, 20 + bob + shift, 2, 5); pixel('s', 18, 20 + bob - shift, 2, 5);
      pixel('b', 7, 23 + bob, 10, 4); pixel('B', 8, 20 + bob, 2, 7); pixel('B', 14, 20 + bob, 2, 7);
      pixel('b', 7, 27, 4, 3 + shift); pixel('b', 13, 27, 4, 3 - shift);
      pixel('f', 6, 29 + shift, 5, 2); pixel('f', 13, 29 - shift, 5, 2);
      texture.refresh();
    }
    scene.anims.create({ key: `walk-${direction}`, frames: Array.from({ length: 4 }, (_, i) => ({ key: `farmer-${direction}-${i}` })), frameRate: 9, repeat: -1 });
  }
}