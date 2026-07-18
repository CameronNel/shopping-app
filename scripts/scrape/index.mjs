import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { SCRAPERS } from './stores.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const OUT = resolve(ROOT, 'data/deals.json');

/**
 * Builds data/deals.json. Every store is scraped independently — a failure is
 * recorded in the feed's `stores` map and the previous run's deals for that
 * store are carried forward, so one broken scraper degrades to stale data for
 * that chain rather than breaking the feed.
 */
async function main() {
  const previous = await readPrevious();

  const entries = Object.entries(SCRAPERS);
  const results = await Promise.allSettled(entries.map(([, fn]) => fn()));

  const stores = {};
  const deals = [];
  let failures = 0;

  for (let index = 0; index < entries.length; index += 1) {
    const [id] = entries[index];
    const result = results[index];
    if (result.status === 'fulfilled') {
      stores[id] = { ok: true, count: result.value.length };
      deals.push(...result.value);
      console.log(`✓ ${id}: ${result.value.length} deals`);
    } else {
      failures += 1;
      const error = result.reason?.message ?? String(result.reason);
      const carried = previous.deals.filter((d) => d.store === id);
      stores[id] = { ok: false, count: carried.length, error };
      deals.push(...carried);
      console.log(`✗ ${id}: ${error} (carried ${carried.length} from previous run)`);
    }
  }

  const feed = { generatedAt: new Date().toISOString(), stores, deals };

  await mkdir(dirname(OUT), { recursive: true });
  await writeFile(OUT, `${JSON.stringify(feed, null, 2)}\n`, 'utf8');

  console.log(`\nWrote ${deals.length} deals to data/deals.json (${failures} store(s) failed)`);

  // Surfaced by the workflow so a total outage opens an issue rather than
  // silently publishing an empty feed.
  if (deals.length === 0) {
    console.error('Every scraper failed and there was nothing to carry forward.');
    process.exit(1);
  }
}

async function readPrevious() {
  try {
    return JSON.parse(await readFile(OUT, 'utf8'));
  } catch {
    return { deals: [] };
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
