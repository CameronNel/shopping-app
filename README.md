# Shopping List

A mobile-first Dutch grocery shopping app. Build a list from a searchable item
bank, see this week's supermarket deals, then shop it store by store with
cross-store tick-off — mark something picked up at Dirk and it clears from the
Albert Heijn list and the aggregate at the same time.

Built with Expo (React Native) + expo-router. Android first, iOS from the same
codebase.

## Running it

```bash
npm install
npx expo start          # then scan the QR with Expo Go
```

| Script                 | What it does                                              |
| ---------------------- | --------------------------------------------------------- |
| `npm run typecheck`    | TypeScript, no emit                                        |
| `npm run verify`       | Exercises the store logic headlessly (10 checks)           |
| `npm run scrape`       | Runs the deal scrapers locally, writes `data/deals.json`    |
| `npm run placeholders` | Regenerates placeholder art files                          |

## The four tabs

**List** — search ~350 Dutch grocery items across 14 categories, filter by
category or store, add custom items, set a price per item per store, see live
deals and your frequently-bought items, and read a running estimated total.
Group the list by aisle or by store.

**Shop** — work the list with a progress bar. Switch between an "Everything"
view and a per-store view; a store view also shows unassigned items, so you can
grab anything wherever you are. Each item can be ticked off, marked *not
available* (carries over to the next trip), or *no longer needed* (dropped).
Prices can be corrected inline before checkout.

**Summary** — weekly spend with a week-over-week delta, optional budget bar,
spend split by store, biggest line items, and recent trip history.

**Settings** — enable/disable stores, refresh deals with per-store status,
weekly budget, mascot and haptics toggles, and data management.

## How the deals feed works (no server, no cost)

There is no backend. `.github/workflows/deals.yml` runs nightly on GitHub
Actions, scrapes each chain, and commits `data/deals.json` to this repo. The app
reads that file from `raw.githubusercontent.com`.

Failure handling is layered, because these are undocumented endpoints that will
break eventually:

1. Each store is scraped independently. One failing doesn't stop the others.
2. A failed store carries its previous deals forward and is flagged `ok: false`
   in the feed — visible in Settings as a red dot.
3. The app falls back live feed → last good cached feed → bundled seed, so the
   deals tab is never empty even on a fresh install with no connection.
4. If the whole run fails, the workflow opens a GitHub issue.

Worst case is stale deals, never a broken app.

### Store coverage — current reality

| Store         | Deals feed | Notes                                                                    |
| ------------- | ---------- | ------------------------------------------------------------------------ |
| Albert Heijn  | ✅ working  | ~1,200 live bonus products via the mobile product search API             |
| Jumbo         | ❌          | `mobileapi.jumbo.com` sits behind Akamai bot protection, 404s to scripts  |
| Dirk          | ❌          | no verified public endpoint yet                                          |
| Lidl          | ❌          | no verified public endpoint yet                                          |
| Aldi          | ❌          | no verified public endpoint yet                                          |
| PLUS          | ❌          | no verified public endpoint yet                                          |

All six stores are fully usable everywhere else in the app — lists, per-store
tick-off, the price book, totals and the weekly summary don't depend on the
deals feed. Only the deals carousel is Albert Heijn-only for now.

The unimplemented scrapers throw a descriptive error rather than pretending to
work, so Settings shows an honest red dot per store. Note that AH's own
`bonuspage` API (which the popular community libraries still use) has been
retired — that path returns 500 and is not worth reviving.

## Data & privacy

Everything lives on the device via AsyncStorage — list, prices, custom items,
trip history. No accounts, no sync, nothing uploaded. The only network request
the app makes is fetching the public deals JSON.

## Artwork

The chibi mascot is in — `assets/mascot/*.png` has the four poses (wave,
basket, thinking, thumbsup). The background wash (`assets/bg-theme.png`) is
still a 1×1 transparent placeholder; see
[assets/mascot/README.md](assets/mascot/README.md) for what to drop in there.
The app detects placeholder art and shows an emoji instead, so nothing breaks
in the meantime.

## Contributing

Pull requests are always merged directly — never left as drafts and never
staged on an intermediate branch.

## Building for the Play Store

```bash
npm install -g eas-cli
eas login
eas build --platform android --profile production
```

Note: `npx expo export` fails locally on Windows because the bundled `hermesc`
can't compile the private class fields React Native itself ships. EAS builds on
Linux are unaffected.
