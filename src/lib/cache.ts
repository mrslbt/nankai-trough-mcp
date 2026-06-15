interface CacheEntry<T> { data: T; expires: number; }
const store = new Map<string, CacheEntry<unknown>>();

export const TTL = {
  GEOCODE: 30 * 24 * 60 * 60 * 1000, // 30 days; an address's coordinates don't move
};

export async function getOrFetch<T>(key: string, ttlMs: number, fn: () => Promise<T>): Promise<T> {
  const hit = store.get(key);
  if (hit && Date.now() < hit.expires) return hit.data as T;
  const data = await fn();
  store.set(key, { data, expires: Date.now() + ttlMs });
  return data;
}
