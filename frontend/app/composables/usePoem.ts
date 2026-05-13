import type { Poet, Poem, Work, Excerpt } from '@/types/knowledgeBaseTypes';
import {
  filterActiveItems,
  parseIdentifierTokens,
  extractAuthorTokens,
  getEntityThemeTokens,
} from '@/utils/variantUtils';

export const usePoem = () => {
  const {
    selectedWorkId,
    selectedExcerptId,
    selectedPoetId,
    selectedPoemId,
    // selectedThemeId,
  } = useVariantState();

  const { works, poets } = useKnowledgeBase();

  /** Выбранное произведение */
  const selectedWork = computed<Work | null>(
    () =>
      works.value.find((w) => w.id === selectedWorkId.value) ||
      works.value[0] ||
      null,
  );

  /** Выбранный отрывок (первый активный, отсортированный по order) */
  const selectedExcerpt = computed<Excerpt | null>(() => {
    const excerpts = filterActiveItems(selectedWork.value?.excerpts || []).sort(
      (a, b) => (a.order ?? 0) - (b.order ?? 0),
    );
    return (
      excerpts.find((e) => e.id === selectedExcerptId.value) ||
      excerpts[0] ||
      null
    );
  });

  /** Выбранный поэт */
  const selectedPoet = computed<Poet | null>(
    () =>
      poets.value.find((p) => p.id === selectedPoetId.value) ||
      poets.value[0] ||
      null,
  );

  /**
   * Доступные поэты.
   * Исключаем тех, чей authorId совпадает с автором выбранного произведения
   * или с authorId выбранного отрывка.
   * Если после фильтрации список пуст — возвращаем всех.
   */
  const availablePoets = computed<Poet[]>(() => {
    const workAuthorTokens = new Set([
      ...parseIdentifierTokens(selectedWork.value?.authorId),
      ...extractAuthorTokens(selectedExcerpt.value),
    ]);

    if (!workAuthorTokens.size) return poets.value;

    const filtered = poets.value.filter((poet) => {
      const poetTokens = parseIdentifierTokens(poet.authorId);
      return !poetTokens.some((t) => workAuthorTokens.has(t));
    });

    return filtered.length > 0 ? filtered : poets.value;
  });

  /**
   * Доступные стихотворения.
   * Исключаем те, чьи темы (из task10) или автор пересекаются
   * с темами/автором выбранного отрывка.
   */
  const availablePoems = computed<Poem[]>(() => {
    const allPoems = filterActiveItems(selectedPoet.value?.poems || []);

    const excerptThemeTokens = new Set(
      getEntityThemeTokens(selectedExcerpt.value),
    );
    const excerptAuthorTokens = new Set([
      ...parseIdentifierTokens(selectedWork.value?.authorId),
      ...extractAuthorTokens(selectedExcerpt.value),
    ]);

    if (!excerptThemeTokens.size && !excerptAuthorTokens.size) {
      return allPoems;
    }

    return allPoems.filter((poem) => {
      // Исключаем по теме
      if (excerptThemeTokens.size) {
        const poemThemeTokens = getEntityThemeTokens(poem);
        if (poemThemeTokens.some((t) => excerptThemeTokens.has(t)))
          return false;
      }

      // Исключаем по автору
      if (excerptAuthorTokens.size) {
        const poetAuthorTokens = parseIdentifierTokens(
          selectedPoet.value?.authorId,
        );
        if (poetAuthorTokens.some((t) => excerptAuthorTokens.has(t)))
          return false;
      }

      return true;
    });
  });

  /** Выбранное стихотворение */
  const selectedPoem = computed<Poem | null>(() => {
    const poems = availablePoems.value;
    return poems.find((p) => p.id === selectedPoemId.value) || poems[0] || null;
  });

  return {
    // Отфильтрованные списки
    availablePoets,
    availablePoems,
  };
};
