import React, { useMemo } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import {
  GeoLocation,
  SkyObject,
  compassPoint,
  formatDegrees,
  formatRa,
  riseSetFor,
} from '../astro';
import {
  formatAltitude,
  formatCountdown,
  formatLocalTimeWithDay,
  formatMagnitude,
} from '../format';
import { colors, radius, spacing, typography } from '../theme';

type Props = {
  object: SkyObject | null;
  location: GeoLocation;
  now: Date;
  onClose: () => void;
  onTrack: (object: SkyObject) => void;
};

export function ObjectDetail({ object, location, now, onClose, onTrack }: Props) {
  // Rise and set need a search over the next 24 hours, so only compute it
  // while the sheet is actually open.
  const events = useMemo(
    () => (object ? riseSetFor(object, location, now) : null),
    [object, location, now]
  );

  if (!object) return null;

  const { altitude, azimuth } = object.horizontal;
  const up = altitude > 0;

  return (
    <Modal visible animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable style={styles.backdropFill} onPress={onClose} accessibilityLabel="Close" />

        <View style={styles.sheet}>
          <View style={styles.grabber} />

          <View style={styles.header}>
            <View style={[styles.dot, { backgroundColor: object.color }]} />
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>{object.name}</Text>
              <Text style={styles.subtitle}>{object.subtitle}</Text>
            </View>
          </View>

          <ScrollView contentContainerStyle={styles.body}>
            <Text style={styles.status}>
              {up
                ? `${formatAltitude(altitude)} above the horizon, towards ${compassPoint(azimuth)}`
                : 'Below the horizon right now'}
            </Text>

            <Section title="Right now">
              <Row label="Altitude" value={formatAltitude(altitude)} />
              <Row label="Azimuth" value={`${azimuth.toFixed(0)}° (${compassPoint(azimuth)})`} />
              <Row label="Brightness" value={formatMagnitude(object.magnitude)} />
            </Section>

            {events && (
              <Section title="Tonight">
                {events.alwaysUp ? (
                  <Row label="Visibility" value="Never sets from here" />
                ) : events.neverUp ? (
                  <Row label="Visibility" value="Never rises from here" />
                ) : (
                  <>
                    <Row
                      label="Rises"
                      value={`${formatLocalTimeWithDay(events.rise, now)}  ${formatCountdown(events.rise, now)}`}
                    />
                    <Row
                      label="Sets"
                      value={`${formatLocalTimeWithDay(events.set, now)}  ${formatCountdown(events.set, now)}`}
                    />
                  </>
                )}
                <Row
                  label="Highest"
                  value={`${formatLocalTimeWithDay(events.transit, now)} at ${formatAltitude(events.transitAltitude)}`}
                />
              </Section>
            )}

            <Section title="Coordinates">
              <Row label="Right ascension" value={formatRa(object.equatorial.ra)} />
              <Row label="Declination" value={formatDegrees(object.equatorial.dec)} />
            </Section>

            {object.detail && Object.keys(object.detail).length > 0 && (
              <Section title="Details">
                {Object.entries(object.detail).map(([label, value]) => (
                  <Row key={label} label={label} value={value} />
                ))}
              </Section>
            )}
          </ScrollView>

          <View style={styles.actions}>
            <Pressable
              style={({ pressed }) => [styles.trackButton, pressed && styles.pressed]}
              onPress={() => onTrack(object)}
            >
              <Text style={styles.trackLabel}>Point me at it</Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [styles.closeButton, pressed && styles.pressed]}
              onPress={onClose}
            >
              <Text style={styles.closeLabel}>Close</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionBody}>{children}</View>
    </View>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.6)' },
  backdropFill: { flex: 1 },
  sheet: {
    maxHeight: '86%',
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    borderTopWidth: 1,
    borderColor: colors.border,
    paddingBottom: spacing.xl,
  },
  grabber: {
    width: 42,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    alignSelf: 'center',
    marginTop: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
  },
  dot: { width: 14, height: 14, borderRadius: 7 },
  title: { ...typography.title, fontSize: 22 },
  subtitle: { ...typography.label, marginTop: 2 },
  body: { paddingHorizontal: spacing.xl, paddingTop: spacing.lg, gap: spacing.lg },
  status: { ...typography.body, color: colors.accent },
  section: { gap: spacing.sm },
  sectionTitle: { ...typography.caption, textTransform: 'uppercase', letterSpacing: 1 },
  sectionBody: {
    backgroundColor: colors.surfaceRaised,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: spacing.lg,
    paddingVertical: spacing.sm,
  },
  detailLabel: { ...typography.label, flexShrink: 0 },
  detailValue: { ...typography.body, flex: 1, textAlign: 'right' },
  actions: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
  },
  trackButton: {
    flex: 1,
    backgroundColor: colors.accent,
    borderRadius: radius.pill,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  trackLabel: { ...typography.body, color: '#06080f', fontWeight: '700' },
  closeButton: {
    paddingHorizontal: spacing.xl,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center',
  },
  closeLabel: { ...typography.body, color: colors.textMuted },
  pressed: { opacity: 0.7 },
});
