import { useEffect, useRef, useState } from 'react';
import { Animated, Image, ImageSourcePropType, Pressable, StyleSheet, Text, View } from 'react-native';

import { useAppStore } from '@/store/useAppStore';
import { colors, radius, shadow, spacing } from '@/theme';

export type MascotPose = 'wave' | 'basket' | 'thinking' | 'thumbsup';

const POSES: Record<MascotPose, ImageSourcePropType> = {
  wave: require('../../assets/mascot/wave.png'),
  basket: require('../../assets/mascot/basket.png'),
  thinking: require('../../assets/mascot/thinking.png'),
  thumbsup: require('../../assets/mascot/thumbsup.png'),
};

/**
 * Those files ship as 1x1 transparent placeholders (scripts/make-placeholders.mjs)
 * so Metro can resolve the require()s before the real art exists. A 1x1 would
 * render as an invisible 72px gap, so until the real images are dropped in we
 * show an emoji instead. Self-corrects the moment the art lands.
 */
let hasRealArtPromise: Promise<boolean> | null = null;

function checkHasRealArt(): Promise<boolean> {
  if (!hasRealArtPromise) {
    hasRealArtPromise = new Promise((resolve) => {
      // resolveAssetSource gives us width/height straight from the asset
      // registry on native, no network round trip needed.
      try {
        const src = Image.resolveAssetSource?.(POSES.wave);
        if (src) {
          resolve(src.width > 1 && src.height > 1);
          return;
        }
      } catch {
        resolve(true);
        return;
      }
      // react-native-web doesn't implement resolveAssetSource, but require()
      // there already resolves to a {uri, width, height} object — no need
      // for a getSize round trip if the dimensions are already on it.
      const asset = POSES.wave as unknown;
      if (asset && typeof asset === 'object' && typeof (asset as any).width === 'number') {
        const { width, height } = asset as { width: number; height: number };
        resolve(width > 1 && height > 1);
        return;
      }
      const uri = typeof asset === 'string' ? asset : (asset as any)?.uri;
      if (!uri) {
        resolve(true);
        return;
      }
      Image.getSize(
        uri,
        (width, height) => resolve(width > 1 && height > 1),
        () => resolve(true),
      );
    });
  }
  return hasRealArtPromise;
}

export function MascotTip({
  pose = 'wave',
  text,
  /** Persisted key — a tip dismissed once stays dismissed. */
  dismissKey,
}: {
  pose?: MascotPose;
  text: string;
  dismissKey?: string;
}) {
  const showMascot = useAppStore((s) => s.settings.showMascot);
  const [dismissed, setDismissed] = useState(false);
  // Default to the emoji fallback so a broken/placeholder image is never
  // shown, even briefly, while the real check resolves.
  const [hasRealArt, setHasRealArt] = useState(false);
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(anim, {
      toValue: 1,
      useNativeDriver: true,
      friction: 7,
      tension: 60,
    }).start();
  }, [anim]);

  useEffect(() => {
    let cancelled = false;
    checkHasRealArt().then((result) => {
      if (!cancelled) setHasRealArt(result);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!showMascot || dismissed) return null;

  return (
    <Animated.View
      style={[
        s.wrap,
        {
          opacity: anim,
          transform: [
            { translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) },
          ],
        },
      ]}
    >
      {hasRealArt ? (
        <Image source={POSES[pose]} style={s.avatar} resizeMode="contain" />
      ) : (
        <View style={[s.avatar, s.avatarFallback]}>
          <Text style={{ fontSize: 26 }}>🎀</Text>
        </View>
      )}
      <View style={s.bubble}>
        <Text style={s.bubbleText}>{text}</Text>
      </View>
      {dismissKey ? (
        <Pressable onPress={() => setDismissed(true)} hitSlop={10} style={s.close}>
          <Text style={s.closeText}>✕</Text>
        </Pressable>
      ) : null}
    </Animated.View>
  );
}

const s = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  avatar: { width: 72, height: 72 },
  avatarFallback: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bgSoft,
    borderRadius: radius.pill,
  },
  bubble: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderTopLeftRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    ...shadow,
  },
  bubbleText: { fontSize: 13.5, fontWeight: '600', color: colors.text, lineHeight: 19 },
  close: { position: 'absolute', top: -4, right: -4, padding: 6 },
  closeText: { color: colors.textFaint, fontSize: 12, fontWeight: '700' },
});
