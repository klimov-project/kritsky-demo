'use client';

import Link from 'next/link';
import { IoIosClose } from 'react-icons/io';

import Button from '@/components/shared/Button';
import Input from '@/components/shared/Input';
import type { AdminLoginCardProps } from '@/types/ui/adminLogin';

export default function AdminLoginCard({
    loginValue,
    password,
    error,
    isSubmitting,
    onLoginValueChange,
    onPasswordChange,
    onSubmit,
}: AdminLoginCardProps) {
    return (
        <div className="min-h-screen w-full bg-[#D9D9D9]/40 flex flex-col items-center pt-[100px] pb-20 font-serif">
            <div className="w-full max-w-[500px] bg-white rounded-[16px] px-[24px] py-[40px] flex flex-col items-center shadow-lg">
                <div className="relative w-full flex items-center justify-center mb-10">
                    <h2 className="text-[24px] font-bold">Админ-панель</h2>
                    <Link
                        href="/"
                        className="absolute right-0 text-3xl hover:opacity-70 transition-opacity"
                        aria-label="На главную"
                    >
                        <IoIosClose />
                    </Link>
                </div>

                <form onSubmit={onSubmit} className="w-full flex flex-col gap-6">
                    <Input
                        label="Логин / email"
                        width="full"
                        placeholder="admin"
                        value={loginValue}
                        onChange={(event) => onLoginValueChange(event.target.value)}
                        required
                        state={error ? 'error' : 'regular'}
                    />
                    <Input
                        label="Пароль"
                        width="full"
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(event) => onPasswordChange(event.target.value)}
                        required
                        state={error ? 'error' : 'regular'}
                        helperText={error}
                    />
                    <Button type="submit" fullWidth variant="filled" className="mt-4" disabled={isSubmitting}>
                        {isSubmitting ? 'Вхожу...' : 'Войти'}
                    </Button>
                </form>
            </div>
        </div>
    );
}
