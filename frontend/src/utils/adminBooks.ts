import { DEFAULT_COLLECTION_KIND } from '@/consts/utils/adminBooks';
import type { KnowledgeBaseResponse } from '@/lib/knowledgeBaseApi';
import type {
    AdminBookPayload,
    AdminBooksDraftState,
    CollectionAuthorOption,
    CollectionKind,
    ProductRecord,
} from '@/types/api/adminBooks';
import type { ProductCategoryKey, ProductFulfillment } from '@/types/shop';

type ProductStatsSource = Omit<ProductRecord, 'stats'> & { stats?: string };

const parsePrice = (value: FormDataEntryValue | null): number => {
    const raw = String(value || '').trim().replace(',', '.');
    if (!raw) return 0;
    const parsed = Number(raw);
    return Number.isFinite(parsed) ? parsed : 0;
};

const parseNumber = (value: FormDataEntryValue | null): number | undefined => {
    const raw = String(value || '').trim();
    if (!raw) return undefined;
    const parsed = Number(raw);
    return Number.isFinite(parsed) ? parsed : undefined;
};

export const getProductStatsLabel = (item: ProductStatsSource): string => {
    if (item.collectionConfig) {
        return `${item.collectionConfig.authorName} • ${item.collectionConfig.variantsCount} вариантов`;
    }
    if (item.downloadPackConfig) {
        return `${item.downloadPackConfig.downloadsCount} скачиваний`;
    }
    return item.stats || '—';
};

export const toProductRecord = (item: ProductStatsSource): ProductRecord => ({
    ...item,
    stats: getProductStatsLabel(item),
});

export const buildCollectionAuthors = (
    knowledgeBase: Pick<KnowledgeBaseResponse, 'works'>,
): CollectionAuthorOption[] => {
    return Array.from(
        new Map(
            knowledgeBase.works
                .map((work) => ({
                    authorId: work.authorId?.trim() || '',
                    authorName: work.author?.trim() || '',
                    variantsCount: 10,
                }))
                .filter((item) => item.authorId && item.authorName)
                .map((item) => [item.authorId, item]),
        ).values(),
    );
};

export const buildShopBookPayload = (formData: FormData, previous?: ProductRecord): AdminBookPayload => {
    const category = String(formData.get('category') || 'books') as ProductCategoryKey;
    const fulfillment = String(formData.get('fulfillment') || 'PHYSICAL') as ProductFulfillment;

    return {
        title: String(formData.get('title') || '').trim(),
        description: String(formData.get('description') || '').trim(),
        author: String(formData.get('author') || '').trim(),
        price: parsePrice(formData.get('price')),
        category,
        fulfillment,
        format: String(formData.get('format') || '').trim() || undefined,
        ageLimit: String(formData.get('ageLimit') || '').trim() || undefined,
        year: parseNumber(formData.get('year')),
        pages: parseNumber(formData.get('pages')),
        isbn: String(formData.get('isbn') || '').trim() || undefined,
        tags: String(formData.get('tags') || '')
            .split(',')
            .map((tag) => tag.trim())
            .filter(Boolean),
        coverUrl: String(formData.get('coverUrl') || '').trim() || previous?.coverUrl,
        gallery: String(formData.get('gallery') || '')
            .split(',')
            .map((value) => value.trim())
            .filter(Boolean),
        digitalFileName: String(formData.get('digitalFileName') || '').trim() || undefined,
        marketplaces: [],
        collectionConfig:
            category === 'collections'
                ? (() => {
                      const authorId = String(formData.get('collectionAuthorId') || '').trim();
                      const authorName = String(formData.get('collectionAuthorName') || '').trim();
                      const variantsCount = Number(String(formData.get('collectionVariantsCount') || '').trim());
                      const collectionKind =
                          (String(formData.get('collectionKind') || DEFAULT_COLLECTION_KIND).trim() as CollectionKind) ||
                          DEFAULT_COLLECTION_KIND;

                      if (!Number.isFinite(variantsCount) || variantsCount <= 0) {
                          return undefined;
                      }

                      if (collectionKind === 'author_1_5' && (!authorId || !authorName)) {
                          return undefined;
                      }

                      return {
                          authorId,
                          authorName,
                          variantsCount,
                          collectionKind,
                      };
                  })()
                : undefined,
        downloadPackConfig:
            category === 'download_packs'
                ? (() => {
                      const downloadsCount = Number(String(formData.get('downloadPackCount') || '').trim());
                      if (!Number.isFinite(downloadsCount) || downloadsCount <= 0) {
                          return undefined;
                      }
                      return {
                          downloadsCount,
                      };
                  })()
                : undefined,
    };
};

export const getDraftStateFromProduct = (selectedProduct: ProductRecord | null): AdminBooksDraftState => ({
    category: selectedProduct?.category || 'books',
    fulfillment:
        selectedProduct?.fulfillment ||
        (selectedProduct?.category === 'collections' || selectedProduct?.category === 'download_packs'
            ? 'DIGITAL'
            : 'PHYSICAL'),
    collectionAuthorId: selectedProduct?.collectionConfig?.authorId || '',
    collectionKind: selectedProduct?.collectionConfig?.collectionKind || DEFAULT_COLLECTION_KIND,
    downloadPackCount: String(selectedProduct?.downloadPackConfig?.downloadsCount || 10),
});

export const getSelectedCollectionAuthorName = (
    collectionAuthors: CollectionAuthorOption[],
    draftCollectionAuthorId: string,
    selectedProduct: ProductRecord | null,
): string => {
    return (
        collectionAuthors.find((author) => author.authorId === draftCollectionAuthorId)?.authorName ||
        selectedProduct?.collectionConfig?.authorName ||
        ''
    );
};
