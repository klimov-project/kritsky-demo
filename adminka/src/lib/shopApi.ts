import { requestJson, requestJsonAuth } from '@/lib/http';
import type {
    CartLineItem,
    CartSummary,
    CollectionProductConfig,
    CheckoutPayload,
    CheckoutResult,
    DownloadPackConfig,
    GeneratedCollectionPayload,
    PaymentHistoryItem,
    ProductCategoryKey,
    ProductFulfillment,
    PurchasedItem,
    ShopProduct,
} from '@/types/shop';

interface MarketplaceLink {
    label: string;
    url: string;
}

interface ShopBookDto {
    id: number;
    title: string;
    description: string | null;
    author: string;
    price: number;
    category: string;
    fulfillment: string;
    format: string | null;
    ageLimit: string | null;
    year: number | null;
    pages: number | null;
    isbn: string | null;
    tags: string[];
    coverUrl: string | null;
    gallery: string[];
    digitalFileName: string | null;
    marketplaces: MarketplaceLink[];
    collectionConfig: CollectionProductConfig | null;
    downloadPackConfig: DownloadPackConfig | null;
}

interface ShopBooksListResponse {
    items: ShopBookDto[];
    total: number;
    limit: number;
    offset: number;
}

interface FavoriteBookItemDto {
    id: number;
    bookId: number;
    book: ShopBookDto;
}

interface FavoriteBooksListResponse {
    items: FavoriteBookItemDto[];
}

interface CartItemDto {
    id: number;
    bookId: number;
    quantity: number;
    lineTotal: number;
    book: ShopBookDto;
}

interface CartResponseDto {
    items: CartItemDto[];
    itemsCount: number;
    totalAmount: number;
}

interface CheckoutResponseDto {
    orderId: number;
    paymentId: string;
    status: string;
    totalAmount: number;
    deliveryAmount: number;
}

interface PurchasedItemDto {
    id: number;
    orderId: number;
    title: string;
    description: string | null;
    author: string | null;
    category: string;
    fulfillment: string;
    purchasedAt: string;
    price: number;
    quantity: number;
    total: number;
    coverUrl: string | null;
    digitalFileName: string | null;
    bookId: number | null;
    collectionConfig: CollectionProductConfig | null;
    downloadPackConfig: DownloadPackConfig | null;
    generatedCollection: GeneratedCollectionPayload | null;
}

interface PurchasedItemsListDto {
    items: PurchasedItemDto[];
    total?: number;
    limit?: number;
    page?: number;
    totalPages?: number;
    query?: string | null;
}

interface PaymentHistoryItemDto {
    id: number;
    paymentId: string | null;
    orderId: number | null;
    amount: number;
    status: string | null;
    method: string | null;
    kind: string;
    createdAt: string;
}

interface PaymentHistoryListDto {
    items: PaymentHistoryItemDto[];
}

export interface ShopProductExtended extends ShopProduct {
    id: string;
    marketplaces: MarketplaceLink[];
}

export interface ShopListParams {
    search?: string;
    category?: string;
    fulfillment?: string;
    limit?: number;
    offset?: number;
}

export interface ShopListResult {
    items: ShopProductExtended[];
    total: number;
    limit: number;
    offset: number;
}

export interface PurchasesListParams {
    limit?: number;
    page?: number;
    query?: string;
}

export interface PurchasesListResult {
    items: PurchasedItem[];
    total: number;
    limit: number;
    page: number;
    totalPages: number;
    query: string;
}

export interface ShopBookPayload {
    title: string;
    description?: string;
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
    marketplaces?: MarketplaceLink[];
    collectionConfig?: CollectionProductConfig;
    downloadPackConfig?: DownloadPackConfig;
}

const mapFulfillment = (value: string): ProductFulfillment => value.toUpperCase() === 'DIGITAL' ? 'DIGITAL' : 'PHYSICAL';

const mapCategory = (value: string): ProductCategoryKey => {
    if (value === 'books' || value === 'posters' || value === 'figurines' || value === 'merch' || value === 'collections' || value === 'download_packs') {
        return value;
    }
    return 'books';
};

