import type { KnowledgeBasePayload } from '~/stores/knowledgeBase';
import crypto from 'crypto';

interface CacheMeta {
  redisEnabled: boolean;
  key: string;
  exists: boolean;
  sizeBytes: number;
  updatedAt: string;
}

// Единый источник правды — мета-информация из бэкенда
let backendCacheFingerprint: string | null = null; // "sizeBytes:updatedAt"
let lastMetaCheck = 0;
const META_CHECK_INTERVAL = 5 * 60 * 1000; // 5 минут

async function getBackendFingerprint(config: any): Promise<string | null> {
  const now = Date.now();

  // Проверяем не чаще чем раз в 5 минут
  if (backendCacheFingerprint && now - lastMetaCheck < META_CHECK_INTERVAL) {
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
      return backendCacheFingerprint;
    }
  } catch (error) {
    console.error('Failed to fetch cache meta:', error);
  }

  return backendCacheFingerprint; // Возвращаем последний известный, если запрос упал
}

export default defineCachedEventHandler(
  async (event) => {
    const config = useRuntimeConfig();

    // 1. Получаем актуальный фингерпринт (с дедупликацией по времени)
    const currentFingerprint = await getBackendFingerprint(config);

    // 2. Проверяем сохранённые данные в Redis
    const cached = await useStorage('cache').getItem<{
      payload: KnowledgeBasePayload;
      fingerprint: string;
    }>('knowledge-base');

    // 3. Если фингерпринт совпадает — отдаём кеш
    if (cached && cached.fingerprint === currentFingerprint) {
      return cached.payload;
    }

    // 4. Данные изменились (или первый запуск) — полный запрос
    const rawPayload = await $fetch<KnowledgeBasePayload>(
      `${config.apiBackendUrl}/knowledge-base`,
    );

    // 5. Обогащаем
    const enrichedPayload = enrichPayload(rawPayload);

    // 6. Сохраняем в Redis и данные, и фингерпринт
    await useStorage('cache').setItem('knowledge-base', {
      payload: enrichedPayload,
      fingerprint: currentFingerprint,
    });

    return enrichedPayload;
  },
  {
    maxAge: 60 * 5,
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
