import { ReactNode } from 'react';
import {
  ImageBackground,
  Pressable,
  ScrollView,
  StyleProp,
  StyleSheet,
  Text,
  TextInput,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, radius, shadow, spacing, type } from '@/theme';

export function Screen({ children, scroll = true }: { children: ReactNode; scroll?: boolean }) {
  const Body = scroll ? ScrollView : View;
  return (
    <ImageBackground
      source={require('../../assets/bg-theme.png')}
      resizeMode="repeat"
      style={s.screen}
    >
      <SafeAreaView style={s.screenSafeArea} edges={['top', 'left', 'right']}>
        <Body
          style={s.body}
          contentContainerStyle={scroll ? s.bodyContent : undefined}
          keyboardShouldPersistTaps="handled"
        >
          {children}
        </Body>
      </SafeAreaView>
    </ImageBackground>
  );
}

export function Header({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <View style={s.header}>
      <Text style={type.h1}>{title}</Text>
      {subtitle ? <Text style={[type.small, { marginTop: 2 }]}>{subtitle}</Text> : null}
    </View>
  );
}

export function Card({
  children,
  style,
  onPress,
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
}) {
  const content = <View style={[s.card, style]}>{children}</View>;
  if (!onPress) return content;
  return (
    <Pressable onPress={onPress} style={({ pressed }) => (pressed ? s.pressed : undefined)}>
      {content}
    </Pressable>
  );
}

export function SectionTitle({ children, right }: { children: ReactNode; right?: ReactNode }) {
  return (
    <View style={s.sectionTitle}>
      <Text style={type.h2}>{children}</Text>
      {right}
    </View>
  );
}

export function Chip({
  label,
  active,
  onPress,
  color,
  compact,
}: {
  label: string;
  active?: boolean;
  onPress?: () => void;
  color?: string;
  compact?: boolean;
}) {
  const tint = color ?? colors.lilacDeep;
  return (
    <Pressable
      onPress={onPress}
      style={[
        s.chip,
        compact && s.chipCompact,
        active && { backgroundColor: tint, borderColor: tint },
      ]}
    >
      <Text
        numberOfLines={1}
        style={[s.chipText, compact && { fontSize: 12 }, active && { color: colors.onBrand }]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  disabled,
  style,
}: {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const bg = {
    primary: colors.pinkDeep,
    secondary: colors.bgSoft,
    ghost: 'transparent',
    danger: colors.bad,
  }[variant];
  const fg = variant === 'secondary' || variant === 'ghost' ? colors.text : colors.onBrand;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        s.button,
        { backgroundColor: bg },
        variant === 'ghost' && s.buttonGhost,
        disabled && { opacity: 0.45 },
        pressed && !disabled && s.pressed,
        style,
      ]}
    >
      <Text style={[s.buttonText, { color: fg }]}>{label}</Text>
    </Pressable>
  );
}

export function Field({
  value,
  onChangeText,
  placeholder,
  keyboardType,
  style,
  autoFocus,
}: {
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  keyboardType?: 'default' | 'numeric' | 'decimal-pad';
  style?: StyleProp<TextStyle>;
  autoFocus?: boolean;
}) {
  return (
    <TextInput
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={colors.textFaint}
      keyboardType={keyboardType}
      autoFocus={autoFocus}
      style={[s.field, style]}
    />
  );
}

export function Empty({ emoji, title, hint }: { emoji: string; title: string; hint?: string }) {
  return (
    <View style={s.empty}>
      <Text style={{ fontSize: 44 }}>{emoji}</Text>
      <Text style={[type.h3, { marginTop: spacing.sm, textAlign: 'center' }]}>{title}</Text>
      {hint ? (
        <Text style={[type.small, { marginTop: 4, textAlign: 'center' }]}>{hint}</Text>
      ) : null}
    </View>
  );
}

export function Row({
  children,
  style,
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  return <View style={[s.row, style]}>{children}</View>;
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  screenSafeArea: { flex: 1 },
  body: { flex: 1 },
  bodyContent: { padding: spacing.lg, paddingBottom: spacing.xxl * 2.5 },
  header: { marginBottom: spacing.lg },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow,
  },
  pressed: { opacity: 0.7, transform: [{ scale: 0.985 }] },
  sectionTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.xl,
    marginBottom: spacing.md,
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.borderStrong,
  },
  chipCompact: { paddingHorizontal: spacing.sm, paddingVertical: 5 },
  chipText: { fontSize: 13, fontWeight: '600', color: colors.text },
  button: {
    paddingVertical: 14,
    paddingHorizontal: spacing.xl,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonGhost: { borderWidth: 1, borderColor: colors.borderStrong },
  buttonText: { fontSize: 15, fontWeight: '700' },
  field: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    fontSize: 15,
    color: colors.text,
  },
  empty: { alignItems: 'center', paddingVertical: spacing.xxl },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
});

