import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { CATALOG_BY_ID } from '@/data/catalog';
import type {
  CatalogItem,
  CategoryId,
  DealsFeed,
  ListItem,
  PriceBook,
  StoreId,
  Trip,
} from '@/types';

type Settings = {
  enabledStores: StoreId[];
  showMascot: boolean;
  hapticsEnabled: boolean;
  autoRefreshDeals: boolean;
  currency: string;
  /** Weekly budget in euros; null disables the budget bar on the summary. */
  weeklyBudget: number | null;
};

type State = {
  items: ListItem[];
  customItems: CatalogItem[];
  prices: PriceBook;
  /** catalogId → number of trips it has appeared on. Drives "frequently bought". */
  frequency: Record<string, number>;
  deals: DealsFeed | null;
  dealsFetchedAt: number | null;
  dealsError: string | null;
  trips: Trip[];
  settings: Settings;
};

type Actions = {
  addItem: (catalogId: string, opts?: { qty?: number; store?: StoreId | null }) => void;
  addCustomItem: (name: string, category: CategoryId, unit: string) => string;
  removeItem: (id: string) => void;
  updateItem: (id: string, patch: Partial<ListItem>) => void;
  setQty: (id: string, qty: number) => void;
  setPreferredStore: (id: string, store: StoreId | null) => void;

  /**
   * Cross-store tick-off. Status lives on the item, not on an (item, store)
   * pair, so ticking anywhere resolves it everywhere — the aggregate list and
   * every per-store view read the same field.
   */
  setStatus: (id: string, status: ListItem['status'], atStore?: StoreId | null) => void;
  togglePicked: (id: string, atStore?: StoreId | null) => void;

  setPrice: (catalogId: string, store: StoreId, price: number) => void;
  getPrice: (catalogId: string, store: StoreId | null) => number | null;

  setDeals: (feed: DealsFeed) => void;
  setDealsError: (err: string | null) => void;

  /** Closes the trip: banks the totals, bumps frequency, carries unavailables over. */
  finishTrip: () => Trip;
  clearList: () => void;

  updateSettings: (patch: Partial<Settings>) => void;
  resetAll: () => void;
};

const DEFAULT_SETTINGS: Settings = {
  enabledStores: ['ah', 'jumbo', 'dirk', 'lidl', 'aldi', 'plus'],
  showMascot: true,
  hapticsEnabled: true,
  autoRefreshDeals: true,
  currency: '€',
  weeklyBudget: null,
};

const INITIAL: State = {
  items: [],
  customItems: [],
  prices: {},
  frequency: {},
  deals: null,
  dealsFetchedAt: null,
  dealsError: null,
  trips: [],
  settings: DEFAULT_SETTINGS,
};

const uid = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

const priceKey = (catalogId: string, store: StoreId) => `${catalogId}:${store}`;

