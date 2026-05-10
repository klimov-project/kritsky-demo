import type { KnowledgeBasePayload } from '~/stores/knowledgeBase';
import crypto from 'crypto';

interface CacheMeta {
  redisEnabled: boolean;
  key: string;
  exists: boolean;
  sizeBytes: number;
  updatedAt: string;
}

let backendCacheFingerprint: string | null = null;
let lastMetaCheck = 0;
const META_CHECK_INTERVAL = 50_000; // 50 секунд для теста
const META_CACHE_TTL = 50; // 50 секунд

async function getBackendFingerprint(config: any): Promise<string | null> {
  const now = Date.now();

  if (now - lastMetaCheck < META_CHECK_INTERVAL) {
    return backendCacheFingerprint;
  }

  try {
    const cacheMeta = await $fetch<CacheMeta>(
      `${config.apiBackendUrl}/knowledge-base/cache/meta`,
      { ignoreResponseError: true },
    );

    if (cacheMeta?.exists) {
      backendCacheFingerprint = `${cacheMeta.sizeBytes}:${cacheMeta.updatedAt}`;
      lastMetaCheck = now;
      console.log('[KB] Fingerprint updated:', backendCacheFingerprint);
      return backendCacheFingerprint;
    }
  } catch (error) {
    console.error('[KB] Failed to fetch cache meta:', error);
  }

  return backendCacheFingerprint;
}

async function updateKbCache(config: any) {
  const currentFingerprint = await getBackendFingerprint(config);

  const cached = await useStorage('cache').getItem<{
    payload: KnowledgeBasePayload;
    fingerprint: string;
  }>('knowledge-base');

  // Если фингерпринт совпадает — не обновляем
  if (cached && cached.fingerprint === currentFingerprint) {
    return;
  }

  // Данные изменились — делаем полный запрос
  console.log('[KB] Cache miss, fetching full data...');
  const rawPayload = await $fetch<KnowledgeBasePayload>(
    `${config.apiBackendUrl}/knowledge-base`,
  );

  const enrichedPayload = enrichPayload(rawPayload);

  await useStorage('cache').setItem('knowledge-base', {
    payload: enrichedPayload,
    fingerprint: currentFingerprint,
  });

  console.log('[KB] Cache updated');
}

// Фоновая задача обновления кеша
let updateInterval: NodeJS.Timeout | null = null;

function startBackgroundUpdate(config: any) {
  if (updateInterval) return;

  // Не запускаем фоновое обновление во время пререндеринга/билда
  if (import.meta.prerender) {
    console.log('[KB] Skipping background update during prerender');
    return;
  }

  updateKbCache(config);

  updateInterval = setInterval(() => {
    updateKbCache(config);
  }, META_CHECK_INTERVAL);

  console.log(`[KB] Background update started, interval: ${META_CHECK_INTERVAL}ms`);
}

// Инициализация при первом вызове
let initialized = false;

export default defineCachedEventHandler(
  async (event) => {
    const config = useRuntimeConfig();

    // Запускаем фоновое обновление при первом запросе
    if (!initialized) {
      startBackgroundUpdate(config);
      initialized = true;
    }

    // Отдаём данные из Redis (или обновляем синхронно при первом запросе)
    const cached = await useStorage('cache').getItem<{
      payload: KnowledgeBasePayload;
      fingerprint: string;
    }>('knowledge-base');

    if (cached) {
      return cached.payload;
    }

    // Если кеша нет (первый запуск) — делаем синхронный запрос
    const currentFingerprint = await getBackendFingerprint(config);
    const rawPayload = await $fetch<KnowledgeBasePayload>(
      `${config.apiBackendUrl}/knowledge-base`,
    );

    const enrichedPayload = enrichPayload(rawPayload);

    await useStorage('cache').setItem('knowledge-base', {
      payload: enrichedPayload,
      fingerprint: currentFingerprint,
    });

    return enrichedPayload;
  },
  {
    maxAge: META_CACHE_TTL,
    swr: true,
    name: 'knowledge-base',
  },
);

function enrichPayload(payload: KnowledgeBasePayload) {
  const payloadString = JSON.stringify(payload);
  const currentHash = crypto
    .createHash('sha256')
    .update(payloadString)
    .digest('hex');

  return {
    ...payload,
    _metadata: {
      hash: currentHash,
      fetchedAt: new Date().toISOString(),
      computed: {
        variantsCount: calculateTotalVariants(payload),
        poetsCount: payload.poets?.length || 0,
        totalEntities:
          (payload.works?.length || 0) + (payload.poets?.length || 0),
      },
    },
  };
}
