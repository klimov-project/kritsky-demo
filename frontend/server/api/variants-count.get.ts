export default defineEventHandler(async (event) => {
  const storage = useStorage();
  const CACHE_KEYS = {
    hash: 'cache:kb-hash-for-count',
    count: 'cache:variants-count',
  } as const;

  const kb = await $fetch('/api/knowledge-base');
  const currentHash = simpleHash(kb);
  console.log(' 1 — kb fetchted, currentHash: ', currentHash);

  // Проверяем кэш
  const [cachedHash, cachedCount] = await Promise.all([
    storage.getItem(CACHE_KEYS.hash),
    storage.getItem(CACHE_KEYS.count),
  ]);

  const isCacheValid =
    String(cachedHash) === currentHash && cachedCount != null;

  if (isCacheValid) {
    console.log(' 2 — serving from cache');
    return Number(cachedCount);
  }

  console.log(' 3 — recalculating');

  // Пересчитываем и обновляем кэш
  const count = calculateTotalVariants(kb);

  await Promise.all([
    storage.setItem(CACHE_KEYS.hash, currentHash),
    storage.setItem(CACHE_KEYS.count, String(count)),
  ]);

  return count;
});

function simpleHash(obj: unknown): string {
  const str = JSON.stringify(obj);
  let hash = 0;

  for (let i = 0; i < str.length; i++) {
    hash = (Math.imul(31, hash) + str.charCodeAt(i)) | 0;
  }

  return String(hash);
}
