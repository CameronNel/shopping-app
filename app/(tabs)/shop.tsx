import * as Haptics from 'expo-haptics';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { MascotTip } from '@/components/Mascot';
import { PriceEditor } from '@/components/PriceEditor';
import { Button, Card, Chip, Empty, Header, Row, Screen, SectionTitle } from '@/components/ui';
import { CATEGORY_BY_ID, STORES, STORE_BY_ID } from '@/data/stores';
import { useAppStore } from '@/store/useAppStore';
import { colors, radius, spacing, type } from '@/theme';
import type { ListItem, StoreId } from '@/types';

export default function ShopScreen() {
  const items = useAppStore((s) => s.items);
  const enabledStores = useAppStore((s) => s.settings.enabledStores);
  const haptics = useAppStore((s) => s.settings.hapticsEnabled);
  const setStatus = useAppStore((s) => s.setStatus);
  const getPrice = useAppStore((s) => s.getPrice);
  const finishTrip = useAppStore((s) => s.finishTrip);

  /** null = the aggregated "everything" view. */
  const [activeStore, setActiveStore] = useState<StoreId | null>(null);
  const [editing, setEditing] = useState<{ catalogId: string; name: string } | null>(null);
  const [justFinished, setJustFinished] = useState<number | null>(null);

  const buzz = (style: Haptics.ImpactFeedbackStyle = Haptics.ImpactFeedbackStyle.Light) => {
    if (haptics) void Haptics.impactAsync(style);
  };

  /**
   * In a store view we show items assigned to that store *plus* unassigned
   * ones — you can grab an "any store" item wherever you happen to be, and
   * ticking it there resolves it everywhere.
   */
  const visible = useMemo(() => {
    const live = items.filter((i) => i.status !== 'not-needed');
    if (!activeStore) return live;
    return live.filter((i) => i.preferredStore === activeStore || i.preferredStore === null);
  }, [items, activeStore]);

  const pending = visible.filter((i) => i.status === 'pending');
  const done = visible.filter((i) => i.status !== 'pending');

  const byCategory = useMemo(() => {
    const map = new Map<string, ListItem[]>();
    for (const i of pending) {
      if (!map.has(i.category)) map.set(i.category, []);
      map.get(i.category)!.push(i);
    }
    return [...map.entries()];
  }, [pending]);

  const runningTotal = useMemo(
    () =>
      items
        .filter((i) => i.status === 'picked')
        .reduce((sum, i) => {
          const p = i.priceOverride ?? getPrice(i.catalogId, i.pickedAt ?? i.preferredStore) ?? 0;
          return sum + p * i.qty;
        }, 0),
    [items, getPrice],
  );

  const allLive = items.filter((i) => i.status !== 'not-needed');
  const pickedCount = allLive.filter((i) => i.status === 'picked').length;
  const progress = allLive.length ? pickedCount / allLive.length : 0;

  const onCheckout = () => {
    const trip = finishTrip();
    setJustFinished(trip.total);
    buzz(Haptics.ImpactFeedbackStyle.Medium);
  };

  if (allLive.length === 0 && justFinished == null) {
    return (
      <Screen>
        <Header title="Shopping" />
        <MascotTip pose="basket" text="Nothing to shop for yet! Head to the List tab and add a few things first." />
        <Empty emoji="🛒" title="No active trip" hint="Your list is empty." />
      </Screen>
    );
  }

  if (justFinished != null) {
    return (
      <Screen>
        <Header title="Trip complete" />
        <MascotTip pose="thumbsup" text="Goed gedaan! Everything's banked into your weekly summary. Anything you marked unavailable is already waiting on your next list." />
        <Card style={{ alignItems: 'center', paddingVertical: spacing.xxl }}>
          <Text style={{ fontSize: 40 }}>🎉</Text>
          <Text style={[type.small, { marginTop: spacing.md }]}>You spent</Text>
          <Text style={s.bigTotal}>€{justFinished.toFixed(2)}</Text>
        </Card>
        <Button label="Start a new list" onPress={() => setJustFinished(null)} style={{ marginTop: spacing.xl }} />
      </Screen>
    );
  }

  return (
    <Screen>
      <Header
        title="Shopping"
        subtitle={`${pickedCount} of ${allLive.length} picked up`}
      />

      <View style={s.progressTrack}>
        <View style={[s.progressFill, { width: `${Math.round(progress * 100)}%` }]} />
      </View>

      {/* ---- Store switcher ---- */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: spacing.lg, flexGrow: 0 }} contentContainerStyle={{ gap: spacing.sm }}>
        <Chip label="🧺 Everything" active={!activeStore} onPress={() => setActiveStore(null)} />
        {STORES.filter((st) => enabledStores.includes(st.id)).map((st) => {
          const count = items.filter(
            (i) => i.status === 'pending' && (i.preferredStore === st.id || i.preferredStore === null),
          ).length;
          return (
            <Chip
              key={st.id}
              label={`${st.name}${count ? ` · ${count}` : ''}`}
              color={st.color}
              active={activeStore === st.id}
              onPress={() => setActiveStore(activeStore === st.id ? null : st.id)}
            />
          );
        })}
      </ScrollView>

      {activeStore ? (
        <MascotTip
          pose="basket"
          text={`You're at ${STORE_BY_ID[activeStore].name}. Ticking anything here also clears it from every other store list and the aggregate.`}
          dismissKey={`shop-store-${activeStore}`}
        />
      ) : null}

      {/* ---- To pick up ---- */}
      <SectionTitle right={<Text style={type.tiny}>{pending.length} left</Text>}>
        Still to get
      </SectionTitle>

      {pending.length === 0 ? (
        <Empty emoji="✨" title="All picked up here" hint={activeStore ? 'Switch stores or check out.' : 'Ready to check out.'} />
      ) : (
        byCategory.map(([cat, group]) => (
          <View key={cat} style={{ marginBottom: spacing.lg }}>
            <Text style={s.groupHeading}>
              {CATEGORY_BY_ID[cat as keyof typeof CATEGORY_BY_ID]?.emoji}{' '}
              {CATEGORY_BY_ID[cat as keyof typeof CATEGORY_BY_ID]?.name}
            </Text>
            <Card style={{ padding: spacing.sm }}>
              {group.map((item, idx) => (
                <ShopRow
                  key={item.id}
                  item={item}
                  divider={idx > 0}
                  price={item.priceOverride ?? getPrice(item.catalogId, activeStore ?? item.preferredStore)}
                  onPick={() => {
                    buzz();
                    setStatus(item.id, 'picked', activeStore ?? item.preferredStore);
                  }}
                  onUnavailable={() => {
                    buzz(Haptics.ImpactFeedbackStyle.Rigid);
                    setStatus(item.id, 'unavailable');
                  }}
                  onNotNeeded={() => setStatus(item.id, 'not-needed')}
                  onPrice={() => setEditing({ catalogId: item.catalogId, name: item.name })}
                />
              ))}
            </Card>
          </View>
        ))
      )}

      {/* ---- Resolved ---- */}
      {done.length > 0 ? (
        <>
          <SectionTitle>Done</SectionTitle>
          <Card style={{ padding: spacing.sm }}>
            {done.map((item, idx) => (
              <Pressable
                key={item.id}
                onPress={() => setStatus(item.id, 'pending')}
                style={[s.doneRow, idx > 0 && s.divider]}
              >
                <Text style={{ fontSize: 15 }}>
                  {item.status === 'picked' ? '✅' : item.status === 'unavailable' ? '🚫' : '⛔'}
                </Text>
                <View style={{ flex: 1 }}>
                  <Text style={[type.body, s.struck]}>
                    {item.qty > 1 ? `${item.qty}× ` : ''}
                    {item.name}
                  </Text>
                  <Text style={type.tiny}>
                    {item.status === 'picked'
                      ? `picked up${item.pickedAt ? ` at ${STORE_BY_ID[item.pickedAt].name}` : ''}`
                      : item.status === 'unavailable'
                        ? 'not available — carries to next trip'
                        : 'no longer needed'}
                  </Text>
                </View>
                <Text style={type.tiny}>undo</Text>
              </Pressable>
            ))}
          </Card>
        </>
      ) : null}

      {/* ---- Checkout ---- */}
      <Card style={s.checkoutCard}>
        <Row>
          <View style={{ flex: 1 }}>
            <Text style={type.small}>Running total</Text>
            <Text style={type.tiny}>{pickedCount} items in the basket</Text>
          </View>
          <Text style={s.bigTotal}>€{runningTotal.toFixed(2)}</Text>
        </Row>
        <Button
          label="Check out & finish trip"
          onPress={onCheckout}
          disabled={pickedCount === 0}
          style={{ marginTop: spacing.lg }}
        />
        <Text style={[type.tiny, { textAlign: 'center', marginTop: spacing.sm }]}>
          Tap any price to correct it before checking out.
        </Text>
      </Card>

      <PriceEditor
        visible={!!editing}
        onClose={() => setEditing(null)}
        catalogId={editing?.catalogId ?? null}
        itemName={editing?.name ?? ''}
      />
    </Screen>
  );
}

