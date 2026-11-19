import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

/** False during server render and hydration, true afterwards. Use to show values read from localStorage. */
export function useHydrated() {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
}
