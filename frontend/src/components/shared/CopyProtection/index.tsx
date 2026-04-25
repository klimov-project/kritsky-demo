'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

const isEditableTarget = (target: EventTarget | null): boolean => {
    if (!(target instanceof HTMLElement)) {
        return false;
    }

    const tagName = target.tagName.toLowerCase();
    if (tagName === 'input' || tagName === 'textarea' || tagName === 'select') {
        return true;
    }

    if (target.isContentEditable || target.closest('[contenteditable="true"], [data-allow-copy="true"]')) {
        return true;
    }

    return false;
};

const shouldDisableProtectionOnPath = (pathname: string): boolean => {
    return pathname.startsWith('/admin');
};

export default function CopyProtection() {
    const pathname = usePathname() || '';

    useEffect(() => {
        if (shouldDisableProtectionOnPath(pathname)) {
            return undefined;
        }

        const handleBlockedEvent = (event: Event) => {
            if (isEditableTarget(event.target)) {
                return;
            }

            event.preventDefault();
        };

        const handleKeyDown = (event: KeyboardEvent) => {
            if (isEditableTarget(event.target)) {
                return;
            }

            const key = event.key.toLowerCase();
            if ((event.ctrlKey || event.metaKey) && (key === 'c' || key === 'x')) {
                event.preventDefault();
            }
        };

        document.addEventListener('copy', handleBlockedEvent);
        document.addEventListener('cut', handleBlockedEvent);
        document.addEventListener('contextmenu', handleBlockedEvent);
        document.addEventListener('selectstart', handleBlockedEvent);
        document.addEventListener('dragstart', handleBlockedEvent);
        document.addEventListener('keydown', handleKeyDown);

        return () => {
            document.removeEventListener('copy', handleBlockedEvent);
            document.removeEventListener('cut', handleBlockedEvent);
            document.removeEventListener('contextmenu', handleBlockedEvent);
            document.removeEventListener('selectstart', handleBlockedEvent);
            document.removeEventListener('dragstart', handleBlockedEvent);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [pathname]);

    return null;
}

