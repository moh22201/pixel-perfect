import type { WorldObject } from './world';

export const ARCHIPELAGO_SIZE = 3072;
export const WORLD_OFFSET = 768;
export type Region = WorldObject & { kind: 'region'; locked: true; condition: string; description: string };
// Future systems attach to region IDs; unlocking requires explicit state, never a payment in this phase.
export const regions: Region[] = [
  { id: 'forest', name: 'جزيرة الغابة', kind: 'region', x: -700, y: -700, w: 860, h: 900, approach: { x: 776, y: 120 }, locked: true, condition: 'إصلاح المعبر بعد إتاحة مهام الاستكشاف', description: 'غابة كثيفة بين شواطئ صخرية. موطن أشجار وموارد طبيعية لم تُكتشف بعد.' },
  { id: 'mines', name: 'جزيرة المناجم', kind: 'region', x: 1390, y: -740, w: 860, h: 1040, approach: { x: 1288, y: 392 }, locked: true, condition: 'إتاحة الاستكشاف وأدوات التعدين في مرحلة الموارد', description: 'قمم صخرية وكهوف قديمة تخفي مواد خام في أعماقها.' },
  { id: 'pasture', name: 'جزيرة المراعي', kind: 'region', x: -740, y: 1200, w: 940, h: 1040, approach: { x: 808, y: 1320 }, locked: true, condition: 'إتاحة مرحلة الحيوانات وتجهيز المعبر', description: 'مروج مفتوحة وأزهار برية ومساحات هادئة لإقامة الحيوانات مستقبلاً.' },
  { id: 'workshops', name: 'جزيرة الصناعة', kind: 'region', x: 1340, y: 1180, w: 900, h: 1060, approach: { x: 952, y: 1128 }, locked: true, condition: 'إتاحة مرحلة الصناعة وتجهيز منطقة الإنتاج', description: 'هضبة واسعة ورصيف خشبي، تنتظر ورش الإنتاج والتوسع في مراحل لاحقة.' },
];
export function regionAt(x: number, y: number) { return regions.find(r => x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h); }