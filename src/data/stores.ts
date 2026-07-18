import type { Category, Store, StoreId } from '@/types';

export const STORES: Store[] = [
  { id: 'ah', name: 'Albert Heijn', short: 'AH', color: '#00A0E2' },
  { id: 'jumbo', name: 'Jumbo', short: 'Jumbo', color: '#EFB800' },
  { id: 'dirk', name: 'Dirk', short: 'Dirk', color: '#E2001A' },
  { id: 'lidl', name: 'Lidl', short: 'Lidl', color: '#0050AA' },
  { id: 'aldi', name: 'Aldi', short: 'Aldi', color: '#00549F' },
  { id: 'plus', name: 'PLUS', short: 'PLUS', color: '#E30613' },
];

export const STORE_BY_ID: Record<StoreId, Store> = Object.fromEntries(
  STORES.map((s) => [s.id, s]),
) as Record<StoreId, Store>;

export const CATEGORIES: Category[] = [
  { id: 'groente-fruit', name: 'Groente & Fruit', emoji: '🥬' },
  { id: 'vlees-vis', name: 'Vlees & Vis', emoji: '🍗' },
  { id: 'zuivel', name: 'Zuivel & Eieren', emoji: '🥛' },
  { id: 'brood', name: 'Brood & Banket', emoji: '🍞' },
  { id: 'kaas-beleg', name: 'Kaas & Beleg', emoji: '🧀' },
  { id: 'voorraadkast', name: 'Voorraadkast', emoji: '🥫' },
  { id: 'diepvries', name: 'Diepvries', emoji: '🧊' },
  { id: 'dranken', name: 'Dranken', emoji: '🧃' },
  { id: 'snoep-snacks', name: 'Snoep & Snacks', emoji: '🍫' },
  { id: 'huishouden', name: 'Huishouden', emoji: '🧽' },
  { id: 'verzorging', name: 'Verzorging', emoji: '🧴' },
  { id: 'baby', name: 'Baby', emoji: '🍼' },
  { id: 'huisdier', name: 'Huisdier', emoji: '🐾' },
  { id: 'overig', name: 'Overig', emoji: '📦' },
];

export const CATEGORY_BY_ID = Object.fromEntries(
  CATEGORIES.map((c) => [c.id, c]),
) as Record<Category['id'], Category>;
