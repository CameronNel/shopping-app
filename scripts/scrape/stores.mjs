/**
 * One scraper per store. Each exports `fetchDeals()` returning Deal[].
 *
 * These talk to undocumented endpoints that the stores can change without
 * notice. That's expected and handled: index.mjs runs each in isolation, so a
 * store that breaks is reported as failed while the others still publish.
 * Nothing here is load-bearing for the app — it falls back to the last good
 * feed, then to a bundled seed.
 */

const UA =
  'Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Mobile Safari/537.36';

const TIMEOUT_MS = 20_000;

async function get(url, opts = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      ...opts,
      signal: controller.signal,
      headers: { 'user-agent': UA, accept: 'application/json', ...(opts.headers ?? {}) },
    });
    if (!res.ok) throw new Error(`${url} → HTTP ${res.status}`);
    return res;
  } finally {
    clearTimeout(timer);
  }
}

/** Deals run Mon–Sun; we publish the window the scrape day falls in. */
function currentWeek(now = new Date()) {
  const day = now.getUTCDay(); // 0 = Sunday
  const offsetToMonday = day === 0 ? -6 : 1 - day;
  const from = new Date(now);
  from.setUTCDate(now.getUTCDate() + offsetToMonday);
  const to = new Date(from);
  to.setUTCDate(from.getUTCDate() + 6);
  return { validFrom: from.toISOString().slice(0, 10), validTo: to.toISOString().slice(0, 10) };
}

function money(v) {
  if (v == null) return undefined;
  const n = typeof v === 'string' ? parseFloat(v.replace(',', '.')) : Number(v);
  return Number.isFinite(n) ? n : undefined;
}

/* ------------------------------------------------------------------ */
/* Albert Heijn                                                        */
/* ------------------------------------------------------------------ */

/** AH's mobile API issues anonymous tokens to the "appie" client. */
async function ahToken() {
  const res = await get('https://api.ah.nl/mobile-auth/v1/auth/token/anonymous', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ clientId: 'appie' }),
  });
  const json = await res.json();
  if (!json.access_token) throw new Error('AH returned no access_token');
  return json.access_token;
}

async function ah() {
  const token = await ahToken();
  const week = currentWeek();
  const res = await get('https://api.ah.nl/mobile-services/bonuspage/v1/metadata', {
    headers: { authorization: `Bearer ${token}`, 'x-application': 'AHWEBSHOP' },
  });
  const meta = await res.json();

  const segments = meta?.periods?.[0]?.segments ?? meta?.segments ?? [];
  const deals = [];

  for (const segment of segments.slice(0, 12)) {
    const id = segment.id ?? segment.segmentId;
    if (!id) continue;
    try {
      const segRes = await get(
        `https://api.ah.nl/mobile-services/bonuspage/v1/segment/${id}`,
        { headers: { authorization: `Bearer ${token}`, 'x-application': 'AHWEBSHOP' } },
      );
      const seg = await segRes.json();
      for (const p of seg?.products ?? []) {
        deals.push({
          id: `ah-${p.id ?? p.webshopId ?? deals.length}`,
          store: 'ah',
          title: p.title ?? p.description ?? 'Aanbieding',
          offer: p.shield?.text ?? p.discount?.bonusType ?? 'Bonus',
          price: money(p.currentPrice ?? p.priceBeforeBonus),
          originalPrice: money(p.priceBeforeBonus),
          validFrom: week.validFrom,
          validTo: week.validTo,
          image: p.images?.[0]?.url,
        });
      }
    } catch {
      // One bad segment shouldn't sink the whole store.
    }
  }

  if (!deals.length) throw new Error('AH returned zero deals');
  return deals;
}

/* ------------------------------------------------------------------ */
/* Jumbo                                                               */
/* ------------------------------------------------------------------ */

async function jumbo() {
  const week = currentWeek();
  const res = await get('https://mobileapi.jumbo.com/v17/promotion-overview', {
    headers: { 'x-jumbo-token': '', accept: 'application/json' },
  });
  const json = await res.json();

  const tabs = json?.tabs ?? [];
  const deals = [];
  for (const tab of tabs) {
    for (const group of tab.runtimes ?? []) {
      for (const p of group.promotions ?? []) {
        deals.push({
          id: `jumbo-${p.id ?? deals.length}`,
          store: 'jumbo',
          title: p.title ?? p.subtitle ?? 'Aanbieding',
          offer: p.tags?.[0]?.text ?? p.subtitle ?? 'Actie',
          price: money(p.price?.current ?? p.primaryBadge?.text),
          originalPrice: money(p.price?.was),
          validFrom: group.from?.slice(0, 10) ?? week.validFrom,
          validTo: group.to?.slice(0, 10) ?? week.validTo,
          image: p.image,
        });
      }
    }
  }

  if (!deals.length) throw new Error('Jumbo returned zero deals');
  return deals;
}

