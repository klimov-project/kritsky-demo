'use client';

import Button from '@/components/shared/Button';
import type { AuthorVariantDockButtonProps } from '@/types/ui/authorVariant';

export default function AuthorVariantDockButton({
    children,
    onClick,
    disabled,
    fullWidth = false,
}: AuthorVariantDockButtonProps) {
    return (
        <Button
            variant="outlined"
            onClick={onClick}
            disabled={disabled}
            fullWidth={fullWidth}
            fontSize={13}
            paddingY={10}
            paddingX={14}
            className="justify-center"
        >
            {children}
        </Button>
    );
}
