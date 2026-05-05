import { calculateTotalVariants } from '../utils/calculate-variants';

export default defineEventHandler(async (event) => {
  // Use the local cached API route to get knowledge-base
  // This ensures we benefit from the Nitro caching implemented there
  const kb = await $fetch('/api/knowledge-base');
  
  // We can still use a simple in-memory cache here for the count itself 
  // to avoid re-calculating on every request if kb hasn't changed
  const storage = useStorage();
  const cacheKey = 'cache:variants-count';
  const kbHashKey = 'cache:kb-hash-for-count';
  
  const currentKbHash = simpleHash(kb);
  const cachedHash = await storage.getItem(kbHashKey);
  const cachedCount = await storage.getItem(cacheKey);

  if (cachedHash === currentKbHash && cachedCount !== null) {
    return cachedCount;
  }

  const count = calculateTotalVariants(kb);
  
  await storage.setItem(kbHashKey, currentKbHash);
  await storage.setItem(cacheKey, count);

  return count;
});

function simpleHash(obj: any): string {
  const str = JSON.stringify(obj);
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
  }
  return String(h);
}
