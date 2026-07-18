import { useState } from 'react';
import { Alert, StyleSheet, Switch, Text, View } from 'react-native';

import { MascotTip } from '@/components/Mascot';
import { Button, Card, Field, Header, Row, Screen, SectionTitle } from '@/components/ui';
import { STORES } from '@/data/stores';
import { refreshDeals, relativeTime } from '@/lib/deals';
import { useAppStore } from '@/store/useAppStore';
import { colors, radius, spacing, type } from '@/theme';
import type { StoreId } from '@/types';

export default function SettingsScreen() {
  const settings = useAppStore((s) => s.settings);
  const updateSettings = useAppStore((s) => s.updateSettings);
  const dealsFetchedAt = useAppStore((s) => s.dealsFetchedAt);
  const dealsError = useAppStore((s) => s.dealsError);
  const deals = useAppStore((s) => s.deals);
  const prices = useAppStore((s) => s.prices);
  const trips = useAppStore((s) => s.trips);
  const customItems = useAppStore((s) => s.customItems);
  const clearList = useAppStore((s) => s.clearList);
  const resetAll = useAppStore((s) => s.resetAll);

  const [refreshing, setRefreshing] = useState(false);
  const [budgetDraft, setBudgetDraft] = useState(
    settings.weeklyBudget != null ? String(settings.weeklyBudget) : '',
  );

  const toggleStore = (id: StoreId) => {
    const next = settings.enabledStores.includes(id)
      ? settings.enabledStores.filter((s) => s !== id)
      : [...settings.enabledStores, id];
    // Refuse to leave zero stores enabled — the whole app degenerates without one.
    if (next.length === 0) return;
    updateSettings({ enabledStores: next });
  };

  const onRefresh = async () => {
    setRefreshing(true);
    const result = await refreshDeals(true);
    setRefreshing(false);
    const label =
      result.source === 'network'
        ? `Updated — ${result.feed.deals.length} deals.`
        : result.source === 'cache'
          ? `Couldn't reach the feed, kept the last good copy. (${result.error})`
          : `Couldn't reach the feed, using bundled deals. (${result.error})`;
    Alert.alert('Refresh deals', label);
  };

  const confirmReset = () => {
    Alert.alert(
      'Erase everything?',
      'This deletes your list, saved prices, custom items and all trip history. It cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Erase', style: 'destructive', onPress: resetAll },
      ],
    );
  };

  return (
    <Screen>
      <Header title="Settings" />

      <MascotTip
        pose="thinking"
        text="Turn off the stores you never shop at and they'll disappear from every filter, deal feed and price editor."
        dismissKey="settings-intro"
      />

      <SectionTitle>Stores</SectionTitle>
      <Card style={{ padding: spacing.sm }}>
        {STORES.map((store, idx) => (
          <Row key={store.id} style={[s.row, idx > 0 && s.divider]}>
            <View style={[s.dot, { backgroundColor: store.color }]} />
            <Text style={[type.body, { flex: 1 }]}>{store.name}</Text>
            <Switch
              value={settings.enabledStores.includes(store.id)}
              onValueChange={() => toggleStore(store.id)}
              trackColor={{ true: colors.pink, false: colors.border }}
              thumbColor={colors.card}
            />
          </Row>
        ))}
      </Card>

      <SectionTitle>Deals</SectionTitle>
      <Card>
        <Row>
          <View style={{ flex: 1 }}>
            <Text style={type.h3}>Refresh deals</Text>
            <Text style={type.tiny}>
              Last updated {relativeTime(dealsFetchedAt)}
              {deals ? ` · ${deals.deals.length} deals` : ''}
            </Text>
          </View>
          <Button
            label={refreshing ? '…' : 'Refresh'}
            onPress={onRefresh}
            variant="secondary"
            disabled={refreshing}
          />
        </Row>

        {deals ? (
          <View style={s.storeStatus}>
            {STORES.filter((st) => settings.enabledStores.includes(st.id)).map((st) => {
              const status = deals.stores[st.id];
              const ok = status?.ok ?? false;
              return (
                <View key={st.id} style={s.statusPill}>
                  <Text style={{ fontSize: 10 }}>{ok ? '🟢' : '🔴'}</Text>
                  <Text style={type.tiny}>
                    {st.short} {ok ? `${status?.count ?? 0}` : 'failed'}
                  </Text>
                </View>
              );
            })}
          </View>
        ) : null}

        {dealsError ? (
          <Text style={[type.tiny, { color: colors.bad, marginTop: spacing.sm }]}>
            Last attempt failed: {dealsError}. Showing the most recent copy instead.
          </Text>
        ) : null}

        <Row style={[s.row, s.divider, { marginTop: spacing.md }]}>
          <View style={{ flex: 1 }}>
            <Text style={type.body}>Auto-refresh on launch</Text>
            <Text style={type.tiny}>Fetches at most once every 6 hours</Text>
          </View>
          <Switch
            value={settings.autoRefreshDeals}
            onValueChange={(v) => updateSettings({ autoRefreshDeals: v })}
            trackColor={{ true: colors.pink, false: colors.border }}
            thumbColor={colors.card}
          />
        </Row>
      </Card>

      <SectionTitle>Budget</SectionTitle>
      <Card>
        <Text style={type.body}>Weekly budget</Text>
        <Text style={[type.tiny, { marginBottom: spacing.md }]}>
          Shows a progress bar on the summary tab. Leave blank to hide it.
        </Text>
        <Row>
          <Text style={[type.body, { color: colors.textSoft }]}>€</Text>
          <Field
            value={budgetDraft}
            onChangeText={setBudgetDraft}
            placeholder="e.g. 120"
            keyboardType="decimal-pad"
            style={{ flex: 1 }}
          />
          <Button
            label="Save"
            variant="secondary"
            onPress={() => {
              const parsed = parseFloat(budgetDraft.replace(',', '.'));
              updateSettings({
                weeklyBudget: Number.isFinite(parsed) && parsed > 0 ? parsed : null,
              });
            }}
          />
        </Row>
      </Card>

      <SectionTitle>Appearance & feedback</SectionTitle>
      <Card style={{ padding: spacing.sm }}>
        <Row style={s.row}>
          <View style={{ flex: 1 }}>
            <Text style={type.body}>Show mascot tips</Text>
            <Text style={type.tiny}>The little helper and her speech bubbles</Text>
          </View>
          <Switch
            value={settings.showMascot}
            onValueChange={(v) => updateSettings({ showMascot: v })}
            trackColor={{ true: colors.pink, false: colors.border }}
            thumbColor={colors.card}
          />
        </Row>
        <Row style={[s.row, s.divider]}>
          <View style={{ flex: 1 }}>
            <Text style={type.body}>Haptics</Text>
            <Text style={type.tiny}>A small buzz when you tick something off</Text>
          </View>
          <Switch
            value={settings.hapticsEnabled}
            onValueChange={(v) => updateSettings({ hapticsEnabled: v })}
            trackColor={{ true: colors.pink, false: colors.border }}
            thumbColor={colors.card}
          />
        </Row>
      </Card>

      <SectionTitle>Your data</SectionTitle>
      <Card>
        <Text style={type.tiny}>
          {Object.keys(prices).length} saved prices · {customItems.length} custom items ·{' '}
          {trips.length} trips recorded
        </Text>
        <Text style={[type.tiny, { marginTop: 4 }]}>
          Everything is stored on this device only. Nothing is uploaded anywhere.
        </Text>
        <Button
          label="Clear current list"
          variant="ghost"
          onPress={clearList}
          style={{ marginTop: spacing.lg }}
        />
        <Button
          label="Erase all data"
          variant="danger"
          onPress={confirmReset}
          style={{ marginTop: spacing.sm }}
        />
      </Card>

      <Text style={[type.tiny, { textAlign: 'center', marginTop: spacing.xl }]}>
        Shopping List v1.0.0
      </Text>
    </Screen>
  );
}

const s = StyleSheet.create({
  row: { paddingVertical: spacing.md, paddingHorizontal: spacing.sm, gap: spacing.md },
  divider: { borderTopWidth: 1, borderTopColor: colors.border },
  dot: { width: 10, height: 10, borderRadius: 5 },
  storeStatus: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.bgSoft,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
});
