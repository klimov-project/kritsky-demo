import type { Excerpt } from '@/types/knowledgeBaseTypes';

export const sortExcerptsByOrder = (excerpts: Excerpt[]): Excerpt[] => {
  return excerpts
    .map((excerpt, index) => ({ excerpt, index }))
    .sort((a, b) => {
      const orderA = Number.isFinite(a.excerpt.order)
        ? a.excerpt.order
        : a.index + 1;
      const orderB = Number.isFinite(b.excerpt.order)
        ? b.excerpt.order
        : b.index + 1;

      if (orderA !== orderB) {
        return orderA - orderB;
      }

      return a.index - b.index;
    })
    .map((entry) => entry.excerpt);
};
