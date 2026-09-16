import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import {
  SkyObject,
  compassPoint,
  computeSky,
  limitingMagnitudeNow,
  skyConditions,
} from '../astro';
import { SkyChart } from '../components/SkyChart';
import { useDeviceAim } from '../hooks/useHeading';
import { Observer } from '../hooks/useObserver';
import { colors, radius, spacing, typography } from '../theme';

type Props = {
  observer: Observer;
  now: Date;
  selectedId: string | null;
  onSelect: (object: SkyObject) => void;
};

export function SkyScreen({ observer, now, selectedId, onSelect }: Props) {
  const { width } = useWindowDimensions();
  const [followCompass, setFollowCompass] = useState(true);
  const [showConstellations, setShowConstellations] = useState(true);
  const [showFaint, setShowFaint] = useState(false);

  const aim = useDeviceAim(followCompass);

  const conditions = useMemo(() => skyConditions(now, observer.location), [now, observer.location]);
  const objects = useMemo(() => computeSky(now, observer.location), [now, observer.location]);

  // Faint mode shows everything in the catalogue; otherwise only what the
  // current sky brightness would actually let you see.
  const limit = showFaint ? 9 : Math.max(limitingMagnitudeNow(conditions), 3.5);

  const rotation = followCompass && aim.heading !== null ? aim.heading : 0;
  const size = Math.min(width - spacing.lg * 2, 420);

  const upCount = objects.filter(
    (object) => object.horizontal.altitude > 0 && object.magnitude <= limit
  ).length;

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.title}>The sky above you</Text>
      <Text style={styles.subtitle}>
        {rotation === 0
          ? 'North is at the top. Centre is straight up.'
          : `Facing ${compassPoint(rotation)} (${Math.round(rotation)}°). Centre is straight up.`}
      </Text>

      <View style={styles.chartWrap}>
        <SkyChart
          objects={objects}
          size={size}
          rotation={rotation}
          limitingMagnitude={limit}
          showConstellations={showConstellations}
          highlightId={selectedId}
          onSelectObject={onSelect}
        />
      </View>

      <View style={styles.toggles}>
        <Toggle
          label="Turn with me"
          active={followCompass}
          disabled={!aim.available && followCompass}
          hint={
            followCompass && !aim.available
              ? 'Waiting for the compass'
              : followCompass
              ? 'Chart rotates as you turn'
              : 'North stays at the top'
          }
          onPress={() => setFollowCompass((value) => !value)}
        />
        <Toggle
          label="Constellations"
          active={showConstellations}
          hint={showConstellations ? 'Stick figures drawn' : 'Stars only'}
          onPress={() => setShowConstellations((value) => !value)}
        />
        <Toggle
          label="Show faint"
          active={showFaint}
          hint={showFaint ? 'Everything in the catalogue' : `Down to mag ${limit.toFixed(1)}`}
          onPress={() => setShowFaint((value) => !value)}
        />
      </View>

      <Text style={styles.footnote}>
        {upCount} objects plotted. Tap any marker for details.
        {aim.accuracy !== null && aim.accuracy < 2 && followCompass
          ? ' Compass needs calibrating — wave the phone in a figure of eight.'
          : ''}
      </Text>
    </ScrollView>
  );
}

function Toggle({
  label,
  hint,
  active,
  disabled,
  onPress,
}: {
  label: string;
  hint: string;
  active: boolean;
  disabled?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.toggle, active && styles.toggleActive, disabled && styles.toggleDisabled]}
      accessibilityRole="switch"
      accessibilityState={{ checked: active }}
    >
      <Text style={[styles.toggleLabel, active && styles.toggleLabelActive]}>{label}</Text>
      <Text style={styles.toggleHint}>{hint}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xxl },
  title: { ...typography.title, fontSize: 24 },
  subtitle: { ...typography.label },
  chartWrap: { alignItems: 'center', paddingVertical: spacing.sm },
  toggles: { flexDirection: 'row', gap: spacing.sm },
  toggle: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: 3,
  },
  toggleActive: { borderColor: colors.accent },
  toggleDisabled: { opacity: 0.6 },
  toggleLabel: { fontSize: 13, fontWeight: '600', color: colors.textMuted },
  toggleLabelActive: { color: colors.accent },
  toggleHint: { ...typography.caption },
  footnote: { ...typography.caption, lineHeight: 16 },
});
