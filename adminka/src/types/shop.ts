export type ProductCategoryKey = 'books' | 'posters' | 'figurines' | 'merch' | 'collections' | 'download_packs';

export type ProductFulfillment = 'DIGITAL' | 'PHYSICAL';

export interface CollectionProductConfig {
    authorId: string;
    authorName: string;
    variantsCount: number;
    collectionKind?: 'author_1_5' | 'full_variant';
}

export interface DownloadPackConfig {
    downloadsCount: number;
}

export interface GeneratedCollectionTask1 {
    prompt: string;
    answer: string;
}

export interface GeneratedCollectionTask2 {
    prompt: string;
    leftLabel: string;
    rightLabel: string;
    pairs: Array<{
        character: string;
        property: string;
    }>;
    rightOptions: string[];
    extraOption: string;
    answer: string;
}

export interface GeneratedCollectionTask3 {
    part1: string;
    part2: string;
    answer1: string;
    answer2: string;
}

export interface GeneratedCollectionEssayTask {
    prompt: string;
}

export interface GeneratedCollectionVariant {
    id: string;
    index: number;
    workTitle: string;
    author: string;
    excerptTitle: string;
    excerptText: string;
    task1?: GeneratedCollectionTask1 | null;
    task2?: GeneratedCollectionTask2 | null;
    task3?: GeneratedCollectionTask3 | null;
    task4_1?: GeneratedCollectionEssayTask | null;
    task4_2?: GeneratedCollectionEssayTask | null;
    task5?: GeneratedCollectionEssayTask | null;
}

export interface GeneratedCollectionPack {
    index: number;
    variants: GeneratedCollectionVariant[];
}

export interface GeneratedCollectionPayload {
    kind: 'author_collection_1_5' | 'full_variant_collection';
    authorId?: string;
    authorName?: string;
    variantsCount: number;
    packs: GeneratedCollectionPack[];
}

export interface ProductCategory {
    key: ProductCategoryKey;
    label: string;
}

export interface ShopProduct {
    id: string;
    title: string;
    description: string;
    author: string;
    price: number;
    category: ProductCategoryKey;
    fulfillment: ProductFulfillment;
    format?: string;
    ageLimit?: string;
    year?: number;
    pages?: number;
    isbn?: string;
    tags: string[];
    coverUrl?: string;
    gallery: string[];
    digitalFileName?: string;
    stats?: string;
    variantBundle?: VariantBundle;
    collectionConfig?: CollectionProductConfig;
    downloadPackConfig?: DownloadPackConfig;
}

export interface VariantBundle {
    packOptions: number[];
    excerptAuthors: string[];
    poemAuthors: string[];
}

export interface PurchasedProduct {
    id: string;
    productId: string;
    title: string;
    categoryLabel: string;
    purchasedAt: string;
    price: number;
    fulfillment: ProductFulfillment;
    coverUrl?: string;
}

export interface VariantGenerationMeta {
    theme: string;
    textSource: string;
    writingFormat: string;
    focus: string;
    difficulty: string;
    targetScore: string;
    duration: string;
}

export interface CreatedVariant {
    id: string;
    title: string;
    createdAt: string;
    status: 'Готов' | 'Черновик' | 'Отправлен';
    score?: string;
    topic: string;
    generationMeta: VariantGenerationMeta;
    sections: string[];
    selfCheckList: string[];
}

export interface FavoriteProduct {
    id: string;
    productId: string;
    title: string;
    subtitle: string;
    addedAt: string;
    coverUrl?: string;
}

export interface CartLineItem {
    id: string;
    bookId: string;
    quantity: number;
    lineTotal: number;
    book: ShopProduct;
}

export interface CartSummary {
    items: CartLineItem[];
    itemsCount: number;
    totalAmount: number;
}

export interface CheckoutPayload {
    deliveryType: 'with_delivery' | 'without_delivery';
    deliveryAddress?: string;
    recipientName?: string;
    recipientPhone?: string;
    paymentMethod?: string;
}

export interface CheckoutResult {
    orderId: number;
    paymentId: string;
    status: string;
    totalAmount: number;
    deliveryAmount: number;
}

export interface PurchasedItem {
    id: string;
    orderId: string;
    title: string;
    description?: string;
    author?: string;
    category: ProductCategoryKey;
    purchasedAt: string;
    price: number;
    quantity: number;
    total: number;
    fulfillment: ProductFulfillment;
    coverUrl?: string;
    digitalFileName?: string;
    bookId?: string;
    collectionConfig?: CollectionProductConfig;
    downloadPackConfig?: DownloadPackConfig;
    generatedCollection?: GeneratedCollectionPayload;
}

export type PaymentHistoryKind = 'subscription' | 'download_pack' | 'shop';

export interface PaymentHistoryItem {
    id: string;
    paymentId?: string;
    orderId?: string;
    amount: number;
    status?: string;
    method?: string;
    kind: PaymentHistoryKind;
    createdAt: string;
}
