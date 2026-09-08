export interface ConnectivitySubscription {
  (online: boolean): void;
}

export interface ConnectivityProbe {
  start(): void;
  stop(): void;
  subscribe(subscription: ConnectivitySubscription): () => void;
  readonly online: boolean;
  readonly onlineSince: number | null;
  readonly offlineSince: number | null;
}

/**
 * Periodic backend reachability probe. `navigator.onLine` only reflects the
 * local stack's view of network state; the authoritative signal here is a
 * successful round-trip to the Capacity Connect API. The probe keeps the
 * "Online Engine" indicator honest even when the network silently changes.
 */
export function createConnectivityProbe(
  probe: () => Promise<boolean>,
  intervalMs = 20000,
  initialOnline = true,
  timer: Pick<typeof globalThis, 'setInterval' | 'clearInterval'> = globalThis,
): ConnectivityProbe {
  let online = initialOnline;
  let onlineSince: number | null = initialOnline ? Date.now() : null;
  let offlineSince: number | null = initialOnline ? null : Date.now();
  let running = false;
  let intervalHandle: ReturnType<typeof setInterval> | null = null;
  const subscriptions = new Set<ConnectivitySubscription>();

  const notify = () => {
    const state = { online, onlineSince, offlineSince };
    subscriptions.forEach((subscription) => subscription(state.online));
  };

  const tick = async () => {
    let reachable: boolean;
    try {
      reachable = await probe();
    } catch {
      reachable = false;
    }
    const previouslyOnline = online;
    if (reachable === online) return;
    online = reachable;
    if (reachable) {
      onlineSince = Date.now();
      offlineSince = null;
    } else {
      offlineSince = Date.now();
      onlineSince = null;
    }
    if (previouslyOnline !== online) notify();
  };

  return {
    start() {
      if (running) return;
      running = true;
      void tick();
      intervalHandle = timer.setInterval(tick, intervalMs);
    },
    stop() {
      running = false;
      if (intervalHandle !== null) {
        timer.clearInterval(intervalHandle);
        intervalHandle = null;
      }
    },
    get online() {
      return online;
    },
    get onlineSince() {
      return onlineSince;
    },
    get offlineSince() {
      return offlineSince;
    },
    subscribe(subscription: ConnectivitySubscription) {
      subscriptions.add(subscription);
      subscription(online);
      return () => {
        subscriptions.delete(subscription);
      };
    },
  };
}