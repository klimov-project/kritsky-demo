import type { KnowledgeBasePayload } from '~/stores/knowledgeBase';
import crypto from 'crypto';

// Временная константа - последний известный хеш
// TODO: Заменить на реальный хеш после первого запроса
const LAST_KNOWN_HASH = '4d5179c23134a70bcce3c786ed1ef3bff5a9a77f4d85e6d0bcd19e61029beaaa'; // Будет заполнено после первого вывода в консоль

export default defineEventHandler(async () => {
  const storage = useStorage();
  const hashKey = 'cache:knowledge-base-hash';
  const ttl = 1000 * 60 * 5;
  const now = Date.now();

  // Получаем сохраненный хеш и его метаданные
  const cachedHash = await storage.getItem<string>(hashKey);
  const metaHashKey = 'cache:knowledge-base-hash-meta';
  const metaHash = await storage.getItem<{ expiresAt: number }>(metaHashKey);

  const config = useRuntimeConfig();

  console.log('knowledge-base.get.ts `/api/knowledge-base `');
  console.log('config.apiBackendUrl', config.apiBackendUrl);
  const apiUrl = `${config.apiBackendUrl}/knowledge-base`;

  const payload = await $fetch<KnowledgeBasePayload>(apiUrl);

  // Вычисляем хеш от полученного payload
  const payloadString = JSON.stringify(payload);
  const currentHash = crypto
    .createHash('sha256')
    .update(payloadString)
    .digest('hex');

  console.log('=== HASH INFORMATION ===');
  console.log('Current payload hash:', currentHash);
  console.log('Cached hash:', cachedHash || 'none');
  console.log('LAST_KNOWN_HASH constant:', LAST_KNOWN_HASH || 'not set');
  console.log('=== END HASH INFORMATION ===');

  // Если хеш совпадает с кешированным и кеш не истек - возвращаем заглушку с хешем
  if (cachedHash && metaHash?.expiresAt && metaHash.expiresAt > now) {
    if (cachedHash === currentHash) {
      console.log('Hash matched cached hash, returning hash-only response');
      return {
        _hash: currentHash,
        _fromCache: true,
      };
    }
  }

  // Если у нас есть константа последнего хеша и она совпадает
  if (LAST_KNOWN_HASH && LAST_KNOWN_HASH === currentHash) {
    console.log(
      'Hash matched LAST_KNOWN_HASH constant, returning hash-only response',
    );
    // Сохраняем хеш если его еще нет
    if (!cachedHash) {
      await storage.setItem(hashKey, currentHash);
      await storage.setItem(metaHashKey, { expiresAt: now + ttl });
    }
    return {
      _hash: currentHash,
      _fromCache: true,
    };
  }

  // Хеш отличается - сохраняем новый и возвращаем полный payload
  console.log('New payload detected, saving hash and returning full payload');

  const fetchedAt = new Date().toISOString();
  const fullPayload = {
    ...payload,
    fetchedAt,
    _hash: currentHash,
  };

  // Сохраняем только хеш
  await storage.setItem(hashKey, currentHash);
  await storage.setItem(metaHashKey, { expiresAt: now + ttl });

  return fullPayload;
});
