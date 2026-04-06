/**
 * Patches navigator.locks.request to prevent Supabase auth deadlocks.
 *
 * Supabase auth-js uses navigator.locks for token refresh coordination.
 * In dev mode with HMR, or when multiple components call getSession()
 * concurrently, the locks deadlock with:
 *   "Lock broken by another request with the 'steal' option"
 *
 * This patch runs the callback immediately without acquiring a real lock,
 * which is safe for single-tab usage.
 *
 * Import this file as early as possible (before any Supabase client creation).
 */
if (typeof window !== 'undefined') {
  if (!(window as unknown as Record<string, unknown>).__locks_patched && navigator?.locks?.request) {
    (window as unknown as Record<string, unknown>).__locks_patched = true;

    navigator.locks.request = (async (
      _name: string,
      optionsOrCb: LockOptions | ((lock: Lock | null) => Promise<unknown>),
      maybeCb?: (lock: Lock | null) => Promise<unknown>,
    ): Promise<unknown> => {
      const cb = typeof optionsOrCb === 'function' ? optionsOrCb : maybeCb;
      if (cb) return cb(null);
      return undefined;
    }) as typeof navigator.locks.request;
  }
}

export {};
