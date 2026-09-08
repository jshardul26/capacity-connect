import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createConnectivityProbe } from './connectivity';

class FakeTimer {
  now = 0;
  queue = new Map<number, () => void>();
  private counter = 0;

  setInterval(callback: () => void, _ms: number): number {
    const handle = ++this.counter;
    this.queue.set(handle, callback);
    return handle;
  }

  clearInterval(handle: number): void {
    this.queue.delete(handle);
  }

  elapse(ms: number): void {
    this.now += ms;
    Array.from(this.queue.values()).forEach((callback) => callback());
  }
}

const flush = () => new Promise<void>((resolve) => setTimeout(resolve, 0));

describe('createConnectivityProbe', () => {
  let fakeTimer: FakeTimer;
  let probe: ReturnType<typeof createConnectivityProbe>;

  beforeEach(() => {
    fakeTimer = new FakeTimer();
  });

  afterEach(() => {
    probe?.stop();
  });

  it('reports reachable backend as online and propagates state changes', async () => {
    const calls: boolean[] = [];
    const reachable = vi.fn().mockResolvedValue(true);
    probe = createConnectivityProbe(reachable as () => Promise<boolean>, 1000, true, fakeTimer as unknown as typeof globalThis);
    probe.subscribe((online) => calls.push(online));
    probe.start();
    await flush();
    expect(calls).toEqual([true]);
    expect(reachable).toHaveBeenCalled();
    expect(probe.online).toBe(true);
  });

  it('flips to offline when the API becomes unreachable and back when it recovers', async () => {
    let status = true;
    const reachable = vi.fn(async () => status);
    const states: boolean[] = [];
    probe = createConnectivityProbe(reachable as () => Promise<boolean>, 1000, true, fakeTimer as unknown as typeof globalThis);
    probe.subscribe((online) => states.push(online));
    probe.start();
    await flush();
    expect(probe.online).toBe(true);

    status = false;
    fakeTimer.elapse(1000);
    await flush();
    expect(probe.online).toBe(false);
    expect(probe.offlineSince).not.toBeNull();

    status = true;
    fakeTimer.elapse(1000);
    await flush();
    expect(probe.online).toBe(true);
    expect(probe.onlineSince).not.toBeNull();
    expect(states).toEqual([true, false, true]);
  });

  it('swallows thrown probes and counts the backend as unreachable', async () => {
    const reachable = vi.fn().mockRejectedValue(new Error('network down'));
    probe = createConnectivityProbe(reachable as () => Promise<boolean>, 5000, true, fakeTimer as unknown as typeof globalThis);
    probe.start();
    fakeTimer.elapse(5000);
    await flush();
    expect(probe.online).toBe(false);
  });

  it('stops polling after stop()', async () => {
    let status = true;
    const reachable = vi.fn(async () => status);
    probe = createConnectivityProbe(reachable as () => Promise<boolean>, 1000, true, fakeTimer as unknown as typeof globalThis);
    probe.stop();
    fakeTimer.elapse(3000);
    await flush();
    expect(probe.online).toBe(true);
  });
});

