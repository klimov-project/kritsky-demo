'use client';

import Input from '@/components/shared/Input';
import { PRODUCT_CATEGORIES } from '@/mocks/shop';
import type { AdminBookFormProps } from '@/types/ui/adminBooks';

export default function AdminBookForm({
    selectedProduct,
    collectionAuthors,
    flags,
    draftState,
    draftHandlers,
    onSubmit,
}: AdminBookFormProps) {
    const {
        isCollectionCategory,
        isDownloadPackCategory,
        isAuthorCollection,
        selectedCollectionAuthorName,
    } = flags;
    const {
        category,
        fulfillment,
        collectionAuthorId,
        collectionKind,
        downloadPackCount,
    } = draftState;
    const {
        onCategoryChange,
        onFulfillmentChange,
        onCollectionAuthorChange,
        onCollectionKindChange,
        onDownloadPackCountChange,
    } = draftHandlers;
    const isBookCategory = category === 'books';
    const isPosterCategory = category === 'posters';
    const isMerchOrFigurineCategory = category === 'merch' || category === 'figurines';

    return (
        <form id="product-form" onSubmit={onSubmit} className="space-y-6 font-serif">
            <Input label="Название" name="title" defaultValue={selectedProduct?.title} width="full" required />

            {isCollectionCategory ? (
                <input type="hidden" name="author" value={selectedCollectionAuthorName} readOnly />
            ) : isDownloadPackCategory ? (
                <input type="hidden" name="author" value="Пакет скачиваний" readOnly />
            ) : (
                <Input
                    label="Автор / бренд"
                    name="author"
                    defaultValue={selectedProduct?.author}
                    width="full"
                    required
                />
            )}

            <div
                className={`grid grid-cols-1 ${(isCollectionCategory || isDownloadPackCategory) ? 'md:grid-cols-2' : 'md:grid-cols-3'} gap-4`}
            >
                <Input
                    label="Цена (₽)"
                    name="price"
                    type="text"
                    inputMode="decimal"
                    defaultValue={String(selectedProduct?.price ?? 0)}
                    width="full"
                    required
                />

                <label className="flex flex-col gap-2">
                    <span className="text-xs font-bold opacity-60 uppercase">Категория</span>
                    <select
                        name="category"
                        value={category}
                        onChange={(event) => onCategoryChange(event.target.value as typeof category)}
                        className="w-full h-[52px] px-4 border border-gray-200 rounded-xl bg-white outline-none"
                    >
                        {PRODUCT_CATEGORIES.map((category) => (
                            <option key={category.key} value={category.key}>
                                {category.label}
                            </option>
                        ))}
                    </select>
                </label>

                {(isCollectionCategory || isDownloadPackCategory) ? (
                    <input type="hidden" name="fulfillment" value="DIGITAL" readOnly />
                ) : (
                    <label className="flex flex-col gap-2">
                        <span className="text-xs font-bold opacity-60 uppercase">Тип товара</span>
                        <select
                            name="fulfillment"
                            value={fulfillment}
                            onChange={(event) => onFulfillmentChange(event.target.value as typeof fulfillment)}
                            className="w-full h-[52px] px-4 border border-gray-200 rounded-xl bg-white outline-none"
                        >
                            <option value="DIGITAL">Цифровой</option>
                            <option value="PHYSICAL">Физический</option>
                        </select>
                    </label>
                )}
            </div>

            {isCollectionCategory && (
                <div className="grid grid-cols-1 gap-4 p-4 rounded-xl border border-[#221E20]/10 bg-[#faf7ef]">
                    <label className="flex flex-col gap-2">
                        <span className="text-xs font-bold opacity-60 uppercase">Тип сборника</span>
                        <select
                            name="collectionKind"
                            value={collectionKind}
                            onChange={(event) => onCollectionKindChange(event.target.value as typeof collectionKind)}
                            className="w-full h-[52px] px-4 border border-gray-200 rounded-xl bg-white outline-none"
                        >
                            <option value="author_1_5">По автору (задания 1–5)</option>
                            <option value="full_variant">Полный вариант (задания 1–11)</option>
                        </select>
                    </label>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {isAuthorCollection && (
                            <label className="flex flex-col gap-2">
                                <span className="text-xs font-bold opacity-60 uppercase">Автор</span>
                                <select
                                    name="collectionAuthorId"
                                    value={collectionAuthorId}
                                    onChange={(event) => onCollectionAuthorChange(event.target.value)}
                                    className="w-full h-[52px] px-4 border border-gray-200 rounded-xl bg-white outline-none"
                                >
                                    <option value="" disabled>
                                        Выберите автора
                                    </option>
                                    {collectionAuthors.map((author) => (
                                        <option key={author.authorId} value={author.authorId}>
                                            {author.authorName}
                                        </option>
                                    ))}
                                </select>
                            </label>
                        )}

                        <Input
                            label="Количество вариантов"
                            name="collectionVariantsCount"
                            type="text"
                            inputMode="numeric"
                            defaultValue={String(selectedProduct?.collectionConfig?.variantsCount || 10)}
                            width="full"
                            required
                        />
                    </div>

                    <input type="hidden" name="collectionAuthorName" value={selectedCollectionAuthorName} readOnly />
                </div>
            )}

            {isDownloadPackCategory && (
                <div className="grid grid-cols-1 gap-4 p-4 rounded-xl border border-[#221E20]/10 bg-[#faf7ef]">
                    <Input
                        label="Количество скачиваний в пакете"
                        name="downloadPackCount"
                        type="text"
                        inputMode="numeric"
                        value={downloadPackCount}
                        onChange={(event) => onDownloadPackCountChange(event.target.value)}
                        width="full"
                        required
                    />
                </div>
            )}

            {!(isCollectionCategory || isDownloadPackCategory) ? (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {!isMerchOrFigurineCategory && (
                            <Input label="Формат" name="format" defaultValue={selectedProduct?.format} width="full" />
                        )}
                        <Input
                            label="Возраст (например, 12+)"
                            name="ageLimit"
                            defaultValue={selectedProduct?.ageLimit}
                            width="full"
                        />
                        {!isMerchOrFigurineCategory && (
                            <Input
                                label="Файл товара (для цифровых)"
                                name="digitalFileName"
                                defaultValue={selectedProduct?.digitalFileName}
                                width="full"
                            />
                        )}
                    </div>

                    {isBookCategory && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <Input
                                label="Год"
                                name="year"
                                type="number"
                                inputMode="numeric"
                                step={1}
                                min={0}
                                defaultValue={selectedProduct?.year?.toString()}
                                width="full"
                            />
                            <Input
                                label="Страниц"
                                name="pages"
                                type="number"
                                inputMode="numeric"
                                step={1}
                                min={0}
                                defaultValue={selectedProduct?.pages?.toString()}
                                width="full"
                            />
                            <Input label="ISBN" name="isbn" defaultValue={selectedProduct?.isbn} width="full" />
                        </div>
                    )}

                    {isPosterCategory && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Input
                                label="Год"
                                name="year"
                                type="number"
                                inputMode="numeric"
                                step={1}
                                min={0}
                                defaultValue={selectedProduct?.year?.toString()}
                                width="full"
                            />
                        </div>
                    )}

                    <Input
                        label={isMerchOrFigurineCategory ? 'Характеристики/теги (через запятую)' : 'Теги (через запятую)'}
                        name="tags"
                        defaultValue={selectedProduct?.tags.join(', ')}
                        width="full"
                    />
                </>
            ) : (
                <input type="hidden" name="tags" value={selectedProduct?.tags.join(', ') || ''} readOnly />
            )}

            <Input label="Обложка (URL/путь)" name="coverUrl" defaultValue={selectedProduct?.coverUrl} width="full" />

            {!(isCollectionCategory || isDownloadPackCategory) ? (
                <Input
                    label="Галерея (URL/пути через запятую)"
                    name="gallery"
                    defaultValue={selectedProduct?.gallery.join(', ')}
                    width="full"
                />
            ) : (
                <input type="hidden" name="gallery" value={selectedProduct?.gallery.join(', ') || ''} readOnly />
            )}

            <div>
                <label className="text-xs font-bold opacity-60 uppercase mb-2 block">Описание</label>
                <textarea
                    name="description"
                    defaultValue={selectedProduct?.description}
                    className="w-full h-32 p-4 bg-white border border-gray-200 rounded-xl outline-none focus:border-black transition-colors"
                />
            </div>
        </form>
    );
}
