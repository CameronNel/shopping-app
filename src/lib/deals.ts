import type { DealsFeed } from '@/types';
import SEED from '@/data/deals.seed.json';
import { useAppStore } from '@/store/useAppStore';

/**
 * The deals feed is produced by .github/workflows/deals.yml and committed to
 * this repo, so the "backend" is just a static file on a CDN — no server, no
 * cost, nothing to keep alive.
 */
const FEED_URL =
  'https://raw.githubusercontent.com/CameronNel/Shopping-App/main/data/deals.json';

const FETCH_TIMEOUT_MS = 10_000;

export type RefreshResult = {
  source: 'network' | 'cache' | 'seed';
  feed: DealsFeed;
  error?: string;
};

/**
 * Three-tier fallback: live feed → last good feed in local storage → the seed
 * bundled in the binary. The deals tab is therefore never empty, even on a
 * fresh install with no connection.
 */
export async function refreshDeals(force = false): Promise<RefreshResult> {
  const { deals, dealsFetchedAt, setDeals, setDealsError } = useAppStore.getState();

  const isFresh =
    !force && dealsFetchedAt != null && Date.now() - dealsFetchedAt < 6 * 60 * 60 * 1000;
  if (isFresh && deals) return { source: 'cache', feed: deals };

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const res = await fetch(`${FEED_URL}?t=${Date.now()}`, { signal: controller.signal });
    if (!res.ok) throw new Error(`Feed returned ${res.status}`);
    const feed = (await res.json()) as DealsFeed;
    if (!feed || !Array.isArray(feed.deals)) throw new Error('Feed was malformed');
    setDeals(feed);
    return { source: 'network', feed };
  } catch (e) {
    const error = e instanceof Error ? e.message : 'Could not reach the deals feed';
    setDealsError(error);
    if (deals) return { source: 'cache', feed: deals, error };
    return { source: 'seed', feed: SEED as DealsFeed, error };
  } finally {
    clearTimeout(timer);
  }
}

export function dealIsActive(deal: { validFrom: string; validTo: string }, on = new Date()) {
  const day = on.toISOString().slice(0, 10);
  return deal.validFrom <= day && day <= deal.validTo;
}

/** Human "3 hours ago" style label for the refresh button subtitle. */
export function relativeTime(ts: number | null): string {
  if (!ts) return 'never';
  const mins = Math.floor((Date.now() - ts) / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? '' : 's'} ago`;
}