/* ------------------------------------------------------------------ */
/* Dirk / Lidl / Aldi / PLUS                                           */
/* ------------------------------------------------------------------ */

/**
 * These four publish their folders as JSON behind their websites. The shapes
 * differ per chain and change more often than AH/Jumbo, so each is a
 * best-effort parse over a couple of known response shapes.
 */
async function genericFolder(storeId, url, extract) {
  const week = currentWeek();
  const res = await get(url, { headers: { accept: 'application/json, text/html' } });
  const text = await res.text();

  let payload;
  try {
    payload = JSON.parse(text);
  } catch {
    // Next.js sites embed their data in __NEXT_DATA__.
    const match = text.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
    if (!match) throw new Error(`${storeId}: response was neither JSON nor __NEXT_DATA__`);
    payload = JSON.parse(match[1]);
  }

  const deals = extract(payload, week, money);
  if (!deals.length) throw new Error(`${storeId} returned zero deals`);
  return deals;
}

const dirk = () =>
  genericFolder(
    'dirk',
    'https://www.dirk.nl/api/offers/current',
    (payload, week) =>
      (Array.isArray(payload) ? payload : (payload?.offers ?? [])).map((o, i) => ({
        id: `dirk-${o.id ?? i}`,
        store: 'dirk',
        title: o.name ?? o.title ?? 'Aanbieding',
        offer: o.promotionLabel ?? o.discountLabel ?? 'Actie',
        price: money(o.offerPrice ?? o.price),
        originalPrice: money(o.normalPrice ?? o.oldPrice),
        validFrom: o.validFrom?.slice(0, 10) ?? week.validFrom,
        validTo: o.validTo?.slice(0, 10) ?? week.validTo,
        image: o.image,
      })),
  );

const lidl = () =>
  genericFolder(
    'lidl',
    'https://www.lidl.nl/q/api/gridboxes?assortment=NL&locale=nl_NL',
    (payload, week) =>
      (payload?.gridboxes ?? payload?.items ?? []).map((o, i) => ({
        id: `lidl-${o.productId ?? i}`,
        store: 'lidl',
        title: o.keyfacts?.fullTitle ?? o.fullTitle ?? 'Aanbieding',
        offer: o.price?.discount?.discountText ?? 'Actie',
        price: money(o.price?.price),
        originalPrice: money(o.price?.oldPrice),
        validFrom: week.validFrom,
        validTo: week.validTo,
        image: o.image,
      })),
  );

const aldi = () =>
  genericFolder(
    'aldi',
    'https://www.aldi.nl/.rest/aldi/offers',
    (payload, week) =>
      (payload?.offers ?? payload?.items ?? []).map((o, i) => ({
        id: `aldi-${o.id ?? i}`,
        store: 'aldi',
        title: o.title ?? o.name ?? 'Aanbieding',
        offer: o.subtitle ?? 'Actie',
        price: money(o.price),
        originalPrice: money(o.oldPrice),
        validFrom: o.dateFrom?.slice(0, 10) ?? week.validFrom,
        validTo: o.dateTo?.slice(0, 10) ?? week.validTo,
        image: o.image,
      })),
  );

const plus = () =>
  genericFolder(
    'plus',
    'https://www.plus.nl/api/v1/promotions',
    (payload, week) =>
      (payload?.promotions ?? payload?.items ?? []).map((o, i) => ({
        id: `plus-${o.id ?? i}`,
        store: 'plus',
        title: o.name ?? o.title ?? 'Aanbieding',
        offer: o.promotionText ?? 'Actie',
        price: money(o.promotionPrice ?? o.price),
        originalPrice: money(o.regularPrice),
        validFrom: o.startDate?.slice(0, 10) ?? week.validFrom,
        validTo: o.endDate?.slice(0, 10) ?? week.validTo,
        image: o.image,
      })),
  );

export const SCRAPERS = { ah, jumbo, dirk, lidl, aldi, plus };
