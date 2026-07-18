import { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Button, Field } from '@/components/ui';
import { STORES } from '@/data/stores';
import { useAppStore } from '@/store/useAppStore';
import { colors, radius, spacing, type } from '@/theme';
import type { StoreId } from '@/types';

/**
 * Per-item, per-store price editor. Opens from any item row; writes into the
 * price book so the value is remembered for every future trip.
 */
export function PriceEditor({
  visible,
  onClose,
  catalogId,
  itemName,
}: {
  visible: boolean;
  onClose: () => void;
  catalogId: string | null;
  itemName: string;
}) {
  const enabled = useAppStore((s) => s.settings.enabledStores);
  const prices = useAppStore((s) => s.prices);
  const setPrice = useAppStore((s) => s.setPrice);
  const [draft, setDraft] = useState<Record<string, string>>({});

  if (!catalogId) return null;
  const stores = STORES.filter((s) => enabled.includes(s.id));

  const valueFor = (store: StoreId) => {
    if (draft[store] !== undefined) return draft[store];
    const known = prices[`${catalogId}:${store}`];
    return known ? known.price.toFixed(2) : '';
  };

  const save = () => {
    for (const [store, raw] of Object.entries(draft)) {
      const parsed = parseFloat(raw.replace(',', '.'));
      if (Number.isFinite(parsed) && parsed >= 0) {
        setPrice(catalogId, store as StoreId, parsed);
      }
    }
    setDraft({});
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={s.backdrop} onPress={onClose} />
      <View style={s.sheet}>
        <View style={s.grabber} />
        <Text style={type.h2}>{itemName}</Text>
        <Text style={[type.small, { marginTop: 2, marginBottom: spacing.lg }]}>
          Set what this costs at each store. Remembered for next time.
        </Text>

        <ScrollView style={{ maxHeight: 340 }} keyboardShouldPersistTaps="handled">
          {stores.map((store) => (
            <View key={store.id} style={s.row}>
              <View style={[s.dot, { backgroundColor: store.color }]} />
              <Text style={[type.body, { flex: 1 }]}>{store.name}</Text>
              <View style={s.inputWrap}>
                <Text style={s.euro}>€</Text>
                <Field
                  value={valueFor(store.id)}
                  onChangeText={(v) => setDraft((d) => ({ ...d, [store.id]: v }))}
                  placeholder="0,00"
                  keyboardType="decimal-pad"
                  style={s.input}
                />
              </View>
            </View>
          ))}
        </ScrollView>

        <View style={s.actions}>
          <Button label="Cancel" variant="ghost" onPress={onClose} style={{ flex: 1 }} />
          <Button label="Save prices" onPress={save} style={{ flex: 2 }} />
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(74,53,80,0.35)' },
  sheet: {
    backgroundColor: colors.bg,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: spacing.xl,
    paddingBottom: spacing.xxl,
  },
  grabber: {
    width: 44,
    height: 5,
    borderRadius: radius.pill,
    backgroundColor: colors.borderStrong,
    alignSelf: 'center',
    marginBottom: spacing.lg,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
  },
  dot: { width: 10, height: 10, borderRadius: 5 },
  inputWrap: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  euro: { ...type.body, color: colors.textSoft },
  input: { width: 84, textAlign: 'right', paddingVertical: 8 },
  actions: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.xl },
});
