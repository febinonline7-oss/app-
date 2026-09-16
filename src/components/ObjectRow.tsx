import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { SkyObject, compassPoint } from '../astro';
import { formatAltitude, formatMagnitude } from '../format';
import { colors, radius, spacing, typography } from '../theme';

type Props = {
  object: SkyObject;
  /** False when it is up but too faint for the current sky brightness. */
  observable: boolean;
  onPress: () => void;
};

export function ObjectRow({ object, observable, onPress }: Props) {
  const { altitude, azimuth } = object.horizontal;
  const belowHorizon = altitude <= 0;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
      accessibilityRole="button"
      accessibilityLabel={`${object.name}, ${
        belowHorizon ? 'below the horizon' : `${formatAltitude(altitude)} up towards ${compassPoint(azimuth)}`
      }`}
    >
      <View style={[styles.dot, { backgroundColor: object.color, opacity: observable ? 1 : 0.35 }]} />

      <View style={styles.main}>
        <Text style={[styles.name, !observable && styles.dimmed]} numberOfLines={1}>
          {object.name}
        </Text>
        <Text style={styles.subtitle} numberOfLines={1}>
          {object.subtitle}
        </Text>
      </View>

      <View style={styles.right}>
        <Text style={[styles.altitude, !observable && styles.dimmed]}>
          {belowHorizon ? 'below' : formatAltitude(altitude)}
        </Text>
        <Text style={styles.meta}>
          {belowHorizon ? formatMagnitude(object.magnitude) : `${compassPoint(azimuth)} · ${formatMagnitude(object.magnitude)}`}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
    borderRadius: radius.md,
  },
  rowPressed: { backgroundColor: colors.surfaceRaised },
  dot: { width: 10, height: 10, borderRadius: 5 },
  main: { flex: 1 },
  name: { ...typography.body, fontWeight: '600' },
  subtitle: { ...typography.caption, marginTop: 2 },
  right: { alignItems: 'flex-end' },
  altitude: { ...typography.mono, fontWeight: '600' },
  meta: { ...typography.caption, marginTop: 2 },
  dimmed: { color: colors.textMuted },
});
