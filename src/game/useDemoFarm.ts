import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { applyDemoAction, createDemoState, DEMO_STORAGE_KEY, type DemoAction, type DemoState } from './demo-store';

export function useDemoFarm() {
  const [state, setState] = useState<DemoState>(createDemoState);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(DEMO_STORAGE_KEY);
      if (saved) {
        const parsed: unknown = JSON.parse(saved);
        if (parsed && typeof parsed === 'object' && 'fields' in parsed && 'inventory' in parsed) {
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
    let resultMessage = '';
    let succeeded = false;
    setState(previous => {
      const result = applyDemoAction(previous, action);
      resultMessage = result.message;
      succeeded = result.ok;
      return result.state;
    });
    // The message is presented by the caller; state changes remain local to this browser.
    return { get message() { return resultMessage; }, get ok() { return succeeded; } };
  }, []);

  const reset = useCallback(() => {
    const fresh = createDemoState();
    setState(fresh);
    try { window.localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(fresh)); } catch { /* storage may be unavailable */ }
  }, []);

  return { state, act, reset, hydrated };
}
