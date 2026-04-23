'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

import type { AuthUser } from '@/lib/authApi';
import {
    changePassword as apiChangePassword,
    clearAuthSession,
    getCurrentUser,
    loginAdmin,
    loginWithEmail,
    registerWithEmail,
    updateProfile as apiUpdateProfile,
} from '@/lib/authApi';

interface AuthContextType {
    user: AuthUser | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    isAdmin: boolean;
    login: (email: string, password: string) => Promise<AuthUser>;
    register: (payload: { email: string; password: string; name?: string }) => Promise<AuthUser>;
    adminLogin: (login: string, password: string) => Promise<AuthUser>;
    logout: (redirectTo?: string) => void;
    refreshUser: () => Promise<void>;
    updateProfile: (payload: { name?: string; phone?: string }) => Promise<AuthUser>;
    changePassword: (payload: { currentPassword: string; newPassword: string }) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const [user, setUser] = useState<AuthUser | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const refreshUser = useCallback(async () => {
        const current = await getCurrentUser();
        setUser(current);
    }, []);

    useEffect(() => {
        let cancelled = false;

        const bootstrap = async () => {
            try {
                const current = await getCurrentUser();
                if (!cancelled) {
                    setUser(current);
                }
            } catch {
                if (!cancelled) {
                    clearAuthSession();
                    setUser(null);
                }
            } finally {
                if (!cancelled) {
                    setIsLoading(false);
                }
            }
        };

        void bootstrap();

        return () => {
            cancelled = true;
        };
    }, []);

    const login = useCallback(async (email: string, password: string) => {
        const nextUser = await loginWithEmail({ email, password });
        setUser(nextUser);
        return nextUser;
    }, []);

    const register = useCallback(async (payload: { email: string; password: string; name?: string }) => {
        const nextUser = await registerWithEmail(payload);
        setUser(nextUser);
        return nextUser;
    }, []);

    const adminLogin = useCallback(async (loginValue: string, password: string) => {
        const nextUser = await loginAdmin({ login: loginValue, password });
        setUser(nextUser);
        return nextUser;
    }, []);

    const logout = useCallback((redirectTo = '/') => {
        clearAuthSession();
        setUser(null);
        router.push(redirectTo);
    }, [router]);

    const updateProfile = useCallback(async (payload: { name?: string; phone?: string }) => {
        const nextUser = await apiUpdateProfile(payload);
        setUser(nextUser);
        return nextUser;
    }, []);

    const changePassword = useCallback(async (payload: { currentPassword: string; newPassword: string }) => {
        await apiChangePassword({
            oldPassword: payload.currentPassword,
            newPassword: payload.newPassword,
        });
    }, []);

    const value = useMemo<AuthContextType>(() => ({
        user,
        isLoading,
        isAuthenticated: Boolean(user),
        isAdmin: user?.role === 'admin',
        login,
        register,
        adminLogin,
        logout,
        refreshUser,
        updateProfile,
        changePassword,
    }), [adminLogin, changePassword, isLoading, login, logout, refreshUser, register, updateProfile, user]);

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used within an AuthProvider');
    return context;
}
