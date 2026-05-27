import type { KnowledgeBasePayload } from '~/types/knowledgeBaseTypes';
import crypto from 'crypto';

interface CacheMeta {
  redisEnabled: boolean;
  key: string;
  exists: boolean;
  sizeBytes: number;
  updatedAt: string;
}
const maxAgeNitro = 360;

async function getBackendFingerprint(
  backendUrl: string,
): Promise<string | null> {
  try {
    const cacheMeta = await $fetch<CacheMeta>(
      `${backendUrl}/knowledge-base/cache/meta`,
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

    const backendUrl =
      import.meta.server && !import.meta.dev
        ? `${config.apiBackendBase}/api`
        : config.apiBackendUrl;

    // 1. Получаем текущий фингерпринт бэкенда
    const currentFingerprint = await getBackendFingerprint(backendUrl);

    console.log('currentFingerprint: ', currentFingerprint);
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
    const rawPayload = await $fetch<any>(`${backendUrl}/knowledge-base`);

    // 5. Преобразуем тяжёлый backend payload в лёгкий frontend payload
    const lightPayload = transformToKnowledgeBasePayload(rawPayload);
    const enrichedPayload = enrichPayload(lightPayload, rawPayload);
    console.log('[KB] Enriched payload keys:', Object.keys(enrichedPayload));
    console.log('[KB] _metadata exists:', !!enrichedPayload._metadata);
    console.log(
      '[KB] _metadata.computed:',
      enrichedPayload._metadata?.computed,
    );

    // 6. Сохраняем в Redis
    await useStorage('cache').setItem('knowledge-base', {
      payload: enrichedPayload,
      fingerprint: currentFingerprint,
    });

    console.log('[KB] Cache updated');
    return enrichedPayload;
  },
  {
    maxAge: maxAgeNitro,
    swr: true,
    name: 'knowledge-base',
  },
);

function enrichPayload(payload: KnowledgeBasePayload, rawPayload?: any) {
  const payloadString = JSON.stringify(payload);
  const currentHash = crypto
    .createHash('sha256')
    .update(payloadString)
    .digest('hex');

  const normalized = normalizeKnowledgeBasePayload(payload);

  return {
    ...normalized,
    _metadata: {
      hash: currentHash,
      fetchedAt: new Date().toISOString(),
      computed: {
        variantsCount: calculateTotalVariants(rawPayload || payload),
        poetsCount: payload.poets?.length || 0,
        totalEntities:
          (payload.works?.length || 0) + (payload.poets?.length || 0),
      },
    },
  };
}
