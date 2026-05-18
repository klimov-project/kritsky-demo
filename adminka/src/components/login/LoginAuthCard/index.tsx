'use client';

import { useState } from 'react';
import { IoCloseCircleOutline } from 'react-icons/io5';
import type { LoginAuthCardProps } from '@/types/ui/login';
import {
    getAuthPageTitle,
    getAuthSubmitLabel,
    getAuthTabToggleLabel,
} from '@/utils/login';
import styles from './LoginAuthCard.module.scss';

export default function LoginAuthCard({
    activeTab,
    name,
    email,
    password,
    error,
    isSubmitting,
    onNameChange,
    onEmailChange,
    onPasswordChange,
    onPhoneAuthClick,
    onToggleTab,
    onSubmit,
    onClose,
}: LoginAuthCardProps) {
    const [consentOffer, setConsentOffer] = useState(true);
    const [consentPrivacy, setConsentPrivacy] = useState(true);
    const [consentAds, setConsentAds] = useState(true);
    const isRegisterConsentInvalid = activeTab === 'register' && (!consentOffer || !consentPrivacy || !consentAds);

    const handleClose = () => {
        onClose?.();
    };

    return (
        <div className={styles.overlay}>
            <div className={styles.backdrop} />
            <section className={`${styles.modal} ${activeTab === 'register' ? styles.modalRegister : ''}`}>
                <button type="button" className={styles.closeButton} onClick={handleClose} aria-label="Закрыть окно">
                    <IoCloseCircleOutline size={30} />
                </button>
                <div className={styles.inner}>
                    <h1 className={styles.title}>{getAuthPageTitle(activeTab)}</h1>

                    <form onSubmit={onSubmit} className={styles.form}>
                        {activeTab === 'register' ? (
                            <label className={styles.field}>
                                <span className={styles.label}>ВАШЕ ИМЯ</span>
                                <input
                                    className={styles.input}
                                    value={name}
                                    onChange={(event) => onNameChange(event.target.value)}
                                    placeholder="Введите ваше имя"
                                    autoComplete="name"
                                />
                            </label>
                        ) : null}

                        <label className={styles.field}>
                            <span className={styles.label}>E-MAIL</span>
                            <input
                                className={styles.input}
                                value={email}
                                onChange={(event) => onEmailChange(event.target.value)}
                                placeholder="Введите вашу почту"
                                autoComplete="email"
                                type="email"
                                required
                            />
                        </label>

                        <label className={styles.field}>
                            <span className={styles.label}>ПАРОЛЬ</span>
                            <input
                                className={styles.input}
                                value={password}
                                onChange={(event) => onPasswordChange(event.target.value)}
                                placeholder={activeTab === 'login' ? 'Введите пароль' : 'Придумайте пароль'}
                                autoComplete={activeTab === 'login' ? 'current-password' : 'new-password'}
                                type="password"
                                required
                            />
                        </label>

                        {error ? <p className={styles.error}>{error}</p> : null}

                        <button type="button" className={`${styles.button} ${styles.buttonSecondary}`} onClick={onPhoneAuthClick}>
                            ПО НОМЕРУ
                        </button>
                        <button type="submit" className={`${styles.button} ${styles.buttonPrimary}`} disabled={isSubmitting || isRegisterConsentInvalid}>
                            {getAuthSubmitLabel(activeTab, isSubmitting)}
                        </button>

                        {activeTab === 'register' ? (
                            <div className={styles.consents}>
                                <label className={styles.consentRow}>
                                    <input
                                        type="checkbox"
                                        checked={consentOffer}
                                        onChange={(event) => setConsentOffer(event.target.checked)}
                                    />
                                    <span className={styles.checkVisual} aria-hidden="true" />
                                    <span>Принимаю условия Оферты на заключение лицензионного соглашения</span>
                                </label>
                                <label className={styles.consentRow}>
                                    <input
                                        type="checkbox"
                                        checked={consentPrivacy}
                                        onChange={(event) => setConsentPrivacy(event.target.checked)}
                                    />
                                    <span className={styles.checkVisual} aria-hidden="true" />
                                    <span>Выражаю Согласие на обработку персональных данных в соответствии с условиями Политики конфиденциальности</span>
                                </label>
                                <label className={styles.consentRow}>
                                    <input
                                        type="checkbox"
                                        checked={consentAds}
                                        onChange={(event) => setConsentAds(event.target.checked)}
                                    />
                                    <span className={styles.checkVisual} aria-hidden="true" />
                                    <span>Выражаю Согласие на получение рассылки рекламно-информационных материалов</span>
                                </label>
                            </div>
                        ) : null}
                    </form>

                    <div className={`${styles.switchBlock} ${activeTab === 'register' ? styles.switchBlockWithLine : ''}`}>
                        <button
                            type="button"
                            className={styles.switchButton}
                            onClick={onToggleTab}
                        >
                            {getAuthTabToggleLabel(activeTab)}
                        </button>
                    </div>
                </div>
            </section>
        </div>
    );
}
