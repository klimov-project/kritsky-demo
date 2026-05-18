'use client';

import React from 'react';
import { FiAlertTriangle } from 'react-icons/fi';
import { IoFlashOutline, IoTimeOutline } from 'react-icons/io5';
import { TbLayersLinked } from 'react-icons/tb';

import type { VariantExportQuota } from '@/lib/variantsApi';

import ProfileActionButton from '../ProfileActionButton';
import styles from './ProfileSubscriptionSection.module.scss';

interface ProfileSubscriptionSectionProps {
    quota: VariantExportQuota;
    isLoading: boolean;
    loadingError: string;
    subscriptionUntilLabel: string;
    hasActiveSubscription: boolean;
    onRenewSubscription: () => void;
    onBuyPacks: () => void;
}

export default function ProfileSubscriptionSection({
    quota,
    isLoading,
    loadingError,
    subscriptionUntilLabel,
    hasActiveSubscription,
    onRenewSubscription,
    onBuyPacks,
}: ProfileSubscriptionSectionProps) {
    return (
        <div className={styles.section}>
            <div className={styles.metrics}>
                <article className={styles.metricCard}>
                    <IoFlashOutline size={24} className={styles.metricIcon} />
                    <p className={styles.metricLabel}>Ваша подписка</p>
                    <p className={styles.metricValue}>
                        {hasActiveSubscription ? `Активна до ${subscriptionUntilLabel}` : 'Не активна'}
                    </p>
                    <p className={styles.metricDescription}>
                        Генерация без лимита,<br />3 бесплатных скачивания<br />или распечатки в день
                    </p>
                </article>

                <article className={styles.metricCard}>
                    <IoTimeOutline size={24} className={styles.metricIcon} />
                    <p className={styles.metricLabel}>Ежедневный лимит</p>
                    <p className={styles.metricValue}>
                        {isLoading ? 'Загрузка...' : `Доступно: ${quota.dailyFreeRemaining} из ${quota.dailyFreeLimit}`}
                    </p>
                    <p className={styles.metricDescription}>
                        Лимит скачиваний по подписке<br />Обновляется в 00:00
                    </p>
                </article>

                <article className={styles.metricCard}>
                    <TbLayersLinked size={24} className={styles.metricIcon} />
                    <p className={styles.metricLabel}>Купленные пакеты</p>
                    <p className={styles.metricValue}>
                        {isLoading ? 'Загрузка...' : `Скачивания: ${quota.paidDownloadsRemaining}`}
                    </p>
                    <p className={styles.metricDescription}>
                        Пополнения из магазина<br />Доступны бессрочно
                    </p>
                </article>
            </div>

            <div className={styles.warning}>
                <FiAlertTriangle size={20} className={styles.warningIcon} />
                <p>
                    Если у вас уже есть активная подписка и купленные пакеты, сначала расходуется 3 ежедневных бесплатных
                    скачивания
                </p>
            </div>

            {loadingError ? <p className={styles.errorText}>{loadingError}</p> : null}

            <div className={styles.actions}>
                <ProfileActionButton variant="accent" className={styles.actionButton} onClick={onRenewSubscription}>
                    Продлить подписку
                </ProfileActionButton>
                <ProfileActionButton variant="muted" className={styles.actionButton} onClick={onBuyPacks}>
                    Докупить пакеты
                </ProfileActionButton>
            </div>
        </div>
    );
}

