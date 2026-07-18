/**
 * One scraper per store. Each exports an async fn returning Deal[].
 *
 * These talk to undocumented endpoints that the chains change without notice.
 * index.mjs runs each in isolation, so a store that breaks is reported as
 * failed while the others still publish, and the app falls back to its last
 * good feed. Nothing here is load-bearing.
 *
 * Status as of the last verification run:
 *   ah    — working, via the mobile product search API
 *   jumbo — mobileapi.jumbo.com is behind Akamai bot protection (404s to
 *           non-browser clients); needs a new approach
 *   dirk, lidl, aldi, plus — no verified public endpoint yet
 */

const TIMEOUT_MS = 20_000;

async function getJSON(url, opts = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, { ...opts, signal: controller.signal });
    if (!res.ok) throw new Error(`${url} → HTTP ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

/* ------------------------------------------------------------------ */
/* Albert Heijn                                                        */
/* ------------------------------------------------------------------ */

const AH_HEADERS = {
  Host: 'api.ah.nl',
  'x-application': 'AHWEBSHOP',
  'user-agent': 'Appie/8.8.2 Model/phone Android/7.0-API24',
  'content-type': 'application/json; charset=UTF-8',
};

/** AH's dedicated bonuspage API is gone; the product search still carries the
 *  full bonus payload per product, so we page it and keep what's on offer. */
const AH_PAGES = 12;
const AH_PAGE_SIZE = 200;

/** AH's own category names → our internal ids. */
const AH_CATEGORY_MAP = {
  'Groente, aardappelen': 'groente-fruit',
  'Fruit, verse sappen': 'groente-fruit',
  'Vlees, kip, vis, vega': 'vlees-vis',
  'Zuivel, eieren': 'zuivel',
  'Zuivel, eieren, boter': 'zuivel',
  'Kaas, vleeswaren, tapas': 'kaas-beleg',
  'Bakkerij, banket': 'brood',
  'Ontbijtgranen, beleg': 'kaas-beleg',
  'Pasta, rijst, wereldkeuken': 'voorraadkast',
  'Soepen, sauzen, kruiden, olie': 'voorraadkast',
  Diepvries: 'diepvries',
  'Frisdrank, sappen, water': 'dranken',
  'Koffie, thee': 'dranken',
  'Bier, wijn, aperitieven': 'dranken',
  'Snoep, koek, chips': 'snoep-snacks',
  'Chips, noten, toast': 'snoep-snacks',
  'Koken, tafelen, non-food': 'huishouden',
  'Wasmiddel, schoonmaak': 'huishouden',
  'Drogisterij, baby': 'verzorging',
  Baby: 'baby',
  Huisdier: 'huisdier',
};

function ahCategory(product) {
  return AH_CATEGORY_MAP[product.mainCategory] ?? 'overig';
}

async function ahToken() {
  const json = await getJSON('https://api.ah.nl/mobile-auth/v1/auth/token/anonymous', {
    method: 'POST',
    headers: AH_HEADERS,
    body: JSON.stringify({ clientId: 'appie' }),
  });
  if (!json.access_token) throw new Error('AH returned no access_token');
  return json.access_token;
}

async function ah() {
  const token = await ahToken();
  const headers = { ...AH_HEADERS, Authorization: `Bearer ${token}` };

  const seen = new Set();
  const deals = [];

  for (let page = 0; page < AH_PAGES; page += 1) {
    const url = `https://api.ah.nl/mobile-services/product/search/v2?query=&size=${AH_PAGE_SIZE}&page=${page}`;
    let json;
    try {
      json = await getJSON(url, { headers });
    } catch {
      break; // Partial results are fine; stop paging on the first bad page.
    }

    const products = json.products ?? [];
    if (!products.length) break;

    for (const p of products) {
      if (!p.isBonus || seen.has(p.webshopId)) continue;
      seen.add(p.webshopId);

      deals.push({
        id: `ah-${p.webshopId}`,
        store: 'ah',
        title: p.title,
        offer: p.bonusMechanism ?? p.discountType ?? 'Bonus',
        // currentPrice is null for multi-buy offers ("1 + 1 gratis"), where a
        // single-unit price would be misleading — leave it out in that case.
        price: p.currentPrice ?? undefined,
        originalPrice: p.priceBeforeBonus ?? undefined,
        category: ahCategory(p),
        validFrom: p.bonusStartDate ?? undefined,
        validTo: p.bonusEndDate ?? undefined,
        image: p.images?.find((i) => i.width === 200)?.url ?? p.images?.[0]?.url,
      });
    }
  }

  const dated = deals.filter((d) => d.validFrom && d.validTo);
  if (!dated.length) throw new Error('AH returned no dated bonus products');
  return dated;
}

/* ------------------------------------------------------------------ */
/* Not yet wired up                                                    */
/* ------------------------------------------------------------------ */

/**
 * Placeholder for chains without a verified endpoint. Throwing here is the
 * correct behaviour: index.mjs records the store as failed, carries any
 * previous deals forward, and the app shows a red dot in Settings — which is
 * honest, rather than silently implying we cover a chain we don't.
 */
const notImplemented = (store, note) => async () => {
  throw new Error(`${store}: no verified endpoint yet — ${note}`);
};

export const SCRAPERS = {
  ah,
  jumbo: notImplemented(
    'jumbo',
    'mobileapi.jumbo.com is behind Akamai bot protection and 404s non-browser clients',
  ),
  dirk: notImplemented('dirk', 'folder endpoint not located'),
  lidl: notImplemented('lidl', 'folder endpoint not located'),
  aldi: notImplemented('aldi', 'folder endpoint not located'),
  plus: notImplemented('plus', 'folder endpoint not located'),
};
