import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { MascotTip } from '@/components/Mascot';
import { PriceEditor } from '@/components/PriceEditor';
import {
  Button,
  Card,
  Chip,
  Empty,
  Field,
  Header,
  Row,
  Screen,
  SectionTitle,
} from '@/components/ui';
import { CATALOG } from '@/data/catalog';
import { CATEGORIES, CATEGORY_BY_ID, STORES, STORE_BY_ID } from '@/data/stores';
import { dealIsActive } from '@/lib/deals';
import { useAppStore } from '@/store/useAppStore';
import { colors, radius, spacing, type } from '@/theme';
import type { CategoryId, ListItem, StoreId } from '@/types';

export default function ListScreen() {
  const items = useAppStore((s) => s.items);
  const customItems = useAppStore((s) => s.customItems);
  const frequency = useAppStore((s) => s.frequency);
  const deals = useAppStore((s) => s.deals);
  const enabledStores = useAppStore((s) => s.settings.enabledStores);
  const addItem = useAppStore((s) => s.addItem);
  const addCustomItem = useAppStore((s) => s.addCustomItem);
  const removeItem = useAppStore((s) => s.removeItem);
  const setQty = useAppStore((s) => s.setQty);
  const setPreferredStore = useAppStore((s) => s.setPreferredStore);
  const getPrice = useAppStore((s) => s.getPrice);

  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<CategoryId | null>(null);
  const [storeFilter, setStoreFilter] = useState<StoreId | null>(null);
  const [groupByStore, setGroupByStore] = useState(false);
  const [editing, setEditing] = useState<{ catalogId: string; name: string } | null>(null);

  const searchable = useMemo(() => [...CATALOG, ...customItems], [customItems]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q && !category) return [];
    return searchable
      .filter((i) => (category ? i.category === category : true))
      .filter((i) => (q ? i.name.toLowerCase().includes(q) : true))
      .slice(0, 40);
  }, [query, category, searchable]);

  const activeItems = items.filter((i) => i.status !== 'not-needed');

  const total = useMemo(
    () =>
      activeItems.reduce((sum, i) => {
        const p = i.priceOverride ?? getPrice(i.catalogId, i.preferredStore) ?? 0;
        return sum + p * i.qty;
      }, 0),
    [activeItems, getPrice],
  );

  const pricedCount = activeItems.filter(
    (i) => (i.priceOverride ?? getPrice(i.catalogId, i.preferredStore)) != null,
  ).length;

  const frequent = useMemo(
    () =>
      Object.entries(frequency)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 12)
        .map(([id, count]) => ({ item: searchable.find((i) => i.id === id), count }))
        .filter((f): f is { item: (typeof searchable)[number]; count: number } => !!f.item)
        .filter((f) => !activeItems.some((i) => i.catalogId === f.item.id)),
    [frequency, searchable, activeItems],
  );

  const activeDeals = useMemo(() => {
    if (!deals) return [];
    return deals.deals
      .filter((d) => enabledStores.includes(d.store))
      .filter((d) => (storeFilter ? d.store === storeFilter : true))
      .filter((d) => dealIsActive(d));
  }, [deals, enabledStores, storeFilter]);

  const visibleItems = storeFilter
    ? activeItems.filter((i) => i.preferredStore === storeFilter)
    : activeItems;

  const grouped = useMemo(() => {
    const key = (i: ListItem) => i.preferredStore ?? 'any';
    const map = new Map<string, ListItem[]>();
    for (const i of visibleItems) {
      const k = groupByStore ? key(i) : i.category;
      if (!map.has(k)) map.set(k, []);
      map.get(k)!.push(i);
    }
    return [...map.entries()];
  }, [visibleItems, groupByStore]);

  const groupLabel = (key: string) => {
    if (!groupByStore) return `${CATEGORY_BY_ID[key as CategoryId]?.emoji ?? '📦'}  ${CATEGORY_BY_ID[key as CategoryId]?.name ?? key}`;
    if (key === 'any') return '🛍️  Any store';
    const st = STORE_BY_ID[key as StoreId];
    return `${st?.name ?? key}`;
  };

  const addCustom = () => {
    const name = query.trim();
    if (!name) return;
    const id = addCustomItem(name, category ?? 'overig', 'pcs');
    addItem(id, { store: storeFilter });
    setQuery('');
  };

  return (
    <Screen>
      <Header title="Build your list" subtitle={`${activeItems.length} items · ${STORES.filter((s) => enabledStores.includes(s.id)).length} stores`} />

      {activeItems.length === 0 ? (
        <MascotTip
          pose="wave"
          text="Hi! Search the item bank below, or tap a category to browse. Anything not in there, just type it and hit Add custom."
          dismissKey="list-empty"
        />
      ) : null}

      {/* ---- Search + filters ---- */}
      <Field
        value={query}
        onChangeText={setQuery}
        placeholder="Search 350+ items… (milk, bread, chicken)"
      />

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.filterRow}>
        <Chip label="All" active={!category} onPress={() => setCategory(null)} compact />
        {CATEGORIES.map((c) => (
          <Chip
            key={c.id}
            label={`${c.emoji} ${c.name}`}
            active={category === c.id}
            onPress={() => setCategory(category === c.id ? null : c.id)}
            compact
          />
        ))}
      </ScrollView>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.filterRow}>
        <Chip label="All stores" active={!storeFilter} onPress={() => setStoreFilter(null)} compact />
        {STORES.filter((st) => enabledStores.includes(st.id)).map((st) => (
          <Chip
            key={st.id}
            label={st.name}
            color={st.color}
            active={storeFilter === st.id}
            onPress={() => setStoreFilter(storeFilter === st.id ? null : st.id)}
            compact
          />
        ))}
      </ScrollView>

      {/* ---- Search results ---- */}
      {results.length > 0 ? (
        <Card style={{ marginTop: spacing.md, padding: spacing.sm }}>
          {results.map((r) => {
            const onList = activeItems.some((i) => i.catalogId === r.id);
            return (
              <Pressable
                key={r.id}
                onPress={() => addItem(r.id, { store: storeFilter })}
                style={s.resultRow}
              >
                <Text style={{ fontSize: 18 }}>{r.emoji ?? '📦'}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={type.body}>{r.name}</Text>
                  <Text style={type.tiny}>
                    {CATEGORY_BY_ID[r.category]?.name} · per {r.unit}
                  </Text>
                </View>
                <Text style={[s.addGlyph, onList && { color: colors.good }]}>
                  {onList ? '✓' : '＋'}
                </Text>
              </Pressable>
            );
          })}
        </Card>
      ) : null}

      {query.trim() && results.length === 0 ? (
        <Card style={{ marginTop: spacing.md }}>
          <Text style={type.body}>No match for “{query.trim()}”.</Text>
          <Button
            label={`Add “${query.trim()}” as a custom item`}
            onPress={addCustom}
            style={{ marginTop: spacing.md }}
          />
        </Card>
      ) : null}

      {/* ---- Deals ---- */}
      {activeDeals.length > 0 ? (
        <>
          <SectionTitle
            right={<Text style={type.tiny}>{activeDeals.length} live</Text>}
          >
            This week's deals
          </SectionTitle>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -spacing.lg }} contentContainerStyle={{ paddingHorizontal: spacing.lg, gap: spacing.md }}>
            {activeDeals.slice(0, 20).map((d) => {
              const st = STORE_BY_ID[d.store];
              return (
                <Card key={d.id} style={s.dealCard}>
                  <View style={[s.storeTag, { backgroundColor: st.color }]}>
                    <Text style={s.storeTagText}>{st.short}</Text>
                  </View>
                  <Text style={[type.h3, { marginTop: spacing.sm }]} numberOfLines={2}>
                    {d.title}
                  </Text>
                  <Text style={[type.small, { color: colors.pinkDeep, fontWeight: '700' }]}>
                    {d.offer}
                  </Text>
                  {d.price != null ? (
                    <Row style={{ marginTop: 4 }}>
                      <Text style={type.h3}>€{d.price.toFixed(2)}</Text>
                      {d.originalPrice != null && d.originalPrice > d.price ? (
                        <Text style={s.strike}>€{d.originalPrice.toFixed(2)}</Text>
                      ) : null}
                    </Row>
                  ) : null}
                </Card>
              );
            })}
          </ScrollView>
        </>
      ) : null}

      {/* ---- Frequently bought ---- */}
      {frequent.length > 0 ? (
        <>
          <SectionTitle>Frequently bought</SectionTitle>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm }}>
            {frequent.map((f) => (
              <Chip
                key={f.item.id}
                label={`${f.item.emoji ?? '📦'} ${f.item.name}`}
                onPress={() => addItem(f.item.id, { store: storeFilter })}
              />
            ))}
          </ScrollView>
        </>
      ) : null}

      {/* ---- The list ---- */}
      <SectionTitle
        right={
          <Pressable onPress={() => setGroupByStore((g) => !g)}>
            <Text style={s.toggle}>{groupByStore ? 'By store ⇄' : 'By aisle ⇄'}</Text>
          </Pressable>
        }
      >
        Your list
      </SectionTitle>

      {visibleItems.length === 0 ? (
        <Empty
          emoji="🧺"
          title="Nothing on the list yet"
          hint={storeFilter ? 'Nothing assigned to this store.' : 'Search above to start adding.'}
        />
      ) : (
        grouped.map(([key, groupItems]) => (
          <View key={key} style={{ marginBottom: spacing.lg }}>
            <Text style={s.groupHeading}>{groupLabel(key)}</Text>
            <Card style={{ padding: spacing.sm }}>
              {groupItems.map((item, idx) => {
                const price = item.priceOverride ?? getPrice(item.catalogId, item.preferredStore);
                return (
                  <View key={item.id} style={[s.itemRow, idx > 0 && s.itemDivider]}>
                    <View style={{ flex: 1 }}>
                      <Row>
                        <Text style={type.body}>{item.name}</Text>
                        {item.carriedOver ? <Text style={s.carriedBadge}>carried over</Text> : null}
                      </Row>
                      <Row style={{ marginTop: 4, gap: spacing.xs }}>
                        <Pressable onPress={() => setEditing({ catalogId: item.catalogId, name: item.name })}>
                          <Text style={[type.tiny, { color: price != null ? colors.textSoft : colors.pinkDeep }]}>
                            {price != null ? `€${price.toFixed(2)} / ${item.unit}` : 'set price'}
                          </Text>
                        </Pressable>
                        <Text style={type.tiny}>·</Text>
                        <Pressable
                          onPress={() => {
                            const list = [null, ...STORES.filter((st) => enabledStores.includes(st.id)).map((st) => st.id)];
                            const next = list[(list.indexOf(item.preferredStore) + 1) % list.length];
                            setPreferredStore(item.id, next as StoreId | null);
                          }}
                        >
                          <Text style={[type.tiny, { color: item.preferredStore ? STORE_BY_ID[item.preferredStore].color : colors.textFaint }]}>
                            {item.preferredStore ? STORE_BY_ID[item.preferredStore].name : 'any store'}
                          </Text>
                        </Pressable>
                      </Row>
                    </View>

                    <Row>
                      <Pressable onPress={() => setQty(item.id, item.qty - 1)} hitSlop={8} style={s.stepper}>
                        <Text style={s.stepperText}>−</Text>
                      </Pressable>
                      <Text style={[type.body, { minWidth: 20, textAlign: 'center' }]}>{item.qty}</Text>
                      <Pressable onPress={() => setQty(item.id, item.qty + 1)} hitSlop={8} style={s.stepper}>
                        <Text style={s.stepperText}>＋</Text>
                      </Pressable>
                      <Pressable onPress={() => removeItem(item.id)} hitSlop={8} style={{ marginLeft: 4 }}>
                        <Text style={{ color: colors.textFaint, fontSize: 15 }}>✕</Text>
                      </Pressable>
                    </Row>
                  </View>
                );
              })}
            </Card>
          </View>
        ))
      )}

      {/* ---- Total ---- */}
      {activeItems.length > 0 ? (
        <Card style={s.totalCard}>
          <View style={{ flex: 1 }}>
            <Text style={type.small}>Estimated total</Text>
            <Text style={type.tiny}>
              {pricedCount} of {activeItems.length} items priced
            </Text>
          </View>
          <Text style={s.totalValue}>€{total.toFixed(2)}</Text>
        </Card>
      ) : null}

      <PriceEditor
        visible={!!editing}
        onClose={() => setEditing(null)}
        catalogId={editing?.catalogId ?? null}
        itemName={editing?.name ?? ''}
      />
    </Screen>
  );
}

