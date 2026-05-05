'use client';

import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import styles from './Accordion.module.scss';

export interface AccordionItemProps {
    title: string | React.ReactNode;
    children: React.ReactNode;
    isOpen?: boolean;
    onToggle?: () => void;
    className?: string;
    disabled?: boolean;
    triggerOn?: 'click' | 'hover';
    hoverDelay?: number;
}

const AccordionItem: React.FC<AccordionItemProps> = ({
    title,
    children,
    isOpen = false,
    onToggle,
    className = '',
    disabled = false,
    triggerOn = 'click',
    hoverDelay = 200,
}) => {
    const [internalOpen, setInternalOpen] = useState(isOpen);
    const contentRef = useRef<HTMLDivElement>(null);
    const contentInnerRef = useRef<HTMLDivElement>(null);
    const hoverTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const isControlled = typeof onToggle === 'function';
    const resolvedOpen = isControlled ? isOpen : internalOpen;

    const syncHeight = useCallback(() => {
        const content = contentRef.current;
        const inner = contentInnerRef.current;
        if (!content || !inner) return;

        content.style.height = resolvedOpen ? `${inner.offsetHeight}px` : '0px';
    }, [resolvedOpen]);

    useLayoutEffect(() => {
        syncHeight();
    }, [syncHeight, children]);

    useEffect(() => {
        const inner = contentInnerRef.current;
        if (!inner) return;

        const observer = new ResizeObserver(() => {
            if (resolvedOpen) {
                syncHeight();
            }
        });

        observer.observe(inner);
        return () => observer.disconnect();
    }, [resolvedOpen, syncHeight]);

    useEffect(() => {
        return () => {
            if (hoverTimerRef.current) {
                clearTimeout(hoverTimerRef.current);
            }
        };
    }, []);

    const handleClick = () => {
        if (disabled || triggerOn !== 'click') return;
        if (isControlled) {
            onToggle?.();
            return;
        }
        setInternalOpen((prev) => !prev);
    };

    const handleMouseEnter = () => {
        if (!disabled && triggerOn === 'hover') {
            hoverTimerRef.current = setTimeout(() => {
                if (!resolvedOpen) {
                    if (isControlled) {
                        onToggle?.();
                    } else {
                        setInternalOpen(true);
                    }
                }
            }, hoverDelay);
        }
    };

    const handleMouseLeave = () => {
        if (hoverTimerRef.current) {
            clearTimeout(hoverTimerRef.current);
        }
        if (!disabled && triggerOn === 'hover' && resolvedOpen) {
            if (isControlled) {
                onToggle?.();
            } else {
                setInternalOpen(false);
            }
        }
    };

    return (
        <div
            className={`${styles.accordionItem} ${className} ${disabled ? styles.disabled : ''}`}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            <button
                className={`${styles.accordionHeader} ${resolvedOpen ? styles.active : ''}`}
                onClick={handleClick}
                disabled={disabled}
                aria-expanded={resolvedOpen}
            >
                <span className={styles.accordionTitle}>{title}</span>
                <svg
                    className={`${styles.accordionIcon} ${resolvedOpen ? styles.rotated : ''}`}
                    width="20"
                    height="20"
                    viewBox="0 0 20 20"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                >
                    <path
                        d="M5 7.5L10 12.5L15 7.5"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                </svg>
            </button>
            <div
                ref={contentRef}
                className={styles.accordionContent}
                style={{ height: resolvedOpen ? undefined : '0px' }}
            >
                <div ref={contentInnerRef} className={styles.accordionContentInner}>
                    {children}
                </div>
            </div>
        </div>
    );
};

export default AccordionItem;
