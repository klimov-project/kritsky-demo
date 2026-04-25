'use client';

import React from 'react';
import Button from '@/components/shared/Button';

interface PaginationProps {
    page: number;
    totalPages: number;
    onPageChange: (page: number) => void;
}

export default function Pagination({ page, totalPages, onPageChange }: PaginationProps) {
    if (totalPages <= 1) return null;

    return (
        <div className="mt-6 flex items-center justify-center gap-2 flex-wrap">
            <Button
                variant="outlined"
                className="!py-2 !px-3 !text-sm"
                disabled={page === 1}
                onClick={() => onPageChange(page - 1)}
            >
                Назад
            </Button>

            {Array.from({ length: totalPages }).map((_, index) => {
                const currentPage = index + 1;
                const isActive = currentPage === page;

                return (
                    <button
                        key={currentPage}
                        type="button"
                        onClick={() => onPageChange(currentPage)}
                        className={`min-w-[36px] h-[36px] px-2 rounded border text-sm transition-colors ${isActive ? 'bg-[#221E20] text-white border-[#221E20]' : 'bg-white text-[#221E20] border-[#221E20]/20 hover:border-[#221E20]'}`}
                    >
                        {currentPage}
                    </button>
                );
            })}

            <Button
                variant="outlined"
                className="!py-2 !px-3 !text-sm"
                disabled={page === totalPages}
                onClick={() => onPageChange(page + 1)}
            >
                Вперед
            </Button>
        </div>
    );
}
