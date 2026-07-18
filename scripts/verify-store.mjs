/**
 * Headless exercise of the app's core rules. Runs the real Zustand store
 * against a stubbed AsyncStorage so the logic can be checked without a device:
 * cross-store tick-off, the price book, carry-over of unavailable items, and
 * trip accounting.
 *
 * Run with: node scripts/verify-store.mjs
 */
import assert from 'node:assert/strict';
import { register } from 'node:module';
import { pathToFileURL } from 'node:url';

register('./verify-loader.mjs', import.meta.url);

const { useAppStore } = await import('../src/store/useAppStore.ts');
const { CATALOG } = await import('../src/data/catalog.ts');

const store = useAppStore.getState();
const melk = CATALOG.find((i) => i.name === 'Halfvolle melk').id;
const brood = CATALOG.find((i) => i.name === 'Bruin brood').id;
const kaas = CATALOG.find((i) => i.name === 'Belegen kaas').id;

let passed = 0;
function check(name, fn) {
  fn();
  passed += 1;
  console.log(`  ✓ ${name}`);
}

console.log('\nCore list behaviour');

check('adding the same item twice bumps quantity instead of duplicating', () => {
  store.addItem(melk);
  store.addItem(melk);
  const items = useAppStore.getState().items;
  assert.equal(items.length, 1);
  assert.equal(items[0].qty, 2);
});

check('items can be assigned to a store', () => {
  const id = useAppStore.getState().items[0].id;
  store.setPreferredStore(id, 'ah');
  assert.equal(useAppStore.getState().items[0].preferredStore, 'ah');
});

console.log('\nCross-store tick-off');

check('ticking an item at one store resolves it everywhere', () => {
  store.addItem(brood, { store: 'jumbo' });
  const bread = useAppStore.getState().items.find((i) => i.catalogId === brood);

  // Picked up at Dirk even though it was earmarked for Jumbo.
  store.setStatus(bread.id, 'picked', 'dirk');

  const after = useAppStore.getState().items.find((i) => i.id === bread.id);
  assert.equal(after.status, 'picked');
  assert.equal(after.pickedAt, 'dirk');

  // There is exactly one record of this item — no per-store duplicate can
  // remain un-ticked in another view.
  const copies = useAppStore.getState().items.filter((i) => i.catalogId === brood);
  assert.equal(copies.length, 1);
});

check('un-ticking returns an item to pending and clears where it was picked', () => {
  const bread = useAppStore.getState().items.find((i) => i.catalogId === brood);
  store.togglePicked(bread.id);
  const after = useAppStore.getState().items.find((i) => i.id === bread.id);
  assert.equal(after.status, 'pending');
  assert.equal(after.pickedAt, undefined);
});

console.log('\nPrice book');

check('a price set for one store is remembered', () => {
  store.setPrice(melk, 'ah', 1.29);
  assert.equal(useAppStore.getState().getPrice(melk, 'ah'), 1.29);
});

check('an unpriced store falls back to the average of known prices', () => {
  store.setPrice(melk, 'jumbo', 1.39);
  const fallback = useAppStore.getState().getPrice(melk, 'dirk');
  assert.ok(Math.abs(fallback - 1.34) < 1e-9, `expected 1.34, got ${fallback}`);
});

check('an item with no price anywhere returns null rather than 0', () => {
  assert.equal(useAppStore.getState().getPrice(kaas, 'ah'), null);
});

console.log('\nCheckout & carry-over');

check('unavailable items carry over; picked items do not', () => {
  const s = useAppStore.getState();
  const milk = s.items.find((i) => i.catalogId === melk);
  const bread = s.items.find((i) => i.catalogId === brood);

  s.setStatus(milk.id, 'picked', 'ah');
  s.setStatus(bread.id, 'unavailable');

  const trip = useAppStore.getState().finishTrip();

  // 2 litres of milk at the AH price.
  assert.ok(Math.abs(trip.total - 2.58) < 1e-9, `expected 2.58, got ${trip.total}`);
  assert.ok(Math.abs(trip.storeTotals.ah - 2.58) < 1e-9);

  const remaining = useAppStore.getState().items;
  assert.equal(remaining.length, 1, 'only the unavailable item should survive');
  assert.equal(remaining[0].catalogId, brood);
  assert.equal(remaining[0].status, 'pending');
  assert.equal(remaining[0].carriedOver, true);
});

check('finishing a trip records frequency for picked items only', () => {
  const freq = useAppStore.getState().frequency;
  assert.equal(freq[melk], 1);
  assert.equal(freq[brood], undefined);
});

check('the trip is banked into history', () => {
  const trips = useAppStore.getState().trips;
  assert.equal(trips.length, 1);
  assert.equal(trips[0].items.length, 1);
});

console.log(`\n${passed} checks passed.\n`);
