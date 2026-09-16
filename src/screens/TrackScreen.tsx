import React, { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Line, Polygon, Text as SvgText } from 'react-native-svg';

import {
  SkyObject,
  compassPoint,
  computeSky,
  isObservable,
  limitingMagnitudeNow,
  norm180,
  riseSetFor,
  skyConditions,
} from '../astro';
import {
  formatAltitude,
  formatCountdown,
  formatLocalTimeWithDay,
  formatTurn,
} from '../format';
import { useDeviceAim } from '../hooks/useHeading';
import { Observer } from '../hooks/useObserver';
import { colors, radius, spacing, typography } from '../theme';

type Props = {
  observer: Observer;
  now: Date;
  targetId: string | null;
  onPickTarget: (object: SkyObject) => void;
};

/** Within this many degrees of the target counts as "on it". */
const ON_TARGET_DEGREES = 6;

export function TrackScreen({ observer, now, targetId, onPickTarget }: Props) {
  const aim = useDeviceAim(true);

  const conditions = useMemo(() => skyConditions(now, observer.location), [now, observer.location]);
  const objects = useMemo(() => computeSky(now, observer.location), [now, observer.location]);
  const limit = limitingMagnitudeNow(conditions);

  const target = useMemo(
    () => objects.find((object) => object.id === targetId) ?? null,
    [objects, targetId]
  );

  // Suggestions: the brightest things currently well placed.
  const suggestions = useMemo(
    () =>
      objects
        .filter((object) => isObservable(object, limit, 10))
        .sort((a, b) => a.magnitude - b.magnitude)
        .slice(0, 8),
    [objects, limit]
  );

  const events = useMemo(
    () => (target ? riseSetFor(target, observer.location, now) : null),
    [target, observer.location, now]
  );

  const headingDelta =
    target && aim.heading !== null
      ? norm180(target.horizontal.azimuth - aim.heading)
      : null;
  const pitchDelta =
    target && aim.pitch !== null ? target.horizontal.altitude - aim.pitch : null;

  const onTarget =
    headingDelta !== null &&
    pitchDelta !== null &&
    Math.abs(headingDelta) < ON_TARGET_DEGREES &&
    Math.abs(pitchDelta) < ON_TARGET_DEGREES;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Point me at it</Text>

      {!target ? (
        <Text style={styles.subtitle}>
          Pick something below, or tap "Point me at it" on any object.
        </Text>
      ) : (
        <>
          <View style={styles.targetCard}>
            <View style={[styles.dot, { backgroundColor: target.color }]} />
            <View style={{ flex: 1 }}>
              <Text style={styles.targetName}>{target.name}</Text>
              <Text style={styles.targetMeta}>
                {target.horizontal.altitude > 0
                  ? `${formatAltitude(target.horizontal.altitude)} up, ${compassPoint(
                      target.horizontal.azimuth
                    )} (${Math.round(target.horizontal.azimuth)}°)`
                  : 'Below the horizon'}
              </Text>
            </View>
          </View>

          {target.horizontal.altitude <= 0 ? (
            <View style={styles.notice}>
              <Text style={styles.noticeTitle}>Not up yet</Text>
              <Text style={styles.noticeBody}>
                {events?.neverUp
                  ? 'This object never rises from your latitude.'
                  : `Rises at ${formatLocalTimeWithDay(events?.rise ?? null, now)} (${formatCountdown(
                      events?.rise ?? null,
                      now
                    )}).`}
              </Text>
            </View>
          ) : !aim.available ? (
            <View style={styles.notice}>
              <Text style={styles.noticeTitle}>No compass reading</Text>
              <Text style={styles.noticeBody}>
                Sensors are unavailable here, so face {compassPoint(target.horizontal.azimuth)} (
                {Math.round(target.horizontal.azimuth)}°) and look{' '}
                {formatAltitude(target.horizontal.altitude)} above the horizon.
              </Text>
            </View>
          ) : (
            <>
              <View style={styles.compassWrap}>
                <AimIndicator
                  headingDelta={headingDelta ?? 0}
                  pitchDelta={pitchDelta ?? 0}
                  onTarget={onTarget}
                  color={target.color}
                />
              </View>

              <Text style={[styles.instruction, onTarget && styles.instructionOnTarget]}>
                {onTarget
                  ? `${target.name} is right there`
                  : headingDelta === null
                  ? 'Waiting for the compass…'
                  : `Turn ${formatTurn(headingDelta)}`}
              </Text>

              {!onTarget && pitchDelta !== null && Math.abs(pitchDelta) >= ON_TARGET_DEGREES && (
                <Text style={styles.instructionSecondary}>
                  {pitchDelta > 0
                    ? `Raise the phone ${Math.round(Math.abs(pitchDelta))}°`
                    : `Lower the phone ${Math.round(Math.abs(pitchDelta))}°`}
                </Text>
              )}

              <Text style={styles.readout}>
                Pointing {aim.heading !== null ? `${Math.round(aim.heading)}°` : '—'} at{' '}
                {aim.pitch !== null ? formatAltitude(aim.pitch) : '—'} · target{' '}
                {Math.round(target.horizontal.azimuth)}° at{' '}
                {formatAltitude(target.horizontal.altitude)}
              </Text>
            </>
          )}
        </>
      )}

      <Text style={styles.sectionTitle}>Good targets right now</Text>
      {suggestions.length === 0 ? (
        <Text style={styles.subtitle}>
          Nothing is well placed yet — wait for the sky to get darker.
        </Text>
      ) : (
        <View style={styles.suggestions}>
          {suggestions.map((object) => (
            <Pressable
              key={object.id}
              onPress={() => onPickTarget(object)}
              style={[styles.suggestion, object.id === targetId && styles.suggestionActive]}
            >
              <View style={[styles.dotSmall, { backgroundColor: object.color }]} />
              <Text style={styles.suggestionLabel}>{object.name}</Text>
              <Text style={styles.suggestionMeta}>
                {formatAltitude(object.horizontal.altitude)} {compassPoint(object.horizontal.azimuth)}
              </Text>
            </Pressable>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

/**
 * A crosshair with the target's offset drawn as a dot. Both axes are shown at
 * once so you can correct heading and elevation together rather than
 * hunting one at a time.
 */
function AimIndicator({
  headingDelta,
  pitchDelta,
  onTarget,
  color,
}: {
  headingDelta: number;
  pitchDelta: number;
  onTarget: boolean;
  color: string;
}) {
  const size = 240;
  const centre = size / 2;
  const radiusPx = size / 2 - 16;
  // 60 degrees of offset maps to the rim; beyond that the dot pins to the edge.
  const scale = radiusPx / 60;

  const rawX = headingDelta * scale;
  const rawY = -pitchDelta * scale;
  const distance = Math.hypot(rawX, rawY);
  const clamp = distance > radiusPx ? radiusPx / distance : 1;
  const x = centre + rawX * clamp;
  const y = centre + rawY * clamp;

  return (
    <Svg width={size} height={size}>
      <Circle cx={centre} cy={centre} r={radiusPx} fill="#070b16" stroke={colors.horizon} strokeWidth={1.5} />
      <Circle cx={centre} cy={centre} r={radiusPx / 2} fill="none" stroke={colors.horizon} strokeWidth={0.7} strokeDasharray="3 5" />
      <Circle
        cx={centre}
        cy={centre}
        r={16}
        fill="none"
        stroke={onTarget ? colors.good : colors.border}
        strokeWidth={2}
      />
      <Line x1={centre - 26} y1={centre} x2={centre - 8} y2={centre} stroke={colors.border} strokeWidth={1} />
      <Line x1={centre + 8} y1={centre} x2={centre + 26} y2={centre} stroke={colors.border} strokeWidth={1} />
      <Line x1={centre} y1={centre - 26} x2={centre} y2={centre - 8} stroke={colors.border} strokeWidth={1} />
      <Line x1={centre} y1={centre + 8} x2={centre} y2={centre + 26} stroke={colors.border} strokeWidth={1} />

      <SvgText x={centre} y={16} fill={colors.textFaint} fontSize={10} textAnchor="middle">up</SvgText>
      <SvgText x={size - 10} y={centre + 4} fill={colors.textFaint} fontSize={10} textAnchor="end">right</SvgText>

      {distance > radiusPx ? (
        // Off the edge: show a wedge pointing the way instead of a dot.
        <Polygon
          points={`${x},${y} ${x - 8},${y + 14} ${x + 8},${y + 14}`}
          fill={color}
          transform={`rotate(${(Math.atan2(rawY, rawX) * 180) / Math.PI + 90} ${x} ${y})`}
        />
      ) : (
        <Circle cx={x} cy={y} r={onTarget ? 9 : 7} fill={color} />
      )}
    </Svg>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xxl },
  title: { ...typography.title, fontSize: 24 },
  subtitle: { ...typography.label },
  targetCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
  },
  dot: { width: 14, height: 14, borderRadius: 7 },
  dotSmall: { width: 8, height: 8, borderRadius: 4 },
  targetName: { ...typography.heading },
  targetMeta: { ...typography.caption, marginTop: 2 },
  compassWrap: { alignItems: 'center', paddingVertical: spacing.sm },
  instruction: { ...typography.title, fontSize: 22, textAlign: 'center' },
  instructionOnTarget: { color: colors.good },
  instructionSecondary: { ...typography.body, color: colors.textMuted, textAlign: 'center' },
  readout: { ...typography.caption, textAlign: 'center' },
  notice: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.xs,
  },
  noticeTitle: { ...typography.heading, color: colors.warn },
  noticeBody: { ...typography.label, lineHeight: 19 },
  sectionTitle: {
    ...typography.caption,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: spacing.md,
  },
  suggestions: { gap: spacing.sm },
  suggestion: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  suggestionActive: { borderColor: colors.accent },
  suggestionLabel: { ...typography.body, flex: 1, fontWeight: '600' },
  suggestionMeta: { ...typography.caption },
});
