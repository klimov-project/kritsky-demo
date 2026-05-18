'use client';

import { IoChevronDownOutline, IoSearchOutline } from 'react-icons/io5';

import type { ProductCategoryKey, ProductFulfillment } from '@/types/shop';
import type { ShopCatalogFiltersProps } from '@/types/ui/shopCatalog';

import styles from './ShopCatalogFilters.module.scss';

export default function ShopCatalogFilters({
    searchValue,
    isFiltersOpen,
    selectedCategory,
    selectedAuthor,
    selectedFulfillment,
    authors,
    visibleCategories,
    fulfillmentFilters,
    onSearchChange,
    onToggleFilters,
    onCategoryChange,
    onAuthorChange,
    onFulfillmentChange,
    onClearFilters,
}: ShopCatalogFiltersProps) {
    return (
        <div className={styles.filters}>
            <section className={styles.searchSection}>
                <div className={styles.searchInputWrap}>
                    <IoSearchOutline className={styles.searchIcon} size={20} />
                    <input
                        type="text"
                        value={searchValue}
                        onChange={(event) => onSearchChange(event.target.value)}
                        placeholder="Начать поиск"
                        className={styles.searchInput}
                    />
                </div>
            </section>

            {!isFiltersOpen ? (
                <button type="button" className={styles.toggleButton} onClick={onToggleFilters}>
                    <span>Фильтр товаров</span>
                    <IoChevronDownOutline size={20} />
                </button>
            ) : (
                <section className={styles.panel}>
                    <button type="button" className={styles.toggleButtonInline} onClick={onToggleFilters}>
                        <span>Фильтр товаров</span>
                        <IoChevronDownOutline size={20} className={styles.chevronUp} />
                    </button>

                    <div className={styles.fields}>
                        <label className={styles.field}>
                            <span className={styles.fieldLabel}>Категория</span>
                            <div className={styles.selectWrap}>
                                <select
                                    value={selectedCategory}
                                    onChange={(event) => onCategoryChange(event.target.value as ProductCategoryKey | '')}
                                    className={styles.select}
                                >
                                    <option value="">Все категории</option>
                                    {visibleCategories.map((category) => (
                                        <option key={category.key} value={category.key}>
                                            {category.label}
                                        </option>
                                    ))}
                                </select>
                                <IoChevronDownOutline className={styles.selectChevron} size={18} />
                            </div>
                        </label>

                        <label className={styles.field}>
                            <span className={styles.fieldLabel}>Автор</span>
                            <div className={styles.selectWrap}>
                                <select
                                    value={selectedAuthor}
                                    onChange={(event) => onAuthorChange(event.target.value)}
                                    className={styles.select}
                                >
                                    <option value="">Все авторы</option>
                                    {authors.map((author) => (
                                        <option key={author} value={author}>
                                            {author}
                                        </option>
                                    ))}
                                </select>
                                <IoChevronDownOutline className={styles.selectChevron} size={18} />
                            </div>
                        </label>

                        <label className={styles.field}>
                            <span className={styles.fieldLabel}>Тип товара</span>
                            <div className={styles.selectWrap}>
                                <select
                                    value={selectedFulfillment}
                                    onChange={(event) => onFulfillmentChange(event.target.value as ProductFulfillment | '')}
                                    className={styles.select}
                                >
                                    <option value="">Все типы</option>
                                    {fulfillmentFilters.map((item) => (
                                        <option key={item.key} value={item.key}>
                                            {item.label}
                                        </option>
                                    ))}
                                </select>
                                <IoChevronDownOutline className={styles.selectChevron} size={18} />
                            </div>
                        </label>
                    </div>

                    <div className={styles.clearRow}>
                        <button type="button" className={styles.clearButton} onClick={onClearFilters}>
                            Сбросить фильтры
                        </button>
                    </div>
                </section>
            )}
        </div>
    );
}

