'use client';

import { IoChevronDownOutline, IoCloseOutline, IoFilterOutline, IoSearchOutline } from 'react-icons/io5';

import type { ProductCategoryKey, ProductFulfillment } from '@/types/shop';
import type { ShopCatalogFiltersProps } from '@/types/ui/shopCatalog';

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
        <div className="mt-[90px] flex flex-col gap-6 relative">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                <h1 className="font-serif font-bold text-3xl text-[#221E20]">Товары</h1>

                <div className="flex items-center gap-4 w-full sm:w-auto">
                    <div className="relative flex-1 sm:w-[240px]">
                        <input
                            type="text"
                            value={searchValue}
                            onChange={(event) => onSearchChange(event.target.value)}
                            placeholder="Поиск..."
                            className="w-full h-[40px] pl-10 pr-4 bg-transparent border-b border-[#221E20]/30 focus:border-[#221E20] outline-none font-serif text-sm transition-colors placeholder:text-[#221E20]/40"
                        />
                        <IoSearchOutline className="absolute left-0 top-1/2 -translate-y-1/2 text-[#221E20]/40" size={18} />
                    </div>

                    <button
                        onClick={onToggleFilters}
                        className={`flex items-center gap-2 transition-colors whitespace-nowrap ${isFiltersOpen ? 'text-[#221E20] opacity-100' : 'text-[#221E20] opacity-60 hover:opacity-100'}`}
                    >
                        <span className="font-serif font-bold text-sm">Фильтры</span>
                        {isFiltersOpen ? <IoCloseOutline size={20} /> : <IoFilterOutline size={18} />}
                    </button>
                </div>
            </div>

            <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isFiltersOpen ? 'max-h-[320px] opacity-100' : 'max-h-0 opacity-0'}`}>
                <div className="bg-gray-50/50 p-6 rounded-xl border border-[#221E20]/5 grid grid-cols-1 sm:grid-cols-3 gap-6">
                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase opacity-40 tracking-wider">Категория</label>
                        <div className="relative">
                            <select
                                value={selectedCategory}
                                onChange={(event) => onCategoryChange(event.target.value as ProductCategoryKey | '')}
                                className="w-full p-2 bg-white border border-[#221E20]/10 rounded font-serif text-sm appearance-none outline-none focus:border-[#221E20]/30"
                            >
                                <option value="">Все категории</option>
                                {visibleCategories.map((category) => (
                                    <option key={category.key} value={category.key}>{category.label}</option>
                                ))}
                            </select>
                            <IoChevronDownOutline className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none opacity-40" />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase opacity-40 tracking-wider">Автор</label>
                        <div className="relative">
                            <select
                                value={selectedAuthor}
                                onChange={(event) => onAuthorChange(event.target.value)}
                                className="w-full p-2 bg-white border border-[#221E20]/10 rounded font-serif text-sm appearance-none outline-none focus:border-[#221E20]/30"
                            >
                                <option value="">Все авторы</option>
                                {authors.map((author) => (
                                    <option key={author} value={author}>{author}</option>
                                ))}
                            </select>
                            <IoChevronDownOutline className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none opacity-40" />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase opacity-40 tracking-wider">Тип товара</label>
                        <div className="relative">
                            <select
                                value={selectedFulfillment}
                                onChange={(event) => onFulfillmentChange(event.target.value as ProductFulfillment | '')}
                                className="w-full p-2 bg-white border border-[#221E20]/10 rounded font-serif text-sm appearance-none outline-none focus:border-[#221E20]/30"
                            >
                                <option value="">Все типы</option>
                                {fulfillmentFilters.map((item) => (
                                    <option key={item.key} value={item.key}>{item.label}</option>
                                ))}
                            </select>
                            <IoChevronDownOutline className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none opacity-40" />
                        </div>
                    </div>
                </div>
                <div className="flex justify-end mt-2">
                    <button onClick={onClearFilters} className="text-xs text-[#221E20]/40 hover:text-[#cc0000] underline">
                        Сбросить фильтры
                    </button>
                </div>
            </div>
        </div>
    );
}
