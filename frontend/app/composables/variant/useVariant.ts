import type { GeneratedVariant } from '@/types/generatedVariant';

export const useVariant = () => {
  const currentVariant = useCurrentVariant();

  const setVariant = (variant: GeneratedVariant) => {
    if (!variant) return;
    currentVariant.value = variant;
  };

  return {
    currentVariant,
    setVariant,
  };
};