export const useAppStore = create<State & Actions>()(
  persist(
    (set, get) => ({
      ...INITIAL,

      addItem: (catalogId, opts) => {
        const catalog = CATALOG_BY_ID.get(catalogId) ??
          get().customItems.find((c) => c.id === catalogId);
        if (!catalog) return;

        // Adding something already on the list bumps its quantity instead of
        // creating a duplicate row — matches what people expect when they tap twice.
        const existing = get().items.find(
          (i) => i.catalogId === catalogId && i.status !== 'not-needed',
        );
        if (existing) {
          set((s) => ({
            items: s.items.map((i) =>
              i.id === existing.id ? { ...i, qty: i.qty + (opts?.qty ?? 1) } : i,
            ),
          }));
          return;
        }

        const item: ListItem = {
          id: uid(),
          catalogId,
          name: catalog.name,
          category: catalog.category,
          qty: opts?.qty ?? 1,
          unit: catalog.unit,
          preferredStore: opts?.store ?? null,
          status: 'pending',
          addedAt: Date.now(),
        };
        set((s) => ({ items: [...s.items, item] }));
      },

      addCustomItem: (name, category, unit) => {
        const id = `custom:${uid()}`;
        const item: CatalogItem = { id, name, category, unit, custom: true, emoji: '✨' };
        set((s) => ({ customItems: [...s.customItems, item] }));
        return id;
      },

      removeItem: (id) => set((s) => ({ items: s.items.filter((i) => i.id !== id) })),

      updateItem: (id, patch) =>
        set((s) => ({ items: s.items.map((i) => (i.id === id ? { ...i, ...patch } : i)) })),

      setQty: (id, qty) =>
        set((s) => ({
          items: s.items.map((i) => (i.id === id ? { ...i, qty: Math.max(1, qty) } : i)),
        })),

      setPreferredStore: (id, store) =>
        set((s) => ({
          items: s.items.map((i) => (i.id === id ? { ...i, preferredStore: store } : i)),
        })),

      setStatus: (id, status, atStore = null) =>
        set((s) => ({
          items: s.items.map((i) =>
            i.id === id
              ? { ...i, status, pickedAt: status === 'picked' ? atStore : undefined }
              : i,
          ),
        })),

      togglePicked: (id, atStore = null) => {
        const item = get().items.find((i) => i.id === id);
        if (!item) return;
        get().setStatus(id, item.status === 'picked' ? 'pending' : 'picked', atStore);
      },

      setPrice: (catalogId, store, price) =>
        set((s) => ({
          prices: {
            ...s.prices,
            [priceKey(catalogId, store)]: { price, updatedAt: Date.now() },
          },
        })),

      getPrice: (catalogId, store) => {
        const { prices } = get();
        if (store) {
          const exact = prices[priceKey(catalogId, store)];
          if (exact) return exact.price;
        }
        // No price for this store yet — fall back to the average of what we
        // know elsewhere so the total is an estimate rather than a zero.
        const known = Object.entries(prices)
          .filter(([k]) => k.startsWith(`${catalogId}:`))
          .map(([, v]) => v.price);
        if (!known.length) return null;
        return known.reduce((a, b) => a + b, 0) / known.length;
      },

      setDeals: (feed) =>
        set({ deals: feed, dealsFetchedAt: Date.now(), dealsError: null }),

      setDealsError: (err) => set({ dealsError: err }),

      finishTrip: () => {
        const { items, getPrice } = get();
        const counted = items.filter((i) => i.status === 'picked');

        const storeTotals: Partial<Record<StoreId, number>> = {};
        let total = 0;
        const tripItems = counted.map((i) => {
          const unitPrice = i.priceOverride ?? getPrice(i.catalogId, i.pickedAt ?? i.preferredStore) ?? 0;
          const line = unitPrice * i.qty;
          total += line;
          const store = i.pickedAt ?? i.preferredStore;
          if (store) storeTotals[store] = (storeTotals[store] ?? 0) + line;
          return {
            catalogId: i.catalogId,
            name: i.name,
            qty: i.qty,
            price: line,
            store,
            status: i.status,
          };
        });

        const trip: Trip = {
          id: uid(),
          finishedAt: Date.now(),
          items: tripItems,
          total,
          storeTotals,
        };

        const frequency = { ...get().frequency };
        for (const i of counted) frequency[i.catalogId] = (frequency[i.catalogId] ?? 0) + 1;

        // Unavailable items are the whole point of the flag — they survive the
        // trip and reappear next time, flagged so it's clear why they're back.
        const carried = items
          .filter((i) => i.status === 'unavailable')
          .map((i) => ({ ...i, status: 'pending' as const, carriedOver: true, pickedAt: undefined }));

        set((s) => ({
          trips: [trip, ...s.trips].slice(0, 52),
          items: carried,
          frequency,
        }));
        return trip;
      },

      clearList: () => set({ items: [] }),

      updateSettings: (patch) => set((s) => ({ settings: { ...s.settings, ...patch } })),

      resetAll: () => set({ ...INITIAL }),
    }),
    {
      name: 'shopping-app-v1',
      storage: createJSONStorage(() => AsyncStorage),
      // Deals are re-fetched on launch; persisting them only serves the
      // offline case, so they're kept but the error state is not.
      partialize: (s) => ({
        items: s.items,
        customItems: s.customItems,
        prices: s.prices,
        frequency: s.frequency,
        deals: s.deals,
        dealsFetchedAt: s.dealsFetchedAt,
        trips: s.trips,
        settings: s.settings,
      }),
    },
  ),
);
