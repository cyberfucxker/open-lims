/** Simulates network latency for mock endpoints so loading states are exercised. */
export function delay(ms: number = 500 + Math.round(Math.random() * 350)) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}
