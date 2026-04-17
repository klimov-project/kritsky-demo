'use client';

import Button from '@/components/shared/Button';
import Input from '@/components/shared/Input';
import type { LoginAuthCardProps } from '@/types/ui/login';
import {
    getAuthPageTitle,
    getAuthPhoneButtonLabel,
    getAuthSubmitLabel,
    getAuthTabToggleLabel,
    getAuthTelegramButtonLabel,
} from '@/utils/login';

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
    onTelegramAuthClick,
    onToggleTab,
    onSubmit,
}: LoginAuthCardProps) {
    return (
        <div className="flex min-h-[calc(100vh-180px)] w-full items-center justify-center py-10 md:py-14">
            <section className="w-full max-w-[520px] rounded-[24px] border border-[#221E20]/10 bg-white px-5 py-7 shadow-sm md:px-8 md:py-8">
                <div className="mx-auto w-full max-w-[420px]">
                    <div className="mb-8 text-center">
                        <h1 className="font-serif text-[30px] font-bold text-[#221E20]">
                            {getAuthPageTitle(activeTab)}
                        </h1>
                    </div>

                    <form onSubmit={onSubmit} className="flex flex-col gap-4">
                        {activeTab === 'register' && (
                            <Input
                                label="Имя"
                                value={name}
                                onChange={(event) => onNameChange(event.target.value)}
                                width="full"
                                placeholder="Иван Иванов"
                            />
                        )}
                        <Input
                            label="E-mail"
                            value={email}
                            onChange={(event) => onEmailChange(event.target.value)}
                            width="full"
                            type="email"
                            placeholder="example@mail.com"
                            required
                            state={error ? 'error' : 'regular'}
                        />
                        <Input
                            label="Пароль"
                            value={password}
                            onChange={(event) => onPasswordChange(event.target.value)}
                            width="full"
                            type="password"
                            placeholder="••••••••"
                            required
                            state={error ? 'error' : 'regular'}
                            helperText={error}
                        />

                        <div className="grid grid-cols-2 gap-2 pt-1">
                            <Button
                                type="button"
                                variant="filled"
                                size="small"
                                fullWidth
                                onClick={onPhoneAuthClick}
                            >
                                {getAuthPhoneButtonLabel(activeTab)}
                            </Button>
                            <Button
                                type="button"
                                variant="filled"
                                size="small"
                                fullWidth
                                onClick={onTelegramAuthClick}
                            >
                                {getAuthTelegramButtonLabel(activeTab)}
                            </Button>
                        </div>

                        <Button fullWidth variant="filled" className="mt-2" type="submit" disabled={isSubmitting}>
                            {getAuthSubmitLabel(activeTab, isSubmitting)}
                        </Button>
                    </form>

                    <div className="mt-7 border-t border-[#221E20]/10 pt-4 text-center">
                        <button
                            type="button"
                            className="text-sm text-[#221E20]/60 transition-colors hover:text-[#221E20]"
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
