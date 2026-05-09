import type { KnowledgeBasePayload } from '~/stores/knowledgeBase';
import crypto from 'crypto';

export default defineCachedEventHandler(
  async (event) => {
    const config = useRuntimeConfig();

    // 1. Проверяем мета-информацию кеша бэкенда
    const cacheMeta = await $fetch<{
      redisEnabled: boolean;
      key: string;
      exists: boolean;
      sizeBytes: number;
      updatedAt: string;
    }>(`${config.apiBackendUrl}/knowledge-base/cache/meta`, {
      ignoreResponseError: true,
    });

    // 2. Проверяем последний хеш из Redis
    const lastHash = await useStorage('redis').getItem('kb:last-hash');

    // 3. Если кеш бэкенда не изменился — отдаём свой закешированный ответ
    if (cacheMeta?.exists && lastHash === cacheMeta?.updatedAt) {
      const cached = await useStorage('cache').getItem('knowledge-base');
      console.log('Хеш не изменился, отдаём из кеша');
      if (cached) {
        return cached;
      }
    }

    // 4. Кеш изменился (или первый запуск) — делаем полный запрос
    const payload = await $fetch<KnowledgeBasePayload>(
      `${config.apiBackendUrl}/knowledge-base`,
    );

    // 5. Обогащаем и сохраняем
    const enrichedPayload = enrichPayload(payload);
    await useStorage('cache').setItem('knowledge-base', enrichedPayload);

    // 6. Сохраняем новый хеш и метаданные в Redis
    if (cacheMeta?.updatedAt) {
      await useStorage('redis').setItem('kb:last-hash', cacheMeta.updatedAt);
      await useStorage('redis').setItem('kb:meta', {
        hash: enrichedPayload._metadata.hash,
        updatedAt: cacheMeta.updatedAt,
        fetchedAt: enrichedPayload._metadata.fetchedAt,
        sizeBytes: cacheMeta.sizeBytes,
      });
    }

    return enrichedPayload;
  },
  {
    maxAge: 60 * 5,
    swr: true,
    name: 'knowledge-base',
  },
);
