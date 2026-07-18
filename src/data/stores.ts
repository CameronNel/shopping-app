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
  { id: 'groente-fruit', name: 'Vegetables & Fruit', emoji: '🥬' },
  { id: 'vlees-vis', name: 'Meat & Fish', emoji: '🍗' },
  { id: 'zuivel', name: 'Dairy & Eggs', emoji: '🥛' },
  { id: 'brood', name: 'Bread & Pastries', emoji: '🍞' },
  { id: 'kaas-beleg', name: 'Cheese & Deli', emoji: '🧀' },
  { id: 'voorraadkast', name: 'Pantry', emoji: '🥫' },
  { id: 'diepvries', name: 'Frozen', emoji: '🧊' },
  { id: 'dranken', name: 'Drinks', emoji: '🧃' },
  { id: 'snoep-snacks', name: 'Sweets & Snacks', emoji: '🍫' },
  { id: 'huishouden', name: 'Household', emoji: '🧽' },
  { id: 'verzorging', name: 'Personal Care', emoji: '🧴' },
  { id: 'baby', name: 'Baby', emoji: '🍼' },
  { id: 'huisdier', name: 'Pets', emoji: '🐾' },
  { id: 'overig', name: 'Other', emoji: '📦' },
];

export const CATEGORY_BY_ID = Object.fromEntries(
  CATEGORIES.map((c) => [c.id, c]),
) as Record<Category['id'], Category>;
