import type { GeneratedVariant } from '@/types/generatedVariant';

export const useVariant = () => {
  return useState<GeneratedVariant | null>('generated-variant', () => null);
};