const s = StyleSheet.create({
  filterRow: { marginTop: spacing.md, flexGrow: 0 },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
  },
  addGlyph: { fontSize: 19, color: colors.pinkDeep, fontWeight: '700' },
  dealCard: { width: 190, padding: spacing.md },
  storeTag: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.pill,
  },
  storeTagText: { color: '#fff', fontSize: 11, fontWeight: '800' },
  strike: {
    ...type.small,
    textDecorationLine: 'line-through',
    color: colors.textFaint,
  },
  toggle: { ...type.small, color: colors.lilacDeep, fontWeight: '700' },
  groupHeading: { ...type.h3, marginBottom: spacing.sm, color: colors.textSoft },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
  },
  itemDivider: { borderTopWidth: 1, borderTopColor: colors.border },
  stepper: {
    width: 28,
    height: 28,
    borderRadius: radius.pill,
    backgroundColor: colors.bgSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperText: { fontSize: 15, fontWeight: '800', color: colors.text },
  carriedBadge: {
    ...type.tiny,
    color: colors.warn,
    backgroundColor: colors.warnSoft,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.pill,
    overflow: 'hidden',
  },
  totalCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.md,
    backgroundColor: colors.cardMuted,
  },
  totalValue: { fontSize: 26, fontWeight: '800', color: colors.pinkDeep },
});
