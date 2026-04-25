'use client';

import React from 'react';

import ProfileActionButton from '../ProfileActionButton';
import ProfileInputField from '../ProfileInputField';
import styles from './ProfilePersonalDataSection.module.scss';

interface ProfilePersonalDataSectionProps {
    name: string;
    email: string;
    phone: string;
    currentPassword: string;
    newPassword: string;
    newPasswordRepeat: string;
    onNameChange: (value: string) => void;
    onPhoneChange: (value: string) => void;
    onCurrentPasswordChange: (value: string) => void;
    onNewPasswordChange: (value: string) => void;
    onNewPasswordRepeatChange: (value: string) => void;
    onProfileSave: () => void;
    onPasswordSave: () => void;
    isSavingProfile: boolean;
    isSavingPassword: boolean;
    profileMessage: string;
    profileError: string;
    passwordMessage: string;
    passwordError: string;
}

export default function ProfilePersonalDataSection({
    name,
    email,
    phone,
    currentPassword,
    newPassword,
    newPasswordRepeat,
    onNameChange,
    onPhoneChange,
    onCurrentPasswordChange,
    onNewPasswordChange,
    onNewPasswordRepeatChange,
    onProfileSave,
    onPasswordSave,
    isSavingProfile,
    isSavingPassword,
    profileMessage,
    profileError,
    passwordMessage,
    passwordError,
}: ProfilePersonalDataSectionProps) {
    return (
        <div className={styles.section}>
            <section className={styles.block}>
                <h2 className={styles.blockTitle}>Личные данные</h2>

                <div className={styles.fieldsRow}>
                    <ProfileInputField
                        label="Ваше имя"
                        value={name}
                        placeholder="Введите имя"
                        onChange={(event) => onNameChange(event.target.value)}
                    />
                    <ProfileInputField
                        label="E-mail"
                        value={email}
                        disabled
                        placeholder="Введите вашу электронную почту"
                        readOnly
                    />
                    <ProfileInputField
                        label="Ваш телефон"
                        value={phone}
                        placeholder="Введите ваш телефон"
                        onChange={(event) => onPhoneChange(event.target.value)}
                    />
                </div>

                <ProfileActionButton
                    variant="muted"
                    className={styles.actionButton}
                    onClick={onProfileSave}
                    disabled={isSavingProfile}
                >
                    {isSavingProfile ? 'Сохранение...' : 'Сохранить данные'}
                </ProfileActionButton>

                {profileError ? <p className={styles.errorText}>{profileError}</p> : null}
                {profileMessage ? <p className={styles.successText}>{profileMessage}</p> : null}
            </section>

            <section className={styles.block}>
                <h2 className={styles.blockTitle}>Смена пароля</h2>

                <div className={styles.fieldsRow}>
                    <ProfileInputField
                        label="Текущий пароль"
                        value={currentPassword}
                        type="password"
                        placeholder="Введите текущий пароль"
                        onChange={(event) => onCurrentPasswordChange(event.target.value)}
                    />
                    <ProfileInputField
                        label="Новый пароль"
                        value={newPassword}
                        type="password"
                        placeholder="Введите новый пароль"
                        onChange={(event) => onNewPasswordChange(event.target.value)}
                    />
                    <ProfileInputField
                        label="Повторите пароль"
                        value={newPasswordRepeat}
                        type="password"
                        placeholder="Повторите пароль"
                        onChange={(event) => onNewPasswordRepeatChange(event.target.value)}
                    />
                </div>

                <ProfileActionButton
                    variant="muted"
                    className={styles.actionButton}
                    onClick={onPasswordSave}
                    disabled={isSavingPassword}
                >
                    {isSavingPassword ? 'Сохранение...' : 'Сменить пароль'}
                </ProfileActionButton>

                {passwordError ? <p className={styles.errorText}>{passwordError}</p> : null}
                {passwordMessage ? <p className={styles.successText}>{passwordMessage}</p> : null}
            </section>
        </div>
    );
}

