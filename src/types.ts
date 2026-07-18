export type StoreId = 'ah' | 'jumbo' | 'dirk' | 'lidl' | 'aldi' | 'plus';

export type Store = {
  id: StoreId;
  name: string;
  color: string;
  /** Short label for dense chips where the full name won't fit. */
  short: string;
};

export type CategoryId =
  | 'groente-fruit'
  | 'vlees-vis'
  | 'zuivel'
  | 'brood'
  | 'kaas-beleg'
  | 'voorraadkast'
  | 'diepvries'
  | 'dranken'
  | 'snoep-snacks'
  | 'huishouden'
  | 'verzorging'
  | 'baby'
  | 'huisdier'
  | 'overig';

export type Category = {
  id: CategoryId;
  /** Dutch name — matches what's on the shelf. */
  name: string;
  emoji: string;
};

/** An entry in the searchable item bank (bundled) or a user-made custom item. */
export type CatalogItem = {
  id: string;
  /** Dutch product name, e.g. "Halfvolle melk". */
  name: string;
  category: CategoryId;
  unit: string;
  emoji?: string;
  custom?: boolean;
};

/**
 * The state of one item on the list. Store-agnostic by design: `pickedAt`
 * records *where* it was acquired, but the item itself is single-source-of-
 * truth, which is what makes cross-store tick-off work.
 */
export type ListItem = {
  id: string;
  catalogId: string;
  name: string;
  category: CategoryId;
  qty: number;
  unit: string;
  /** Store the user intends to buy this at. null = "anywhere". */
  preferredStore: StoreId | null;
  status: 'pending' | 'picked' | 'unavailable' | 'not-needed';
  /** Which store it was actually picked up at. */
  pickedAt?: StoreId | null;
  /** Overrides the remembered price for this trip only. */
  priceOverride?: number;
  note?: string;
  addedAt: number;
  /** Set when carried over from a trip where it was marked unavailable. */
  carriedOver?: boolean;
};

export type Deal = {
  id: string;
  store: StoreId;
  title: string;
  /** Free text as printed in the folder, e.g. "2e halve prijs". */
  offer: string;
  price?: number;
  originalPrice?: number;
  category?: CategoryId;
  validFrom: string;
  validTo: string;
  image?: string;
};

export type DealsFeed = {
  /** ISO timestamp of the scrape run that produced this feed. */
  generatedAt: string;
  stores: Partial<Record<StoreId, { ok: boolean; count: number; error?: string }>>;
  deals: Deal[];
};

/** Remembered prices, keyed `${catalogId}:${storeId}`. */
export type PriceBook = Record<string, { price: number; updatedAt: number }>;

export type TripItem = {
  catalogId: string;
  name: string;
  qty: number;
  price: number;
  store: StoreId | null;
  status: ListItem['status'];
};

export type Trip = {
  id: string;
  finishedAt: number;
  items: TripItem[];
  total: number;
  storeTotals: Partial<Record<StoreId, number>>;
};
