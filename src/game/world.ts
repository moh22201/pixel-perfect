import PF from 'pathfinding';

export const WORLD_SIZE = 1536;
export const CELL = 16;
export type Point = { x: number; y: number };
export type WorldObject = { id: string; name: string; kind: 'home' | 'storage' | 'barn' | 'field' | 'region'; x: number; y: number; w: number; h: number; approach: Point };
export const objects: WorldObject[] = [
  { id: 'home', name: 'بيت المزارع', kind: 'home', x: 896, y: 168, w: 240, h: 248, approach: { x: 1000, y: 448 } },
  { id: 'storage', name: 'المخزن', kind: 'storage', x: 1250, y: 548, w: 155, h: 166, approach: { x: 1304, y: 752 } },
  { id: 'barn', name: 'الحظيرة', kind: 'barn', x: 1024, y: 772, w: 240, h: 268, approach: { x: 1128, y: 1080 } },
  ...Array.from({ length: 9 }, (_, i) => ({ id: `field-${i + 1}`, name: `الحقل ${i + 1}`, kind: 'field' as const, x: 522 + (i % 3) * 124, y: 662 + Math.floor(i / 3) * 114, w: 110, h: 100, approach: { x: 576 + (i % 3) * 124, y: 776 + Math.floor(i / 3) * 114 } })),
];
const trees: [number, number, number][] = [ [125,200,90], [250,230,85], [345,135,85], [470,130,70], [595,245,65], [1185,175,55], [1370,255,65], [130,340,80], [160,535,75], [155,720,85], [130,950,65], [320,1110,75], [175,1235,70], [330,1250,65], [545,1240,80], [700,1210,55], [1035,1200,65], [1180,1270,75], [1380,970,65], [1405,1140,50], [1450,820,48] ];
export function isWalkable(x: number, y: number) {
  if (x < 92 || x > 1440 || y < 92 || y > 1344) return false;
  // Conservative shoreline: the surrounding sea is never navigation ground.
  const shore = [[96,240], [240,112], [480,96], [1120,96], [1360,160], [1440,320], [1440,1100], [1320,1280], [1100,1344], [300,1344], [120,1200], [92,900]];
  let inside = false;
  for (let i = 0, j = shore.length - 1; i < shore.length; j = i++) {
    const a = shore[i], b = shore[j];
    if (!a || !b) continue;
    const [ax = 0, ay = 0] = a, [bx = 0, by = 0] = b;
    if ((ay > y) !== (by > y) && x < (bx - ax) * (y - ay) / (by - ay) + ax) inside = !inside;
  }
  if (!inside) return false;
  if (((x - 530) / 207) ** 2 + ((y - 476) / 153) ** 2 < 1.15) return false;
  if (objects.some(o => o.kind !== 'field' && x > o.x - 12 && x < o.x + o.w + 12 && y > o.y - 8 && y < o.y + o.h + 12)) return false;
  // Fence around the barn; its southwest opening remains passable.
  if (x > 1280 && x < 1336 && y > 848 && y < 1088) return false;
  if (x > 1190 && x < 1320 && y > 1056 && y < 1090) return false;
  if (trees.some(([tx, ty, radius]) => Math.hypot(x - tx, y - ty) < radius + 16)) return false;
  if (Math.hypot(x - 308, y - 908) < 35 || Math.hypot(x - 1308, y - 500) < 33) return false;
  return true;
}
export function createGrid() {
  return new PF.Grid(Array.from({ length: WORLD_SIZE / CELL }, (_, row) => Array.from({ length: WORLD_SIZE / CELL }, (_, col) => isWalkable(col * CELL + 8, row * CELL + 8) ? 0 : 1)));
}
export function findPath(from: Point, to: Point): Point[] {
  const grid = createGrid();
  const sx = Math.floor(from.x / CELL), sy = Math.floor(from.y / CELL);
  const tx = Math.floor(to.x / CELL), ty = Math.floor(to.y / CELL);
  if (!grid.isInside(tx, ty) || !grid.isWalkableAt(tx, ty)) return [];
  return new PF.AStarFinder({ allowDiagonal: true, dontCrossCorners: true }).findPath(sx, sy, tx, ty, grid).slice(1).flatMap(([x, y]) => x === undefined || y === undefined ? [] : [{ x: x * CELL + 8, y: y * CELL + 8 }]);
}