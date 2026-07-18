import { Component, ReactNode } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing, type } from '@/theme';

type Props = { children: ReactNode };
type State = { error: Error | null };

/**
 * Catches render errors so a single bad screen shows a readable message
 * instead of a blank app. In dev it prints the stack, which is what LogBox
 * would do if it weren't itself failing to mount on web.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error) {
    console.error('[ErrorBoundary]', error.message, error.stack);
  }

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    return (
      <View style={s.wrap}>
        <Text style={{ fontSize: 40 }}>🫠</Text>
        <Text style={[type.h2, { marginTop: spacing.md }]}>Something went wrong</Text>
        <ScrollView style={s.box}>
          <Text style={s.message}>{error.message}</Text>
          {__DEV__ && error.stack ? <Text style={s.stack}>{error.stack}</Text> : null}
        </ScrollView>
      </View>
    );
  }
}

const s = StyleSheet.create({
  wrap: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  box: {
    marginTop: spacing.lg,
    maxHeight: 400,
    alignSelf: 'stretch',
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  message: { ...type.body, color: colors.bad },
  stack: { ...type.tiny, marginTop: spacing.sm, fontFamily: 'monospace' },
});
