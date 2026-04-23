'use client';

import React, { useEffect, useState } from 'react';
import { IoCloseCircleOutline } from 'react-icons/io5';
import styles from './FeedbackPopup.module.scss';

interface FeedbackPopupProps {
    isOpen: boolean;
    onClose: () => void;
    defaultName?: string;
    defaultEmail?: string;
    onSubmit?: (payload: { name: string; email: string; comment: string }) => void | Promise<void>;
}

export default function FeedbackPopup({
    isOpen,
    onClose,
    defaultName = '',
    defaultEmail = '',
    onSubmit,
}: FeedbackPopupProps) {
    const [name, setName] = useState(defaultName);
    const [email, setEmail] = useState(defaultEmail);
    const [comment, setComment] = useState('');
    const [isPolicyAccepted, setIsPolicyAccepted] = useState(true);
    const [isAdsAccepted, setIsAdsAccepted] = useState(true);
    const [isSending, setIsSending] = useState(false);

    useEffect(() => {
        if (!isOpen) return;

        setName(defaultName);
        setEmail(defaultEmail);
        setComment('');
        setIsPolicyAccepted(true);
        setIsAdsAccepted(true);
    }, [defaultEmail, defaultName, isOpen]);

    useEffect(() => {
        if (!isOpen) return;
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = '';
        };
    }, [isOpen]);

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!name.trim() || !email.trim() || !isPolicyAccepted || !isAdsAccepted || isSending) return;

        setIsSending(true);
        try {
            await onSubmit?.({
                name: name.trim(),
                email: email.trim(),
                comment: comment.trim(),
            });
            onClose();
        } finally {
            setIsSending(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className={styles.overlay}>
            <div className={styles.backdrop} onClick={onClose} />
            <section className={styles.modal}>
                <button type="button" className={styles.closeButton} onClick={onClose} aria-label="Закрыть окно">
                    <IoCloseCircleOutline size={30} />
                </button>
                <div className={styles.inner}>
                    <h2 className={styles.title}>Есть идея или вопрос?</h2>
                    <p className={styles.description}>
                        Поделитесь своими мыслями о работе сервиса.
                        <br />
                        Мы внимательно читаем каждое письмо и помогаем со всеми техническими нюансами
                    </p>

                    <form onSubmit={handleSubmit} className={styles.form}>
                        <div className={styles.fieldsGrid}>
                            <div className={styles.leftFields}>
                                <label className={styles.field}>
                                    <span className={styles.label}>ВАШЕ ИМЯ</span>
                                    <input
                                        className={styles.input}
                                        value={name}
                                        onChange={(event) => setName(event.target.value)}
                                        placeholder="Введите ваше имя"
                                        autoComplete="name"
                                        required
                                    />
                                </label>
                                <label className={styles.field}>
                                    <span className={styles.label}>E-MAIL</span>
                                    <input
                                        className={styles.input}
                                        value={email}
                                        onChange={(event) => setEmail(event.target.value)}
                                        placeholder="Введите вашу почту"
                                        autoComplete="email"
                                        type="email"
                                        required
                                    />
                                </label>
                            </div>

                            <label className={`${styles.field} ${styles.commentField}`}>
                                <span className={styles.label}>ВАШ КОММЕНТАРИЙ</span>
                                <textarea
                                    className={styles.textarea}
                                    value={comment}
                                    onChange={(event) => setComment(event.target.value)}
                                    placeholder="Введите комментарий"
                                />
                            </label>
                        </div>

                        <div className={styles.consents}>
                            <label className={styles.consentRow}>
                                <input
                                    type="checkbox"
                                    checked={isPolicyAccepted}
                                    onChange={(event) => setIsPolicyAccepted(event.target.checked)}
                                />
                                <span className={styles.checkVisual} aria-hidden="true" />
                                <span>Выражаю Согласие на обработку персональных данных в соответствии с условиями Политики конфиденциальности</span>
                            </label>
                            <label className={styles.consentRow}>
                                <input
                                    type="checkbox"
                                    checked={isAdsAccepted}
                                    onChange={(event) => setIsAdsAccepted(event.target.checked)}
                                />
                                <span className={styles.checkVisual} aria-hidden="true" />
                                <span>Выражаю Согласие на получение рассылки рекламно-информационных материалов</span>
                            </label>
                        </div>

                        <button
                            type="submit"
                            className={styles.submitButton}
                            disabled={!name.trim() || !email.trim() || !isPolicyAccepted || !isAdsAccepted || isSending}
                        >
                            {isSending ? 'ОТПРАВКА...' : 'ОТПРАВИТЬ'}
                        </button>
                    </form>
                </div>
            </section>
        </div>
    );
}
