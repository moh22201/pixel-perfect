import { describe, expect, it } from 'vitest';
import { applyDemoAction, createDemoState } from './demo-store';

describe('local demo game systems', () => {
  it('plants a crop, consumes its seed, and harvests into inventory', () => {
    const initial = createDemoState();
    const planted = applyDemoAction(initial, { type: 'plant', field: 1, crop: 'wheat' });
    expect(planted.ok).toBe(true);
    expect(planted.state.inventory['wheat_seed']).toBe(11);
    expect(planted.state.fields[0]?.crop).toBe('wheat');

    const readyState = structuredClone(planted.state);
    readyState.fields[0]!.readyAt = Date.now() - 1;
    const harvested = applyDemoAction(readyState, { type: 'harvest', field: 1 });
    expect(harvested.ok).toBe(true);
    expect(harvested.state.inventory['wheat']).toBe(3);
    expect(harvested.state.fields[0]?.crop).toBeNull();
  });

  it('rejects planting without seeds and does not mutate the previous state', () => {
    const initial = createDemoState();
    initial.inventory['wheat_seed'] = 0;
    const result = applyDemoAction(initial, { type: 'plant', field: 1, crop: 'wheat' });
    expect(result.ok).toBe(false);
    expect(result.state.fields[0]?.crop).toBeNull();
  });

  it('runs a production recipe after purchasing the building', () => {
    const initial = createDemoState();
    initial.level = 2;
    const purchased = applyDemoAction(initial, { type: 'buy-building', building: 'mill' });
    expect(purchased.ok).toBe(true);
    const started = applyDemoAction(purchased.state, { type: 'start-recipe', building: 'mill' });
    expect(started.ok).toBe(true);
    const readyState = structuredClone(started.state);
    readyState.buildings.mill.readyAt = Date.now() - 1;
    const collected = applyDemoAction(readyState, { type: 'collect-recipe', building: 'mill' });
    expect(collected.ok).toBe(true);
    expect(collected.state.inventory['flour']).toBe(1);
  });

  it('keeps marketplace listings local and restores inventory when cancelled', () => {
    const initial = createDemoState();
    initial.inventory['wheat'] = 5;
    const listed = applyDemoAction(initial, { type: 'list-item', item: 'wheat', quantity: 2 });
    expect(listed.ok).toBe(true);
    expect(listed.state.inventory['wheat']).toBe(3);
    const cancelled = applyDemoAction(listed.state, { type: 'cancel-listing', id: listed.state.listings[0]!.id });
    expect(cancelled.ok).toBe(true);
    expect(cancelled.state.inventory['wheat']).toBe(5);
  });
});
