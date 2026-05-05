'use client';

import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
    FiArrowLeft,
    FiChevronLeft,
    FiChevronRight,
    FiEdit2,
    FiFolderPlus,
    FiLogOut,
    FiMail,
    FiRefreshCw,
    FiSearch,
    FiZap,
} from 'react-icons/fi';

import PageLayout from '@/components/layout/PageLayout';
import { useProfileCabinetData } from '@/hooks/useProfileCabinetData';
import { useMyVariantsLibraryPage } from '@/hooks/useMyVariantsLibraryPage';
import { useAuth } from '@/context/AuthContext';
import MyVariantsFolderCard from './MyVariantsFolderCard';
import MyVariantsVariantCard from './MyVariantsVariantCard';
import styles from './MyVariantsLibrary.module.scss';

const PROFILE_TABS = [
    { href: '/profile', label: 'Мой профиль' },
    { href: '/my-variants', label: 'Сохраненные варианты' },
    { href: '/my-books', label: 'Покупки' },
];

const buildPagination = (page: number, totalPages: number): number[] => {
    if (totalPages <= 5) {
        return Array.from({ length: totalPages }, (_, index) => index + 1);
    }

    const bucket = new Set<number>();
    bucket.add(1);
    bucket.add(totalPages);
    bucket.add(page);
    bucket.add(Math.max(1, page - 1));
    bucket.add(Math.min(totalPages, page + 1));

    return [...bucket].sort((left, right) => left - right);
};

