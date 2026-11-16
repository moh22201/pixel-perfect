import type * as Phaser from 'phaser';
import type { DemoField } from './demo-store';
import { objects } from './world';

const colors: Record<string, { leaf: number; fruit: number }> = {
  wheat: { leaf: 0x9bbf4a, fruit: 0xe8c45a }, carrot: { leaf: 0x4fa64a, fruit: 0xe9853a },
  potato: { leaf: 0x5f9a46, fruit: 0xc49a62 }, corn: { leaf: 0x6fae3f, fruit: 0xf2d54b }, sunflower: { leaf: 0x4f9a3c, fruit: 0xf5c22b },
};

/** 0 = empty, 1 seeds, 2 sprout, 3 growing, 4 ready */
export function cropStage(field: DemoField, now: number) {
  if (!field.crop || !field.plantedAt || !field.readyAt) return 0;
  if (now >= field.readyAt) return 4;
  const p = (now - field.plantedAt) / (field.readyAt - field.plantedAt);
  return p < 0.25 ? 1 : p < 0.6 ? 2 : 3;
}

export function drawFields(g: Phaser.GameObjects.Graphics, fields: DemoField[], now: number, time: number) {
  g.clear();
  for (const field of fields) {
    const o = objects.find(x => x.id === `field-${field.id}`);
    if (!o) continue;
    const stage = cropStage(field, now);
    if (!stage || !field.crop) continue;
    const c = colors[field.crop] ?? colors['wheat']!;
    g.fillStyle(0x6b4428, 0.45).fillRect(o.x + 8, o.y + 8, o.w - 16, o.h - 16);
    for (let r = 0; r < 3; r++) for (let k = 0; k < 4; k++) {
      const x = o.x + 20 + k * ((o.w - 40) / 3), base = o.y + 30 + r * 26;
      const sway = stage === 4 ? Math.round(Math.sin(time / 400 + r + k)) : 0;
      if (stage === 1) { g.fillStyle(0x3d2716).fillRect(x - 2, base - 2, 4, 3); continue; }
      const h = stage === 2 ? 6 : stage === 3 ? 13 : 18;
      g.fillStyle(c.leaf).fillRect(x - 1 + sway, base - h, 3, h);
      g.fillRect(x - 5 + sway, base - h / 2, 4, 3).fillRect(x + 2 + sway, base - h / 2 - 3, 4, 3);
      if (stage === 4) g.fillStyle(c.fruit).fillRect(x - 3 + sway, base - h - 5, 7, 6);
    }
    const p = stage === 4 ? 1 : Math.min(1, (now - field.plantedAt!) / (field.readyAt! - field.plantedAt!));
    g.fillStyle(0x2b2a20, 0.7).fillRect(o.x + 14, o.y + o.h - 14, o.w - 28, 6);
    g.fillStyle(stage === 4 ? 0xffe27a : 0x9fe07a).fillRect(o.x + 15, o.y + o.h - 13, (o.w - 30) * p, 4);
    if (stage === 4) { const b = Math.sin(time / 250) * 3; g.fillStyle(0xfff1a8).fillTriangle(o.x + o.w / 2 - 7, o.y - 4 + b, o.x + o.w / 2 + 7, o.y - 4 + b, o.x + o.w / 2, o.y + 6 + b); }
  }
}
