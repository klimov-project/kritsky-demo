import type { KnowledgeBasePayload } from '~/stores/knowledgeBase';

export default defineEventHandler(async () => {
  const storage = useStorage();
  const cacheKey = 'cache:knowledge-base';
  const metaKey = 'cache:knowledge-base-meta';
  const ttl = 1000 * 60 * 5;
  const now = Date.now();

  const cached = await storage.getItem<KnowledgeBasePayload>(cacheKey);
  const meta = await storage.getItem<{ expiresAt: number }>(metaKey);

  if (cached && meta?.expiresAt && meta.expiresAt > now) {
    return cached;
  }

  const config = useRuntimeConfig();
  const apiUrl = `${config.apiBackendBase}/api/knowledge-base`;

  const payload = await $fetch<KnowledgeBasePayload>(apiUrl);
  const fetchedAt = new Date().toISOString();
  const cachedPayload = {
    ...payload,
    fetchedAt,
  };

  await storage.setItem(cacheKey, cachedPayload);
  await storage.setItem(metaKey, { expiresAt: now + ttl });

  return cachedPayload;
});