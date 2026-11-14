/** Simulates real network latency so Phase-1 loading/skeleton states are exercised
 *  the same way they will be against the real API in Phase 2. */
export function delay<T>(value: T, ms = 500 + Math.random() * 400): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

export function delayVoid(ms = 500 + Math.random() * 400): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function newId(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`;
}