function ShopRow({
  item,
  divider,
  price,
  onPick,
  onUnavailable,
  onNotNeeded,
  onPrice,
}: {
  item: ListItem;
  divider: boolean;
  price: number | null;
  onPick: () => void;
  onUnavailable: () => void;
  onNotNeeded: () => void;
  onPrice: () => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <View style={[divider && s.divider]}>
      <View style={s.shopRow}>
        <Pressable onPress={onPick} hitSlop={8} style={s.checkbox}>
          <Text style={{ fontSize: 13, color: colors.textFaint }}>○</Text>
        </Pressable>

        <Pressable style={{ flex: 1 }} onPress={() => setExpanded((e) => !e)}>
          <Row>
            <Text style={type.body}>
              {item.qty > 1 ? `${item.qty}× ` : ''}
              {item.name}
            </Text>
            {item.carriedOver ? <Text style={s.carriedBadge}>again</Text> : null}
          </Row>
          <Pressable onPress={onPrice} hitSlop={6}>
            <Text style={[type.tiny, { color: price != null ? colors.textSoft : colors.pinkDeep, marginTop: 2 }]}>
              {price != null ? `€${(price * item.qty).toFixed(2)}` : 'tap to set price'}
            </Text>
          </Pressable>
        </Pressable>

        <Pressable onPress={() => setExpanded((e) => !e)} hitSlop={8}>
          <Text style={{ color: colors.textFaint, fontSize: 16 }}>{expanded ? '⌃' : '⌄'}</Text>
        </Pressable>
      </View>

      {expanded ? (
        <Row style={s.actions}>
          <Pressable onPress={onUnavailable} style={[s.actionBtn, { backgroundColor: colors.warnSoft }]}>
            <Text style={[type.tiny, { color: colors.warn }]}>🚫 Not available</Text>
          </Pressable>
          <Pressable onPress={onNotNeeded} style={[s.actionBtn, { backgroundColor: colors.badSoft }]}>
            <Text style={[type.tiny, { color: colors.bad }]}>⛔ Don't need it</Text>
          </Pressable>
        </Row>
      ) : null}
    </View>
  );
}

const s = StyleSheet.create({
  progressTrack: {
    height: 8,
    borderRadius: radius.pill,
    backgroundColor: colors.bgSoft,
    overflow: 'hidden',
  },
  progressFill: { height: '100%', backgroundColor: colors.pinkDeep, borderRadius: radius.pill },
  groupHeading: { ...type.h3, marginBottom: spacing.sm, color: colors.textSoft },
  shopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
  },
  checkbox: {
    width: 26,
    height: 26,
    borderRadius: radius.pill,
    borderWidth: 2,
    borderColor: colors.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  divider: { borderTopWidth: 1, borderTopColor: colors.border },
  actions: { paddingHorizontal: spacing.sm, paddingBottom: spacing.md, gap: spacing.sm },
  actionBtn: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    alignItems: 'center',
  },
  doneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
  },
  struck: { textDecorationLine: 'line-through', color: colors.textFaint },
  carriedBadge: {
    ...type.tiny,
    color: colors.warn,
    backgroundColor: colors.warnSoft,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.pill,
    overflow: 'hidden',
  },
  checkoutCard: { marginTop: spacing.xl, backgroundColor: colors.cardMuted },
  bigTotal: { fontSize: 28, fontWeight: '800', color: colors.pinkDeep },
});
