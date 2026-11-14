import { describe, expect, it } from 'vitest';
import { regions, regionAt } from './regions';
import { findPath, isWalkable } from './world';

describe('Island access', () => {
  it('keeps the four expansion regions locked', () => {
    expect(regions.map(r => r.id)).toEqual(['forest', 'mines', 'pasture', 'workshops']);
    expect(regions.every(r => r.locked && r.condition.length > 0)).toBe(true);
  });
  it('detects each island and rejects walking into it', () => {
    for (const r of regions) {
      const x = r.x + r.w / 2, y = r.y + r.h / 2;
      expect(regionAt(x, y)?.id).toBe(r.id);
      expect(isWalkable(x, y)).toBe(false);
      expect(findPath({ x: 936, y: 632 }, { x, y })).toEqual([]);
    }
  });
  it('reaches every locked region approach from the main farm', () => {
    for (const r of regions) expect(findPath({ x: 936, y: 632 }, r.approach).length, r.id).toBeGreaterThan(0);
  });
  it('blocks the sea and corner shore water', () => {
    for (const [x = 0, y = 0] of [[-20, 500], [1500, 700], [100, 100], [1400, 1300]]) expect(isWalkable(x, y)).toBe(false);
  });
});