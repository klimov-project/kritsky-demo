'use client';

import Link from 'next/link';
import React from 'react';
import { FaTelegramPlane } from 'react-icons/fa';
import { FaYoutube } from "react-icons/fa";
import styles from './HomeFooter.module.scss';

export default function HomeFooter() {
    return (
        <footer className={styles.footer}>
            <div className={styles.desktopTop}>
                <div className={styles.links}>
                    <Link href="/about">О проекте</Link>
                    <Link href="/terms">Пользовательское соглашение</Link>
                    <Link href="/privacy">Политика конфиденциальности</Link>
                </div>

                <div className={styles.socials}>
                    <a href="#" aria-label="VK" className={styles.socialLink}>
                        <FaYoutube color='white' size={18} />
                    </a>
                    <a href="#" aria-label="Telegram" className={styles.socialLink}>
                        <FaTelegramPlane size={15} />
                    </a>
                </div>

                <div className={styles.companyInfo}>
                    <p>ИП Крицкий Роман Дмитриевич</p>
                    <p>ИНН: 772796119977</p>
                    <p>ОГРНИП: 325774600403322</p>
                </div>
            </div>

            <div className={styles.desktopBottom}>Все права защищены. © Крицкий 2026</div>

            <div className={styles.mobileTop}>
                <div className={styles.links}>
                    <Link href="/about">О проекте</Link>
                    <Link href="/terms">Пользовательское соглашение</Link>
                    <Link href="/privacy">Политика конфиденциальности</Link>
                </div>

                <div className={styles.companyInfo}>
                    <p>ИП Крицкий Роман Дмитриевич</p>
                    <p>ИНН: 772796119977</p>
                    <p>ОГРНИП: 325774600403322</p>
                </div>
            </div>

            <div className={styles.mobileBottom}>
                <div className={styles.mobileCopyright}>
                    <p>© Крицкий 2026</p>
                    <p>Все права защищены.</p>
                </div>
                <div className={styles.socials}>
                    <a href="#" aria-label="VK" className={styles.socialLink}>
                        <FaYoutube size={18} />
                    </a>
                    <a href="#" aria-label="Telegram" className={styles.socialLink}>
                        <FaTelegramPlane size={15} />
                    </a>
                </div>
            </div>
        </footer>
    );
}
