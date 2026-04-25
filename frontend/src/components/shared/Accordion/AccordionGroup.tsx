'use client';

import React, { useState } from 'react';
import { AccordionItemProps } from './AccordionItem';

interface AccordionGroupProps {
    children: React.ReactElement<AccordionItemProps> | React.ReactElement<AccordionItemProps>[];
    alwaysOpen?: boolean;
    className?: string;
}

const AccordionGroup: React.FC<AccordionGroupProps> = ({
    children,
    alwaysOpen = false,
    className = '',
}) => {
    const [openIndex, setOpenIndex] = useState<number | null>(null);

    const handleToggle = (index: number) => {
        if (alwaysOpen) return;
        setOpenIndex(openIndex === index ? null : index);
    };

    return (
        <div className={className}>
            {React.Children.map(children, (child, index) => {
                if (!React.isValidElement<AccordionItemProps>(child)) return null;

                const nextProps: Partial<AccordionItemProps> = {
                    isOpen: alwaysOpen ? child.props.isOpen : openIndex === index,
                    onToggle: () => {
                        handleToggle(index);
                        if (child.props.onToggle) {
                            child.props.onToggle();
                        }
                    },
                };

                return React.cloneElement(child, nextProps);
            })}
        </div>
    );
};

export default AccordionGroup;
