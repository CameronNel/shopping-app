import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { MascotTip } from '@/components/Mascot';
import { Card, Empty, Header, Row, Screen, SectionTitle } from '@/components/ui';
import { STORE_BY_ID } from '@/data/stores';
import { useAppStore } from '@/store/useAppStore';
import { colors, radius, spacing, type } from '@/theme';
import type { StoreId } from '@/types';

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

export default function SummaryScreen() {
  const trips = useAppStore((s) => s.trips);
  const budget = useAppStore((s) => s.settings.weeklyBudget);

  const thisWeek = useMemo(
    () => trips.filter((t) => Date.now() - t.finishedAt < WEEK_MS),
    [trips],
  );
  const lastWeek = useMemo(
    () =>
      trips.filter(
        (t) =>
          Date.now() - t.finishedAt >= WEEK_MS && Date.now() - t.finishedAt < 2 * WEEK_MS,
      ),
    [trips],
  );

  const spent = thisWeek.reduce((sum, t) => sum + t.total, 0);
  const lastWeekSpent = lastWeek.reduce((sum, t) => sum + t.total, 0);
  const itemCount = thisWeek.reduce((sum, t) => sum + t.items.length, 0);

  const delta = lastWeekSpent > 0 ? ((spent - lastWeekSpent) / lastWeekSpent) * 100 : null;

  const byStore = useMemo(() => {
    const totals: Partial<Record<StoreId, number>> = {};
    for (const t of thisWeek) {
      for (const [store, amount] of Object.entries(t.storeTotals)) {
        totals[store as StoreId] = (totals[store as StoreId] ?? 0) + (amount ?? 0);
      }
    }
    return Object.entries(totals)
      .map(([id, amount]) => ({ store: STORE_BY_ID[id as StoreId], amount: amount ?? 0 }))
      .filter((r) => r.store)
      .sort((a, b) => b.amount - a.amount);
  }, [thisWeek]);

  const maxStore = byStore[0]?.amount ?? 0;

  const topItems = useMemo(() => {
    const counts = new Map<string, { name: string; qty: number; spend: number }>();
    for (const t of thisWeek) {
      for (const i of t.items) {
        const prev = counts.get(i.catalogId) ?? { name: i.name, qty: 0, spend: 0 };
        counts.set(i.catalogId, {
          name: i.name,
          qty: prev.qty + i.qty,
          spend: prev.spend + i.price,
        });
      }
    }
    return [...counts.values()].sort((a, b) => b.spend - a.spend).slice(0, 8);
  }, [thisWeek]);

  if (trips.length === 0) {
    return (
      <Screen>
        <Header title="Weekly summary" />
        <MascotTip
          pose="thinking"
          text="Nothing to summarise yet — finish a shopping trip and I'll start tracking what you spend, where, and on what."
        />
        <Empty emoji="📊" title="No trips yet" hint="Check out from the Shop tab to see stats here." />
      </Screen>
    );
  }

  return (
    <Screen>
      <Header title="Weekly summary" subtitle={`${thisWeek.length} trip${thisWeek.length === 1 ? '' : 's'} in the last 7 days`} />

      <Card style={s.hero}>
        <Text style={type.small}>Spent this week</Text>
        <Text style={s.heroValue}>€{spent.toFixed(2)}</Text>
        {delta != null ? (
          <Text style={[type.small, { color: delta > 0 ? colors.bad : colors.good, fontWeight: '700' }]}>
            {delta > 0 ? '▲' : '▼'} {Math.abs(delta).toFixed(0)}% vs last week
          </Text>
        ) : null}
        {budget != null ? (
          <>
            <View style={[s.progressTrack, { marginTop: spacing.lg }]}>
              <View
                style={[
                  s.progressFill,
                  {
                    width: `${Math.min(100, Math.round((spent / budget) * 100))}%`,
                    backgroundColor: spent > budget ? colors.bad : colors.good,
                  },
                ]}
              />
            </View>
            <Text style={[type.tiny, { marginTop: 6 }]}>
              €{spent.toFixed(2)} of €{budget.toFixed(2)} budget
            </Text>
          </>
        ) : null}
      </Card>

      <Row style={{ marginTop: spacing.md, gap: spacing.md }}>
        <Card style={s.stat}>
          <Text style={s.statValue}>{itemCount}</Text>
          <Text style={type.tiny}>items bought</Text>
        </Card>
        <Card style={s.stat}>
          <Text style={s.statValue}>
            €{thisWeek.length ? (spent / thisWeek.length).toFixed(2) : '0.00'}
          </Text>
          <Text style={type.tiny}>per trip</Text>
        </Card>
      </Row>

      {byStore.length > 0 ? (
        <>
          <SectionTitle>Where it went</SectionTitle>
          <Card>
            {byStore.map((r, idx) => (
              <View key={r.store.id} style={{ marginTop: idx ? spacing.md : 0 }}>
                <Row>
                  <Text style={[type.body, { flex: 1 }]}>{r.store.name}</Text>
                  <Text style={[type.body, { fontWeight: '700' }]}>€{r.amount.toFixed(2)}</Text>
                </Row>
                <View style={[s.progressTrack, { marginTop: 6, height: 6 }]}>
                  <View
                    style={[
                      s.progressFill,
                      {
                        width: `${maxStore ? Math.round((r.amount / maxStore) * 100) : 0}%`,
                        backgroundColor: r.store.color,
                      },
                    ]}
                  />
                </View>
              </View>
            ))}
          </Card>
        </>
      ) : null}

      {topItems.length > 0 ? (
        <>
          <SectionTitle>Biggest line items</SectionTitle>
          <Card style={{ padding: spacing.sm }}>
            {topItems.map((i, idx) => (
              <Row key={i.name} style={[s.itemRow, idx > 0 && s.divider]}>
                <View style={{ flex: 1 }}>
                  <Text style={type.body}>{i.name}</Text>
                  <Text style={type.tiny}>{i.qty}× this week</Text>
                </View>
                <Text style={[type.body, { fontWeight: '700' }]}>€{i.spend.toFixed(2)}</Text>
              </Row>
            ))}
          </Card>
        </>
      ) : null}

      <SectionTitle>Recent trips</SectionTitle>
      <Card style={{ padding: spacing.sm }}>
        {trips.slice(0, 10).map((t, idx) => (
          <Row key={t.id} style={[s.itemRow, idx > 0 && s.divider]}>
            <View style={{ flex: 1 }}>
              <Text style={type.body}>
                {new Date(t.finishedAt).toLocaleDateString('en-GB', {
                  weekday: 'short',
                  day: 'numeric',
                  month: 'short',
                })}
              </Text>
              <Text style={type.tiny}>{t.items.length} items</Text>
            </View>
            <Text style={[type.body, { fontWeight: '700' }]}>€{t.total.toFixed(2)}</Text>
          </Row>
        ))}
      </Card>
    </Screen>
  );
}

const s = StyleSheet.create({
  hero: { alignItems: 'center', paddingVertical: spacing.xl },
  heroValue: { fontSize: 40, fontWeight: '800', color: colors.pinkDeep, marginVertical: 4 },
  stat: { flex: 1, alignItems: 'center', paddingVertical: spacing.lg },
  statValue: { fontSize: 22, fontWeight: '800', color: colors.text, marginBottom: 2 },
  progressTrack: {
    height: 10,
    width: '100%',
    borderRadius: radius.pill,
    backgroundColor: colors.bgSoft,
    overflow: 'hidden',
  },
  progressFill: { height: '100%', borderRadius: radius.pill },
  itemRow: { paddingVertical: spacing.md, paddingHorizontal: spacing.sm },
  divider: { borderTopWidth: 1, borderTopColor: colors.border },
});
