import React, { useEffect, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { GeoLocation } from '../astro';
import { Observer } from '../hooks/useObserver';
import { colors, radius, spacing, typography } from '../theme';

type Props = {
  visible: boolean;
  observer: Observer;
  onClose: () => void;
};

/** Somewhere in each hemisphere, so the app is testable without a GPS fix. */
const PRESETS: { name: string; location: GeoLocation }[] = [
  { name: 'London', location: { latitude: 51.5074, longitude: -0.1278 } },
  { name: 'New York', location: { latitude: 40.7128, longitude: -74.006 } },
  { name: 'São Paulo', location: { latitude: -23.5505, longitude: -46.6333 } },
  { name: 'Cape Town', location: { latitude: -33.9249, longitude: 18.4241 } },
  { name: 'Mumbai', location: { latitude: 19.076, longitude: 72.8777 } },
  { name: 'Tokyo', location: { latitude: 35.6762, longitude: 139.6503 } },
  { name: 'Sydney', location: { latitude: -33.8688, longitude: 151.2093 } },
  { name: 'Reykjavík', location: { latitude: 64.1466, longitude: -21.9426 } },
];

export function PlaceSheet({ visible, observer, onClose }: Props) {
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      setLatitude(observer.location.latitude.toFixed(4));
      setLongitude(observer.location.longitude.toFixed(4));
      setError(null);
    }
  }, [visible, observer.location]);

  const applyManual = () => {
    const lat = Number(latitude);
    const lon = Number(longitude);
    if (!Number.isFinite(lat) || lat < -90 || lat > 90) {
      setError('Latitude must be between −90 and 90.');
      return;
    }
    if (!Number.isFinite(lon) || lon < -180 || lon > 180) {
      setError('Longitude must be between −180 and 180.');
      return;
    }
    observer.setManualLocation({ latitude: lat, longitude: lon });
    onClose();
  };

  if (!visible) return null;

  return (
    <Modal visible animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable style={styles.backdropFill} onPress={onClose} accessibilityLabel="Close" />
        <View style={styles.sheet}>
          <View style={styles.grabber} />
          <Text style={styles.title}>Where are you?</Text>
          <Text style={styles.subtitle}>
            Positions depend on your latitude and longitude. A few kilometres of error
            makes no visible difference.
          </Text>

          <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
            <Pressable
              style={({ pressed }) => [styles.primary, pressed && styles.pressed]}
              onPress={() => {
                observer.refresh();
                onClose();
              }}
            >
              <Text style={styles.primaryLabel}>Use my location</Text>
            </Pressable>

            <Text style={styles.sectionTitle}>Enter coordinates</Text>
            <View style={styles.inputRow}>
              <Field label="Latitude" value={latitude} onChange={setLatitude} placeholder="51.5074" />
              <Field label="Longitude" value={longitude} onChange={setLongitude} placeholder="-0.1278" />
            </View>
            {error && <Text style={styles.error}>{error}</Text>}
            <Pressable
              style={({ pressed }) => [styles.secondary, pressed && styles.pressed]}
              onPress={applyManual}
            >
              <Text style={styles.secondaryLabel}>Use these coordinates</Text>
            </Pressable>

            <Text style={styles.sectionTitle}>Or pick a city</Text>
            <View style={styles.presets}>
              {PRESETS.map((preset) => (
                <Pressable
                  key={preset.name}
                  style={({ pressed }) => [styles.preset, pressed && styles.pressed]}
                  onPress={() => {
                    observer.setManualLocation(preset.location, preset.name);
                    onClose();
                  }}
                >
                  <Text style={styles.presetLabel}>{preset.name}</Text>
                </Pressable>
              ))}
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <View style={{ flex: 1, gap: spacing.xs }}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={colors.textFaint}
        keyboardType="numbers-and-punctuation"
        inputMode="text"
        autoCorrect={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.6)' },
  backdropFill: { flex: 1 },
  sheet: {
    maxHeight: '88%',
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
  title: { ...typography.title, fontSize: 22, paddingHorizontal: spacing.xl, paddingTop: spacing.lg },
  subtitle: { ...typography.label, paddingHorizontal: spacing.xl, paddingTop: spacing.xs, lineHeight: 19 },
  body: { padding: spacing.xl, gap: spacing.md },
  sectionTitle: {
    ...typography.caption,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: spacing.sm,
  },
  primary: {
    backgroundColor: colors.accent,
    borderRadius: radius.pill,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  primaryLabel: { ...typography.body, color: '#06080f', fontWeight: '700' },
  secondary: {
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  secondaryLabel: { ...typography.body, color: colors.text },
  inputRow: { flexDirection: 'row', gap: spacing.md },
  fieldLabel: { ...typography.caption },
  input: {
    backgroundColor: colors.surfaceRaised,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    color: colors.text,
    fontSize: 15,
  },
  error: { ...typography.caption, color: colors.nightSafe },
  presets: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  preset: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceRaised,
  },
  presetLabel: { ...typography.label, color: colors.text },
  pressed: { opacity: 0.7 },
});
