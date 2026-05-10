import type { KnowledgeBasePayload } from '~/stores/knowledgeBase';
import crypto from 'crypto';

interface CacheMeta {
  redisEnabled: boolean;
  key: string;
  exists: boolean;
  sizeBytes: number;
  updatedAt: string;
}

async function getBackendFingerprint(config: any): Promise<string | null> {
  try {
    const cacheMeta = await $fetch<CacheMeta>(
      `${config.apiBackendUrl}/knowledge-base/cache/meta`,
      { ignoreResponseError: true },
    );

    if (cacheMeta?.exists) {
      return `${cacheMeta.sizeBytes}:${cacheMeta.updatedAt}`;
    }
  } catch (error) {
    console.error('[KB] Failed to fetch cache meta:', error);
  }

  return null;
}

export default defineCachedEventHandler(
  async (event) => {
    const config = useRuntimeConfig();

    // 1. Получаем текущий фингерпринт бэкенда
    const currentFingerprint = await getBackendFingerprint(config);

    // 2. Проверяем сохранённый кеш в Redis
    const cached = await useStorage('cache').getItem<{
      payload: KnowledgeBasePayload;
      fingerprint: string;
    }>('knowledge-base');

    // 3. Если фингерпринт совпадает — отдаём кеш
    if (cached && cached.fingerprint === currentFingerprint) {
      return cached.payload;
    }

    // 4. Данные изменились — полный запрос к бэкенду
    console.log('[KB] Cache miss, fetching full data...');
    const rawPayload = await $fetch<KnowledgeBasePayload>(
      `${config.apiBackendUrl}/knowledge-base`,
    );

    // 5. Обогащаем payload (хеш, метаданные, подсчёт вариантов)
    const enrichedPayload = enrichPayload(rawPayload);

    // 6. Сохраняем в Redis
    await useStorage('cache').setItem('knowledge-base', {
      payload: enrichedPayload,
      fingerprint: currentFingerprint,
    });

    console.log('[KB] Cache updated');
    return enrichedPayload;
  },
  {
    maxAge: 50, // 50 секунд кеш на стороне Nitro
    swr: true, // после 50с отдаёт stale + фоново обновляет
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