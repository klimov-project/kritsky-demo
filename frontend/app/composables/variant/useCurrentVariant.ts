import type { GeneratedVariant } from '@/types/generatedVariant';

export const useCurrentVariant = () => {
  return useState<GeneratedVariant | null>('current-variant', () => null);
};
