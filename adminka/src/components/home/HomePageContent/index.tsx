'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { fetchKnowledgeBase } from '@/lib/knowledgeBaseApi';
import { calculateVariantStats } from '@/lib/variantStats';
import HomeFooter from './HomeFooter';
import HomeHeader from './HomeHeader';
import HomeHero from './HomeHero';
import styles from './HomePageContent.module.scss';

interface HomePageContentProps {
    initialDate?: string;
}

export default function HomePageContent({ initialDate }: HomePageContentProps) {
    const router = useRouter();
    const [variantCountLabel, setVariantCountLabel] = useState<string>('');

    const handleCreateVariantClick = () => {
        router.push(initialDate ? `/new_test?date=${encodeURIComponent(initialDate)}` : '/new_test');
    };

    useEffect(() => {
        let cancelled = false;

        const loadVariantStats = async () => {
            try {
                const knowledgeBase = await fetchKnowledgeBase();
                if (!cancelled) {
                    setVariantCountLabel(calculateVariantStats(knowledgeBase).totalVariantsLabel);
                }
            } catch {
                if (!cancelled) {
                    setVariantCountLabel('');
                }
            }
        };

        void loadVariantStats();

        return () => {
            cancelled = true;
        };
    }, []);

    return (
        <div className={styles.page}>
            <div className={styles.container}>
                <div className={styles.viewport}>
                    <HomeHeader />
                    <HomeHero
                        variantCountLabel={variantCountLabel || ''}
                        onCreateVariantClick={handleCreateVariantClick}
                    />
                </div>
                <HomeFooter />
            </div>
        </div>
    );
}
