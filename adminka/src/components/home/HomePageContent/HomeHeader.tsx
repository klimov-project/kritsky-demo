'use client';

import React from 'react';
import AppHeader from '@/components/shared/AppHeader';

interface HomeHeaderProps {
    cartItemsCount?: number;
}

export default function HomeHeader({ cartItemsCount = 1 }: HomeHeaderProps) {
    return <AppHeader mode="user" cartItemsCount={cartItemsCount} useOuterContainer={false} />;
}