const toProduct = (book: ShopBookDto): ShopProductExtended => ({
    id: String(book.id),
    title: book.title,
    description: book.description || '',
    author: book.author,
    price: Number(book.price),
    category: mapCategory(book.category),
    fulfillment: mapFulfillment(book.fulfillment),
    format: book.format || undefined,
    ageLimit: book.ageLimit || undefined,
    year: book.year || undefined,
    pages: book.pages || undefined,
    isbn: book.isbn || undefined,
    tags: Array.isArray(book.tags) ? book.tags : [],
    coverUrl: book.coverUrl || undefined,
    gallery: Array.isArray(book.gallery) ? book.gallery : [],
    digitalFileName: book.digitalFileName || undefined,
    marketplaces: Array.isArray(book.marketplaces) ? book.marketplaces : [],
    collectionConfig: book.collectionConfig || undefined,
    downloadPackConfig: book.downloadPackConfig || undefined,
});

const toPayload = (payload: ShopBookPayload) => ({
    ...payload,
    description: payload.description || '',
    format: payload.format || '',
    ageLimit: payload.ageLimit || '',
    isbn: payload.isbn || '',
    coverUrl: payload.coverUrl || '',
    digitalFileName: payload.digitalFileName || '',
    marketplaces: payload.marketplaces || [],
});

const toCartLineItem = (item: CartItemDto): CartLineItem => ({
    id: String(item.id),
    bookId: String(item.bookId),
    quantity: Number(item.quantity),
    lineTotal: Number(item.lineTotal),
    book: toProduct(item.book),
});

const toCartSummary = (payload: CartResponseDto): CartSummary => ({
    items: payload.items.map(toCartLineItem),
    itemsCount: Number(payload.itemsCount),
    totalAmount: Number(payload.totalAmount),
});

const toPurchasedItem = (item: PurchasedItemDto): PurchasedItem => ({
    id: String(item.id),
    orderId: String(item.orderId),
    title: item.title,
    description: item.description || undefined,
    author: item.author || undefined,
    category: mapCategory(item.category),
    purchasedAt: item.purchasedAt,
    price: Number(item.price),
    quantity: Number(item.quantity),
    total: Number(item.total),
    fulfillment: mapFulfillment(item.fulfillment),
    coverUrl: item.coverUrl || undefined,
    digitalFileName: item.digitalFileName || undefined,
    bookId: item.bookId == null ? undefined : String(item.bookId),
    collectionConfig: item.collectionConfig || undefined,
    downloadPackConfig: item.downloadPackConfig || undefined,
    generatedCollection: item.generatedCollection || undefined,
});

const toPaymentHistoryItem = (item: PaymentHistoryItemDto): PaymentHistoryItem => ({
    id: String(item.id),
    paymentId: item.paymentId || undefined,
    orderId: item.orderId == null ? undefined : String(item.orderId),
    amount: Number(item.amount),
    status: item.status || undefined,
    method: item.method || undefined,
    kind: item.kind === 'download_pack' || item.kind === 'subscription' ? item.kind : 'shop',
    createdAt: item.createdAt,
});

export const listShopProducts = async (params: ShopListParams = {}): Promise<ShopListResult> => {
    const query = new URLSearchParams();
    if (params.search) query.set('search', params.search);
    if (params.category) query.set('category', params.category);
    if (params.fulfillment) query.set('fulfillment', params.fulfillment);
    if (typeof params.limit === 'number') query.set('limit', String(params.limit));
    if (typeof params.offset === 'number') query.set('offset', String(params.offset));

    const suffix = query.toString();
    const response = await requestJson<ShopBooksListResponse>(`/api/v1/shop/books${suffix ? `?${suffix}` : ''}`);

    return {
        items: response.items.map(toProduct),
        total: response.total,
        limit: response.limit,
        offset: response.offset,
    };
};

export const getShopProductById = async (id: string | number): Promise<ShopProductExtended> => {
    const response = await requestJson<ShopBookDto>(`/api/v1/shop/books/${id}`);
    return toProduct(response);
};

export const listFavoriteProducts = async (): Promise<ShopProductExtended[]> => {
    const response = await requestJsonAuth<FavoriteBooksListResponse>('/api/v1/shop/favorites');
    return response.items.map((item) => toProduct(item.book));
};

export const listFavoriteProductIds = async (): Promise<Set<string>> => {
    const response = await requestJsonAuth<FavoriteBooksListResponse>('/api/v1/shop/favorites');
    return new Set(response.items.map((item) => String(item.bookId)));
};

