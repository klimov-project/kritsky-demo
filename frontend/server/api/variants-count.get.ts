import { calculateTotalVariants } from '../utils/calculate-variants';

// Простейшее in‑memory кеширование
let cachedCount: number | null = null;
let cachedHash: string | null = null;

export default defineEventHandler(async (event) => {
  // Получаем knowledge-base (можно просто импортировать json или сделать fetch)
  const kb = await $fetch('/api/knowledge-base', {
    baseURL: 'http://localhost:8000',
  });
  const hash = simpleHash(kb); // хеш содержимого

  // Если кеш не актуален – пересчитываем
  if (cachedHash !== hash || cachedCount === null) {
    cachedCount = calculateTotalVariants(kb);
    cachedHash = hash;
  }

  return cachedCount;
});

// Простая хеш-функция (можно использовать crypto)
function simpleHash(obj: any): string {
  const str = JSON.stringify(obj);
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
  }
  return String(h);
}
