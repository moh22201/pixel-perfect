import { describe, expect, it } from 'vitest';
import { findPath, isWalkable, objects } from './world';

describe('Farm world movement rules', () => {
  it('blocks the cottage, pond, trees, and map exterior', () => {
    expect(isWalkable(1000, 300)).toBe(false);
    expect(isWalkable(530, 476)).toBe(false);
    expect(isWalkable(595, 245)).toBe(false);
    expect(isWalkable(20, 500)).toBe(false);
  });
  it('finds traversable paths to every field and building interaction point', () => {
    for (const object of objects) {
      const path = findPath({ x: 936, y: 632 }, object.approach);
      expect(path.length, object.id).toBeGreaterThan(0);
      expect(path.every(p => isWalkable(p.x, p.y)), object.id).toBe(true);
    }
  });
  it('routes around the pond rather than crossing water', () => {
    const path = findPath({ x: 296, y: 488 }, { x: 760, y: 488 });
    expect(path.length).toBeGreaterThan(30);
    expect(path.every(p => isWalkable(p.x, p.y))).toBe(true);
  });
  it('rejects clicks inside solid buildings', () => {
    expect(findPath({ x: 936, y: 632 }, { x: 1000, y: 300 })).toEqual([]);
  });
});