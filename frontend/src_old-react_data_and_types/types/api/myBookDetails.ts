import type { GeneratedCollectionPack, GeneratedCollectionVariant, PurchasedItem } from '@/types/shop';

export type MyBookDetailsPurchase = PurchasedItem | null;

export type MyBookDetailsGeneratedPack = GeneratedCollectionPack;

export type MyBookDetailsGeneratedVariant = GeneratedCollectionVariant;

export type MyBookDetailsRevealedAnswers = Record<string, boolean>;
