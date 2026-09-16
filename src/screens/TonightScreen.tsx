import React, { useMemo, useState } from 'react';
import {
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import {
  SkyObject,
  SkyObjectKind,
  computeSky,
  isObservable,
  limitingMagnitudeNow,
  skyConditions,
} from '../astro';
import { ObjectRow } from '../components/ObjectRow';
import { Observer } from '../hooks/useObserver';
import { colors, radius, spacing, typography } from '../theme';

type Filter = 'all' | 'planets' | 'stars' | 'deepsky';

const FILTERS: { key: Filter; label: string; kinds: SkyObjectKind[] }[] = [
  { key: 'all', label: 'Everything', kinds: ['sun', 'moon', 'planet', 'star', 'deepsky'] },
  { key: 'planets', label: 'Planets & moon', kinds: ['moon', 'planet'] },
  { key: 'stars', label: 'Stars', kinds: ['star'] },
  { key: 'deepsky', label: 'Deep sky', kinds: ['deepsky'] },
];

const DARKNESS_LABEL: Record<string, string> = {
  day: 'Daylight',
  civil: 'Civil twilight',
  nautical: 'Nautical twilight',
  astronomical: 'Astronomical twilight',
  night: 'Fully dark',
};

type Props = {
  observer: Observer;
  now: Date;
  onSelect: (object: SkyObject) => void;
  onOpenPlace: () => void;
};

export function TonightScreen({ observer, now, onSelect, onOpenPlace }: Props) {
  const [filter, setFilter] = useState<Filter>('all');
  const [hideBelowHorizon, setHideBelowHorizon] = useState(true);

  const conditions = useMemo(
    () => skyConditions(now, observer.location),
    [now, observer.location]
  );
  const objects = useMemo(
    () => computeSky(now, observer.location),
    [now, observer.location]
  );
  const limit = limitingMagnitudeNow(conditions);

  const rows = useMemo(() => {
    const kinds = FILTERS.find((f) => f.key === filter)!.kinds;
    return objects
      .filter((object) => kinds.includes(object.kind))
      .filter((object) => !hideBelowHorizon || object.horizontal.altitude > 0)
      // Observable things first, then by how high they are — the higher an
      // object sits, the less atmosphere you are looking through.
      .sort((a, b) => {
        const aObservable = isObservable(a, limit);
        const bObservable = isObservable(b, limit);
        if (aObservable !== bObservable) return aObservable ? -1 : 1;
        return b.horizontal.altitude - a.horizontal.altitude;
      });
  }, [objects, filter, hideBelowHorizon, limit]);

  const observableCount = rows.filter((object) => isObservable(object, limit)).length;

  return (
    <FlatList
      style={styles.list}
      data={rows}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={observer.status === 'locating'}
          onRefresh={observer.refresh}
          tintColor={colors.textMuted}
        />
      }
      ListHeaderComponent={
        <View style={styles.header}>
          <Pressable onPress={onOpenPlace} style={styles.place}>
            <Text style={styles.placeName}>
              {observer.placeName ?? formatCoordinates(observer.location.latitude, observer.location.longitude)}
            </Text>
            <Text style={styles.placeHint}>
              {observer.status === 'denied'
                ? 'Location off — tap to set it manually'
                : observer.status === 'manual'
                ? 'Manual location — tap to change'
                : 'Tap to change location'}
            </Text>
          </Pressable>

          <View style={styles.conditions}>
            <Condition
              label={DARKNESS_LABEL[conditions.darkness]}
              value={`Sun ${conditions.sun.horizontal.altitude >= 0 ? '+' : '−'}${Math.abs(
                conditions.sun.horizontal.altitude
              ).toFixed(0)}°`}
              tone={conditions.fullyDark ? 'good' : conditions.darkness === 'day' ? 'warn' : 'normal'}
            />
            <Condition
              label={conditions.moon.phaseName}
              value={`${Math.round(conditions.moon.illumination * 100)}% lit${
                conditions.moon.horizontal.altitude > 0 ? '' : ' · down'
              }`}
              tone={conditions.moonInterference > 0.5 ? 'warn' : 'normal'}
            />
            <Condition
              label="Faintest visible"
              value={limit < 0 ? '—' : `mag ${limit.toFixed(1)}`}
              tone="normal"
            />
          </View>

          <View style={styles.chips}>
            {FILTERS.map((option) => (
              <Chip
                key={option.key}
                label={option.label}
                active={filter === option.key}
                onPress={() => setFilter(option.key)}
              />
            ))}
            <Chip
              label={hideBelowHorizon ? 'Up now' : 'All positions'}
              active={hideBelowHorizon}
              onPress={() => setHideBelowHorizon((value) => !value)}
            />
          </View>

          <Text style={styles.summary}>
            {observableCount > 0
              ? `${observableCount} worth looking at right now`
              : conditions.darkness === 'day'
              ? 'Nothing but the sun until dusk'
              : 'Nothing bright enough above the horizon'}
          </Text>
        </View>
      }
      renderItem={({ item }) => (
        <ObjectRow
          object={item}
          observable={isObservable(item, limit)}
          onPress={() => onSelect(item)}
        />
      )}
      ListEmptyComponent={
        <Text style={styles.empty}>Nothing in this category is above the horizon.</Text>
      }
    />
  );
}

function formatCoordinates(latitude: number, longitude: number): string {
  const ns = latitude >= 0 ? 'N' : 'S';
  const ew = longitude >= 0 ? 'E' : 'W';
  return `${Math.abs(latitude).toFixed(2)}°${ns}, ${Math.abs(longitude).toFixed(2)}°${ew}`;
}

function Condition({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: 'good' | 'warn' | 'normal';
}) {
  const color =
    tone === 'good' ? colors.good : tone === 'warn' ? colors.warn : colors.text;
  return (
    <View style={styles.condition}>
      <Text style={[styles.conditionLabel, { color }]} numberOfLines={2}>
        {label}
      </Text>
      <Text style={styles.conditionValue}>{value}</Text>
    </View>
  );
}

function Chip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.chip, active && styles.chipActive]}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
    >
      <Text style={[styles.chipLabel, active && styles.chipLabelActive]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  list: { flex: 1, backgroundColor: colors.background },
  content: { paddingBottom: spacing.xxl },
  header: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm, gap: spacing.lg },
  place: { gap: 2 },
  placeName: { ...typography.title, fontSize: 24 },
  placeHint: { ...typography.caption },
  conditions: { flexDirection: 'row', gap: spacing.sm },
  condition: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    gap: 4,
  },
  conditionLabel: { fontSize: 13, fontWeight: '600' },
  conditionValue: { ...typography.caption },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  chipActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  chipLabel: { ...typography.label },
  chipLabelActive: { color: '#06080f', fontWeight: '700' },
  summary: { ...typography.label, color: colors.textMuted },
  empty: { ...typography.label, textAlign: 'center', padding: spacing.xl },
});