export const addProductToFavorites = async (bookId: string | number): Promise<void> => {
    await requestJsonAuth<{ ok: boolean }>(`/api/v1/shop/favorites/${bookId}`, {
        method: 'POST',
    });
};

export const removeProductFromFavorites = async (bookId: string | number): Promise<void> => {
    await requestJsonAuth<{ ok: boolean }>(`/api/v1/shop/favorites/${bookId}`, {
        method: 'DELETE',
    });
};

export const getCart = async (): Promise<CartSummary> => {
    const response = await requestJsonAuth<CartResponseDto>('/api/v1/shop/cart');
    return toCartSummary(response);
};

export const addProductToCart = async (bookId: string | number, quantity = 1): Promise<CartSummary> => {
    const response = await requestJsonAuth<CartResponseDto>('/api/v1/shop/cart', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            bookId: Number(bookId),
            quantity,
        }),
    });
    return toCartSummary(response);
};

export const updateCartItemQuantity = async (bookId: string | number, quantity: number): Promise<CartSummary> => {
    const response = await requestJsonAuth<CartResponseDto>(`/api/v1/shop/cart/${bookId}`, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ quantity }),
    });
    return toCartSummary(response);
};

export const removeProductFromCart = async (bookId: string | number): Promise<CartSummary> => {
    const response = await requestJsonAuth<CartResponseDto>(`/api/v1/shop/cart/${bookId}`, {
        method: 'DELETE',
    });
    return toCartSummary(response);
};

export const checkoutCart = async (payload: CheckoutPayload): Promise<CheckoutResult> => {
    const response = await requestJsonAuth<CheckoutResponseDto>('/api/v1/shop/checkout', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            deliveryType: payload.deliveryType,
            deliveryAddress: payload.deliveryAddress || '',
            recipientName: payload.recipientName || '',
            recipientPhone: payload.recipientPhone || '',
            paymentMethod: payload.paymentMethod || 'Mock',
        }),
    });

    return {
        orderId: response.orderId,
        paymentId: response.paymentId,
        status: response.status,
        totalAmount: Number(response.totalAmount),
        deliveryAmount: Number(response.deliveryAmount),
    };
};

export const listPurchases = async (params: PurchasesListParams = {}): Promise<PurchasesListResult> => {
    const query = new URLSearchParams();
    if (typeof params.limit === 'number') query.set('limit', String(params.limit));
    if (typeof params.page === 'number') query.set('page', String(params.page));
    if (params.query) query.set('query', params.query);

    const suffix = query.toString();
    const response = await requestJsonAuth<PurchasedItemsListDto>(`/api/v1/shop/purchases${suffix ? `?${suffix}` : ''}`);
    const items = response.items.map(toPurchasedItem);

    return {
        items,
        total: Number(response.total ?? items.length),
        limit: Number(response.limit ?? params.limit ?? items.length),
        page: Number(response.page ?? params.page ?? 1),
        totalPages: Number(response.totalPages ?? 1),
        query: response.query || params.query || '',
    };
};

export const getPurchaseById = async (purchaseId: string | number): Promise<PurchasedItem> => {
    const response = await requestJsonAuth<PurchasedItemDto>(`/api/v1/shop/purchases/${purchaseId}`);
    return toPurchasedItem(response);
};

export const listPaymentHistory = async (): Promise<PaymentHistoryItem[]> => {
    const response = await requestJsonAuth<PaymentHistoryListDto>('/api/v1/shop/payments/history');
    return response.items.map(toPaymentHistoryItem);
};

export const createShopProduct = async (payload: ShopBookPayload): Promise<ShopProductExtended> => {
    const response = await requestJsonAuth<ShopBookDto>('/api/v1/shop/books', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(toPayload(payload)),
    });
    return toProduct(response);
};

export const updateShopProduct = async (id: string | number, payload: ShopBookPayload): Promise<ShopProductExtended> => {
    const response = await requestJsonAuth<ShopBookDto>(`/api/v1/shop/books/${id}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(toPayload(payload)),
    });
    return toProduct(response);
};

export const deleteShopProduct = async (id: string | number): Promise<void> => {
    await requestJsonAuth<{ ok: boolean }>(`/api/v1/shop/books/${id}`, {
        method: 'DELETE',
    });
};
