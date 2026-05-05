'use client';

import Link from 'next/link';
import { FiDownload, FiMenu, FiPrinter, FiShare2, FiTrash2, FiUpload } from 'react-icons/fi';

import type { SavedVariantFolder } from '@/lib/variantsApi';
import type { SavedVariantRecord } from '@/types/testVariant';
import styles from './MyVariantsLibrary.module.scss';

interface MyVariantsVariantCardProps {
    variant: SavedVariantRecord;
    position: number;
    folders: SavedVariantFolder[];
    canMoveUp: boolean;
    canMoveDown: boolean;
    onReorder: (variantId: string | number, direction: 'up' | 'down') => Promise<void>;
    onMove: (variantId: string | number, nextFolderId: number | null) => Promise<void>;
    onDelete: (variantId: string | number) => Promise<boolean>;
}

export default function MyVariantsVariantCard({
    variant,
    position,
    folders,
    canMoveUp,
    canMoveDown,
    onReorder,
    onMove,
    onDelete,
}: MyVariantsVariantCardProps) {
    const variantLink = `/my-variants/${variant.id}`;
    const block1Title = variant.settings.selectedWorkLabel || `${variant.variant.work.author} ${variant.variant.work.title}`;
    const block1Subtitle = variant.settings.selectedExcerptLabel || variant.variant.excerpt.title || 'Название отрывка';
    const block2Title = variant.settings.selectedPoetLabel
        ? `${variant.settings.selectedPoetLabel}/${variant.settings.selectedThemeId || 'тема'}`
        : `${variant.variant.poet.name}/${variant.settings.selectedThemeId || 'тема'}`;
    const block2Subtitle = variant.settings.selectedPoemLabel || variant.variant.poem.title || 'Название темы';

    const handleDelete = async () => {
        if (!confirm('Удалить сохранённый вариант?')) return;
        await onDelete(variant.id);
    };

    const handleCopyLink = async () => {
        try {
            const url = `${window.location.origin}${variantLink}`;
            await navigator.clipboard.writeText(url);
            alert('Ссылка на вариант скопирована');
        } catch {
            alert('Не удалось скопировать ссылку');
        }
    };

    const handleMove = async () => {
        const options: Array<{ id: number | null; label: string }> = [
            { id: null, label: 'Несортированные' },
            ...folders.map((folder) => ({ id: folder.id, label: folder.name })),
        ];
        const message = options.map((option, index) => `${index + 1}. ${option.label}`).join('\n');
        const rawChoice = prompt(`Куда переместить вариант?\n\n${message}`, '1');

        if (!rawChoice) return;
        const choiceIndex = Number(rawChoice) - 1;
        if (!Number.isInteger(choiceIndex) || choiceIndex < 0 || choiceIndex >= options.length) {
            alert('Некорректный выбор папки');
            return;
        }
        await onMove(variant.id, options[choiceIndex].id);
    };

    const handleMenu = async () => {
        const menuText = [
            'Действия с вариантом',
            '',
            '1. Переместить выше',
            '2. Переместить ниже',
            '3. Переместить в папку',
            '4. Скопировать ссылку',
            '5. Удалить',
        ].join('\n');
        const action = prompt(menuText, '1');

        if (!action) return;
        if (action === '1') {
            if (!canMoveUp) return;
            await onReorder(variant.id, 'up');
            return;
        }
        if (action === '2') {
            if (!canMoveDown) return;
            await onReorder(variant.id, 'down');
            return;
        }
        if (action === '3') {
            await handleMove();
            return;
        }
        if (action === '4') {
            await handleCopyLink();
            return;
        }
        if (action === '5') {
            await handleDelete();
        }
    };

    return (
        <article className={styles.variantCard}>
            <div className={styles.cardDesktop}>
                <button type="button" className={styles.cardMenuButton} onClick={() => void handleMenu()} aria-label="Меню варианта">
                    <FiMenu size={18} />
                </button>

                <div className={styles.rowNumber}>
                    <span className={styles.rowNumberLabel}>№</span>
                    <span className={styles.rowNumberValue}>{position}</span>
                </div>

                <div className={styles.rowBlock}>
                    <span className={styles.rowBlockLabel}>Блок 1</span>
                    <span className={styles.rowBlockPrimary}>{block1Title}</span>
                    <span className={styles.rowBlockSecondary}>{block1Subtitle}</span>
                </div>

                <div className={styles.rowBlock}>
                    <span className={styles.rowBlockLabel}>Блок 2</span>
                    <span className={styles.rowBlockPrimary}>{block2Title}</span>
                    <span className={styles.rowBlockSecondary}>{block2Subtitle}</span>
                </div>

                <div className={styles.rowActions}>
                    <button type="button" className={styles.rowActionButton} onClick={() => void handleMove()} aria-label="Переместить вариант">
                        <FiUpload size={16} />
                    </button>
                    <Link href={variantLink} className={styles.rowActionButton} aria-label="Открыть вариант">
                        <FiDownload size={16} />
                    </Link>
                    <Link href={variantLink} className={styles.rowActionButton} aria-label="Печать варианта">
                        <FiPrinter size={16} />
                    </Link>
                    <button type="button" className={styles.rowActionButton} onClick={() => void handleCopyLink()} aria-label="Скопировать ссылку">
                        <FiShare2 size={16} />
                    </button>
                    <button type="button" className={`${styles.rowActionButton} ${styles.rowActionDanger}`} onClick={() => void handleDelete()} aria-label="Удалить вариант">
                        <FiTrash2 size={16} />
                    </button>
                </div>
            </div>

            <div className={styles.cardMobile}>
                <button type="button" className={styles.cardMenuButton} onClick={() => void handleMenu()} aria-label="Меню варианта">
                    <FiMenu size={18} />
                </button>

                <div className={styles.rowNumber}>
                    <span className={styles.rowNumberLabel}>№</span>
                    <span className={styles.rowNumberValue}>{position}</span>
                </div>

                <div className={styles.rowBlock}>
                    <span className={styles.rowBlockLabel}>Папка</span>
                    <span className={styles.rowBlockPrimary}>{variant.folderName || 'Несортированные'}</span>
                </div>

                <div className={styles.rowBlock}>
                    <span className={styles.rowBlockLabel}>Блок 1</span>
                    <span className={styles.rowBlockPrimary}>{block1Title}</span>
                    <span className={styles.rowBlockSecondary}>{block1Subtitle}</span>
                </div>

                <div className={styles.rowBlock}>
                    <span className={styles.rowBlockLabel}>Блок 2</span>
                    <span className={styles.rowBlockPrimary}>{block2Title}</span>
                    <span className={styles.rowBlockSecondary}>{block2Subtitle}</span>
                </div>

                <div className={styles.rowActions}>
                    <button type="button" className={styles.rowActionButton} onClick={() => void handleMove()} aria-label="Переместить вариант">
                        <FiUpload size={16} />
                    </button>
                    <Link href={variantLink} className={styles.rowActionButton} aria-label="Открыть вариант">
                        <FiDownload size={16} />
                    </Link>
                    <Link href={variantLink} className={styles.rowActionButton} aria-label="Печать варианта">
                        <FiPrinter size={16} />
                    </Link>
                    <button type="button" className={styles.rowActionButton} onClick={() => void handleCopyLink()} aria-label="Скопировать ссылку">
                        <FiShare2 size={16} />
                    </button>
                    <button type="button" className={`${styles.rowActionButton} ${styles.rowActionDanger}`} onClick={() => void handleDelete()} aria-label="Удалить вариант">
                        <FiTrash2 size={16} />
                    </button>
                </div>
            </div>
        </article>
    );
}
