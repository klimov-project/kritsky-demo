'use client';

import { IoCloseCircleOutline } from 'react-icons/io5';
import type { AdminLoginCardProps } from '@/types/ui/adminLogin';
import styles from './AdminLoginCard.module.scss';

export default function AdminLoginCard({
    loginValue,
    password,
    error,
    isSubmitting,
    onLoginValueChange,
    onPasswordChange,
    onSubmit,
    onClose,
}: AdminLoginCardProps) {
    return (
        <div className={styles.overlay}>
            <div className={styles.backdrop} />
            <section className={styles.modal}>
                <button type="button" className={styles.closeButton} onClick={onClose} aria-label="Закрыть окно">
                    <IoCloseCircleOutline size={30} />
                </button>
                <div className={styles.inner}>
                    <h2 className={styles.title}>Вход в админ-панель</h2>

                    <form onSubmit={onSubmit} className={styles.form}>
                        <label className={styles.field}>
                            <span className={styles.label}>ЛОГИН / E-MAIL</span>
                            <input
                                className={styles.input}
                                value={loginValue}
                                onChange={(event) => onLoginValueChange(event.target.value)}
                                placeholder="Введите логин или почту"
                                autoComplete="username"
                                required
                            />
                        </label>

                        <label className={styles.field}>
                            <span className={styles.label}>ПАРОЛЬ</span>
                            <input
                                className={styles.input}
                                type="password"
                                value={password}
                                onChange={(event) => onPasswordChange(event.target.value)}
                                placeholder="Введите пароль"
                                autoComplete="current-password"
                                required
                            />
                        </label>

                        {error ? <p className={styles.error}>{error}</p> : null}

                        <button type="submit" className={styles.submitButton} disabled={isSubmitting}>
                            {isSubmitting ? 'ВХОЖУ...' : 'ВОЙТИ'}
                        </button>
                    </form>
                </div>
            </section>
        </div>
    );
}
