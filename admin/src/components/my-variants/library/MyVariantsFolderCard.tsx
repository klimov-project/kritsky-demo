'use client';

import { FiEdit2, FiMenu, FiShare2, FiTrash2 } from 'react-icons/fi';

import type { SavedVariantFolder } from '@/lib/variantsApi';
import styles from './MyVariantsLibrary.module.scss';

interface MyVariantsFolderCardProps {
    folder: SavedVariantFolder;
    position: number;
    canMoveUp: boolean;
    canMoveDown: boolean;
    onOpen: (folderId: number) => void;
    onRename: (folderId: number, nextName: string) => Promise<boolean>;
    onDelete: (folderId: number) => Promise<boolean>;
    onReorder: (folderId: number, direction: 'up' | 'down') => Promise<void>;
}

export default function MyVariantsFolderCard({
    folder,
    position,
    canMoveUp,
    canMoveDown,
    onOpen,
    onRename,
    onDelete,
    onReorder,
}: MyVariantsFolderCardProps) {
    const handleRename = async () => {
        const nextName = prompt('Новое название папки', folder.name);
        if (!nextName) return;
        await onRename(folder.id, nextName);
    };

    const handleDelete = async () => {
        if (!confirm(`Удалить папку "${folder.name}"? Варианты перейдут в "Несортированные".`)) return;
        await onDelete(folder.id);
    };

    const handleMenu = async () => {
        const menuText = [
            `Папка: ${folder.name}`,
            '',
            '1. Переместить выше',
            '2. Переместить ниже',
            '3. Переименовать',
            '4. Скопировать ссылку',
            '5. Удалить',
        ].join('\n');
        const action = prompt(menuText, '1');

        if (!action) return;
        if (action === '1') {
            if (!canMoveUp) return;
            await onReorder(folder.id, 'up');
            return;
        }
        if (action === '2') {
            if (!canMoveDown) return;
            await onReorder(folder.id, 'down');
            return;
        }
        if (action === '3') {
            await handleRename();
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

    const handleCopyLink = async () => {
        try {
            const url = `${window.location.origin}${folder.link}`;
            await navigator.clipboard.writeText(url);
            alert('Ссылка на папку скопирована');
        } catch {
            alert('Не удалось скопировать ссылку');
        }
    };

    return (
        <article className={styles.folderCard}>
            <div className={styles.cardDesktop}>
                <button type="button" className={styles.cardMenuButton} onClick={() => void handleMenu()} aria-label="Меню папки">
                    <FiMenu size={18} />
                </button>

                <button type="button" className={styles.folderOpenArea} onClick={() => onOpen(folder.id)}>
                    <div className={styles.rowNumber}>
                        <span className={styles.rowNumberLabel}>№</span>
                        <span className={styles.rowNumberValue}>{position}</span>
                    </div>

                    <div className={styles.rowBlock}>
                        <span className={styles.rowBlockLabel}>Название папки</span>
                        <span className={styles.rowBlockPrimary}>{folder.name}</span>
                    </div>

                    <div className={styles.rowBlock}>
                        <span className={styles.rowBlockLabel}>Кол-во вариантов</span>
                        <span className={styles.rowBlockPrimary}>{folder.variantsCount}</span>
                    </div>
                </button>

                <div className={styles.rowActions}>
                    <button type="button" className={styles.rowActionButton} onClick={() => void handleCopyLink()} aria-label="Скопировать ссылку">
                        <FiShare2 size={16} />
                    </button>
                    <button type="button" className={styles.rowActionButton} onClick={() => void handleRename()} aria-label="Переименовать папку">
                        <FiEdit2 size={16} />
                    </button>
                    <button type="button" className={`${styles.rowActionButton} ${styles.rowActionDanger}`} onClick={() => void handleDelete()} aria-label="Удалить папку">
                        <FiTrash2 size={16} />
                    </button>
                </div>
            </div>

            <div className={styles.cardMobile}>
                <button type="button" className={styles.cardMenuButton} onClick={() => void handleMenu()} aria-label="Меню папки">
                    <FiMenu size={18} />
                </button>

                <button type="button" className={styles.folderOpenAreaMobile} onClick={() => onOpen(folder.id)}>
                    <div className={styles.rowNumber}>
                        <span className={styles.rowNumberLabel}>№</span>
                        <span className={styles.rowNumberValue}>{position}</span>
                    </div>

                    <div className={styles.rowBlock}>
                        <span className={styles.rowBlockLabel}>Название папки</span>
                        <span className={styles.rowBlockPrimary}>{folder.name}</span>
                    </div>

                    <div className={styles.rowBlock}>
                        <span className={styles.rowBlockLabel}>Кол-во вариантов</span>
                        <span className={styles.rowBlockPrimary}>{folder.variantsCount}</span>
                    </div>
                </button>

                <div className={styles.rowActions}>
                    <button type="button" className={styles.rowActionButton} onClick={() => void handleRename()} aria-label="Переименовать папку">
                        <FiEdit2 size={16} />
                    </button>
                    <button type="button" className={styles.rowActionButton} onClick={() => void handleCopyLink()} aria-label="Скопировать ссылку">
                        <FiShare2 size={16} />
                    </button>
                    <button type="button" className={`${styles.rowActionButton} ${styles.rowActionDanger}`} onClick={() => void handleDelete()} aria-label="Удалить папку">
                        <FiTrash2 size={16} />
                    </button>
                </div>
            </div>
        </article>
    );
}
