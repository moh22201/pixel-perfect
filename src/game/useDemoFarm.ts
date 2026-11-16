import { useCallback, useEffect, useRef, useState } from 'react';
import { applyDemoAction, createDemoState, DEMO_STORAGE_KEY, type DemoAction, type DemoState } from './demo-store';

export function useDemoFarm() {
  const [state, setState] = useState<DemoState>(createDemoState);
  const stateRef = useRef(state);
  const [hydrated, setHydrated] = useState(false);
  stateRef.current = state;

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(DEMO_STORAGE_KEY);
      if (saved) {
        const parsed: unknown = JSON.parse(saved);
        if (parsed && typeof parsed === 'object' && 'fields' in parsed && 'inventory' in parsed) {
          stateRef.current = parsed as DemoState;
          setState(parsed as DemoState);
        }
      }
    } catch (error) {
      console.warn('[Little Acre] Could not load local demo save:', error);
    } finally {
      setHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
      console.warn('[Little Acre] Could not save local demo progress:', error);
    }
  }, [hydrated, state]);

  const act = useCallback((action: DemoAction) => {
    const result = applyDemoAction(stateRef.current, action);
    if (result.ok) {
      stateRef.current = result.state;
      setState(result.state);
    }
    return { message: result.message, ok: result.ok };
  }, []);

  const reset = useCallback(() => {
    const fresh = createDemoState();
    stateRef.current = fresh;
    setState(fresh);
    try { window.localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(fresh)); } catch { /* storage may be unavailable */ }
  }, []);

  return { state, act, reset, hydrated };
}
