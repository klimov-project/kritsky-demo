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
    const rawPayload = await $fetch<any>(
      `${config.apiBackendUrl}/knowledge-base`,
    );

    // 5. Преобразуем тяжёлый backend payload в лёгкий frontend payload
    const lightPayload = transformToKnowledgeBasePayload(rawPayload);
    const enrichedPayload = enrichPayload(lightPayload, rawPayload);
    console.log(
      'enrichedPayload computed: ',
      enrichedPayload._metadata.computed,
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
    swr: true, // После `maxAgeNitro` сек при запросе — отдаёт stale и фоново обновляет
    name: 'knowledge-base',
  },
);

function enrichPayload(payload: KnowledgeBasePayload, rawPayload?: any) {
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
        variantsCount: calculateTotalVariants(rawPayload || payload),
        poetsCount: payload.poets?.length || 0,
        totalEntities:
          (payload.works?.length || 0) + (payload.poets?.length || 0),
      },
    },
  };
}
