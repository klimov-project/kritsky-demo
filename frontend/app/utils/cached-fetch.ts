export type CachedFetchOptions = {
  key?: string;
  force?: boolean;
  maxAge?: number;
};

type CachedEntry<T> = {
  data: T;
  timestamp: number;
};

export async function cachedFetch<T = unknown>(
  url: string,
  options: CachedFetchOptions = {},
): Promise<T> {
  const cacheKey = `cached-fetch:${options.key ?? url}`;
  const maxAge = options.maxAge ?? 1000 * 60 * 5;
  const now = Date.now();

  if (!options.force) {
    if (process.server) {
      const storage = useStorage();
      const cached = await storage.getItem<CachedEntry<T>>(cacheKey);
      if (cached && cached.timestamp + maxAge > now) {
        return cached.data;
      }
    }

    if (process.client) {
      try {
        const raw = window.localStorage.getItem(cacheKey);
        if (raw) {
          const cached = JSON.parse(raw) as CachedEntry<T>;
          if (cached.timestamp + maxAge > now) {
            return cached.data;
          }
        }
      } catch {
        // Ignore malformed cache entries.
      }
    }
  }

  const response = await $fetch<T>(url);
  const payload: CachedEntry<T> = { data: response, timestamp: now };

  if (process.server) {
    const storage = useStorage();
    await storage.setItem(cacheKey, payload);
  }

  if (process.client) {
    try {
      window.localStorage.setItem(cacheKey, JSON.stringify(payload));
    } catch {
      // Ignore storage quotas.
    }
  }

  return response;
}
