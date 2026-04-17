import Button from '@/components/shared/Button';
import type { DockButtonProps } from '@/types/ui/newTestPage';

export default function DockButton({
    children,
    onClick,
    disabled,
    fullWidth = false,
}: DockButtonProps) {
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