export default function MyVariantsLibraryPage() {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const { logout } = useAuth();
    const { subscriptionUntilLabel } = useProfileCabinetData();
    const {
        user,
        isAuthLoading,
        isLoaded,
        isSubmitting,
        error,
        activeView,
        folderId,
        folderViewTitle,
        folders,
        foldersMeta,
        variants,
        variantsMeta,
        search,
        sortBy,
        sortOrder,
        page,
        limit,
        setMode,
        setFolderMode,
        setSearch,
        setSortBy,
        toggleSortOrder,
        setPage,
        setLimit,
        refreshCurrentView,
        createFolder,
        renameFolder,
        deleteFolder,
        reorderFolder,
        moveVariant,
        reorderVariant,
        deleteVariant,
    } = useMyVariantsLibraryPage();

    if (isAuthLoading || !user || user.role !== 'user') {
        return null;
    }

    const showVariants = activeView !== 'folders';
    const totalPages = activeView === 'folders' ? foldersMeta.totalPages : variantsMeta.totalPages;
    const allowVariantReorder = activeView === 'folder' || activeView === 'unsorted';
    const description = activeView === 'folders'
        ? 'Место для хранения и быстрого доступа к нужным папкам'
        : 'Место для хранения и быстрого доступа к нужным вариантам';
    const currentFolder = folderId ? folders.find((folder) => folder.id === folderId) || null : null;
    const pagination = buildPagination(page, totalPages);

    const openFeedbackModal = () => {
        const params = new URLSearchParams(searchParams.toString());
        params.set('modal', 'feedback');
        router.push(`${pathname}?${params.toString()}`, { scroll: false });
    };

    const handleCreateFolder = () => {
        const name = prompt('Название новой папки');
        if (!name) return;
        void createFolder(name);
    };

    const handleRenameCurrentFolder = () => {
        if (!currentFolder) return;
        const nextName = prompt('Новое название папки', currentFolder.name);
        if (!nextName) return;
        void renameFolder(currentFolder.id, nextName);
    };

    const handleCopyCurrentFolderLink = async () => {
        if (!folderId) return;
        const url = `${window.location.origin}/my-variants?mode=folder&folderId=${folderId}`;
        try {
            await navigator.clipboard.writeText(url);
            alert('Ссылка на папку скопирована');
        } catch {
            alert('Не удалось скопировать ссылку');
        }
    };

    return (
        <PageLayout bodyClassName="index-page">
            <div className={styles.wrapper}>
                <h1 className={styles.title}>Личный кабинет</h1>

                <div className={styles.mobileModeTabs}>
                    <button
                        type="button"
                        className={`${styles.mobileModeButton} ${activeView === 'all' ? styles.mobileModeButtonActive : ''}`}
                        onClick={() => setMode('all')}
                    >
                        Все варианты
                    </button>
                    <button
                        type="button"
                        className={`${styles.mobileModeButton} ${activeView === 'folders' || activeView === 'folder' ? styles.mobileModeButtonActive : ''}`}
                        onClick={() => setMode('folders')}
                    >
                        Папки
                    </button>
                    <button
                        type="button"
                        className={`${styles.mobileModeButton} ${activeView === 'unsorted' ? styles.mobileModeButtonActive : ''}`}
                        onClick={() => setMode('unsorted')}
                    >
                        Несортированные
                    </button>
                </div>

                <div className={styles.layout}>
                    <aside className={styles.sidebar}>
                        <nav className={styles.modeCard} aria-label="Сохраненные варианты">
                            <button
                                type="button"
                                className={`${styles.modeButton} ${activeView === 'all' ? styles.modeButtonActive : ''}`}
                                onClick={() => setMode('all')}
                            >
                                Все варианты
                            </button>
                            <button
                                type="button"
                                className={`${styles.modeButton} ${activeView === 'folders' || activeView === 'folder' ? styles.modeButtonActive : ''}`}
                                onClick={() => setMode('folders')}
                            >
                                Папки
                            </button>
                            <button
                                type="button"
                                className={`${styles.modeButton} ${activeView === 'unsorted' ? styles.modeButtonActive : ''}`}
                                onClick={() => setMode('unsorted')}
                            >
                                Несортированные
                            </button>
                        </nav>

                        <section className={styles.subscriptionCard}>
                            <FiZap className={styles.subscriptionIcon} size={20} />
                            <div className={styles.subscriptionText}>
                                <span>Подписка действительная до:</span>
                                <strong>{subscriptionUntilLabel}</strong>
                            </div>
                        </section>

                        <button type="button" className={styles.feedbackButton} onClick={openFeedbackModal}>
                            <FiMail size={15} />
                            <span>Обратная связь</span>
                        </button>
                    </aside>

                    <section className={styles.mainCard}>
                        <div className={styles.profileTabs}>
                            <div className={styles.profileTabsLinks}>
                                {PROFILE_TABS.map((tab, index) => (
                                    <Link
                                        key={tab.href}
                                        href={tab.href}
                                        className={`${styles.profileTab} ${index === 1 ? styles.profileTabActive : ''}`}
                                    >
                                        {tab.label}
                                    </Link>
                                ))}
                            </div>

                            <button type="button" className={styles.logoutButton} onClick={() => logout('/?modal=login')}>
                                <span>Выйти</span>
                                <FiLogOut size={19} />
                            </button>
                        </div>

                        <div className={styles.mainContent}>
                            {(activeView === 'folder' || activeView === 'unsorted') && (
                                <button type="button" className={styles.backButton} onClick={() => setMode('folders')}>
                                    <FiArrowLeft size={16} />
                                    <span>Назад к папкам</span>
                                </button>
                            )}

                            {activeView === 'folder' && (
                                <div className={styles.folderTitleRow}>
                                    <h2 className={styles.folderTitle}>{folderViewTitle}</h2>
                                    <button type="button" className={styles.folderEditButton} onClick={handleRenameCurrentFolder} aria-label="Переименовать папку">
                                        <FiEdit2 size={16} />
                                    </button>
                                </div>
                            )}

                            <p className={styles.sectionDescription}>{description}</p>

                            <label className={styles.searchRow} aria-label="Поиск">
                                <FiSearch size={18} />
                                <input
                                    type="search"
                                    value={search}
                                    onChange={(event) => setSearch(event.target.value)}
                                    placeholder="Начать поиск"
                                    className={styles.searchInput}
                                />
                            </label>

                            <div className={styles.controlsRow}>
                                <div className={styles.sortControl}>
                                    <span className={styles.sortLabel}>Сортировать по:</span>
                                    <div className={styles.sortOptions}>
                                        <button
                                            type="button"
                                            className={`${styles.sortOption} ${sortBy === 'name' ? styles.sortOptionActive : ''}`}
                                            onClick={() => setSortBy('name')}
                                        >
                                            отрывку
                                        </button>
                                        <button
                                            type="button"
                                            className={`${styles.sortOption} ${sortBy === 'updatedAt' ? styles.sortOptionActive : ''}`}
                                            onClick={() => setSortBy('updatedAt')}
                                        >
                                            стихотворению
                                        </button>
                                    </div>
                                </div>

                                <div className={styles.actionButtons}>
                                    {activeView === 'folders' && (
                                        <button type="button" className={styles.addFolderButton} onClick={handleCreateFolder}>
                                            <FiFolderPlus size={16} />
                                            <span>Добавить папку</span>
                                        </button>
                                    )}
                                    <Link href="/new_test" className={styles.constructorButton}>
                                        Открыть в конструкторе
                                    </Link>
                                </div>
                            </div>

                            <div className={styles.utilityRow}>
                                <button type="button" className={styles.utilityButton} onClick={toggleSortOrder}>
                                    {sortOrder === 'asc' ? 'По возрастанию' : 'По убыванию'}
                                </button>
                                <select value={String(limit)} onChange={(event) => setLimit(Number(event.target.value))} className={styles.utilitySelect}>
                                    <option value="10">10 / стр.</option>
                                    <option value="20">20 / стр.</option>
                                    <option value="40">40 / стр.</option>
                                </select>
                                <button type="button" className={styles.utilityButton} onClick={() => void refreshCurrentView()}>
                                    <FiRefreshCw size={14} />
                                    <span>Обновить</span>
                                </button>
                            </div>

                            {!isLoaded && <div className={styles.placeholder}>Загружаю данные…</div>}
                            {isLoaded && error && <div className={styles.error}>{error}</div>}

                            {isLoaded && !error && showVariants && variants.length > 0 && (
                                <div className={styles.tableHeader}>
                                    <span className={styles.tableHeaderNumber}>№</span>
                                    <span className={styles.tableHeaderBlock}>Блок 1</span>
                                    <span className={styles.tableHeaderBlock}>Блок 2</span>
                                </div>
                            )}

                            {isLoaded && !error && activeView === 'folders' && (
                                <div className={styles.folderGrid}>
                                    {!folders.length && (
                                        <div className={styles.placeholder}>
                                            Папок пока нет. Создайте первую папку и перемещайте в неё варианты.
                                        </div>
                                    )}
                                    {folders.map((folder, index) => (
                                        <MyVariantsFolderCard
                                            key={folder.id}
                                            folder={folder}
                                            position={(page - 1) * limit + index + 1}
                                            canMoveUp={index > 0}
                                            canMoveDown={index < folders.length - 1}
                                            onOpen={setFolderMode}
                                            onRename={renameFolder}
                                            onDelete={deleteFolder}
                                            onReorder={reorderFolder}
                                        />
                                    ))}
                                </div>
                            )}

                            {isLoaded && !error && showVariants && (
                                <>
                                    {!variants.length && (
                                        <div className={styles.placeholder}>
                                            Здесь пока пусто. Сохраните вариант в генераторе, чтобы он появился в списке.
                                            <div className={styles.placeholderLinkWrap}>
                                                <Link href="/new_test" className={styles.primaryLink}>Перейти в конструктор</Link>
                                            </div>
                                        </div>
                                    )}

                                    {variants.length > 0 && (
                                        <div className={styles.variantsGrid}>
                                            {variants.map((variant, index) => (
                                                <MyVariantsVariantCard
                                                    key={variant.id}
                                                    variant={variant}
                                                    position={(page - 1) * limit + index + 1}
                                                    folders={folders}
                                                    canMoveUp={allowVariantReorder && index > 0}
                                                    canMoveDown={allowVariantReorder && index < variants.length - 1}
                                                    onReorder={reorderVariant}
                                                    onMove={moveVariant}
                                                    onDelete={deleteVariant}
                                                />
                                            ))}
                                        </div>
                                    )}
                                </>
                            )}

                            {isLoaded && !error && totalPages > 1 && (
                                <div className={styles.pagination}>
                                    <button type="button" className={styles.pageButton} onClick={() => setPage(page - 1)} disabled={page <= 1}>
                                        <FiChevronLeft size={16} />
                                    </button>

                                    {pagination.map((pageNumber) => (
                                        <button
                                            key={pageNumber}
                                            type="button"
                                            className={`${styles.pageButton} ${pageNumber === page ? styles.pageButtonActive : ''}`}
                                            onClick={() => setPage(pageNumber)}
                                        >
                                            {pageNumber}
                                        </button>
                                    ))}

                                    <button type="button" className={styles.pageButton} onClick={() => setPage(page + 1)} disabled={page >= totalPages}>
                                        <FiChevronRight size={16} />
                                    </button>
                                </div>
                            )}

                            {activeView === 'folder' && folderId && (
                                <button type="button" className={styles.folderLinkInline} onClick={() => void handleCopyCurrentFolderLink()}>
                                    Скопировать ссылку на папку
                                </button>
                            )}
                        </div>
                    </section>
                </div>

                <div className={styles.mobileExtras}>
                    <section className={styles.subscriptionCard}>
                        <FiZap className={styles.subscriptionIcon} size={20} />
                        <div className={styles.subscriptionText}>
                            <span>Подписка действительная до:</span>
                            <strong>{subscriptionUntilLabel}</strong>
                        </div>
                    </section>

                    <button type="button" className={styles.feedbackButton} onClick={openFeedbackModal}>
                        <FiMail size={15} />
                        <span>Обратная связь</span>
                    </button>
                </div>

                {isSubmitting && <div className={styles.loadingOverlay}>Сохраняю изменения…</div>}
            </div>
        </PageLayout>
    );
}
