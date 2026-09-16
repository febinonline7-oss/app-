import React, { useCallback, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

import { SkyObject } from './src/astro';
import { ObjectDetail } from './src/components/ObjectDetail';
import { PlaceSheet } from './src/components/PlaceSheet';
import { useNow } from './src/hooks/useNow';
import { useObserver } from './src/hooks/useObserver';
import { SkyScreen } from './src/screens/SkyScreen';
import { TonightScreen } from './src/screens/TonightScreen';
import { TrackScreen } from './src/screens/TrackScreen';
import { colors, spacing, typography } from './src/theme';

type Tab = 'tonight' | 'sky' | 'track';

const TABS: { key: Tab; label: string }[] = [
  { key: 'tonight', label: 'Tonight' },
  { key: 'sky', label: 'Sky' },
  { key: 'track', label: 'Track' },
];

export default function App() {
  return (
    <SafeAreaProvider>
      <SkyTrack />
    </SafeAreaProvider>
  );
}

function SkyTrack() {
  const [tab, setTab] = useState<Tab>('tonight');
  const [selected, setSelected] = useState<SkyObject | null>(null);
  const [targetId, setTargetId] = useState<string | null>(null);
  const [placeOpen, setPlaceOpen] = useState(false);

  const observer = useObserver();
  // The sky moves 2.5 arcminutes a minute; ten seconds is smooth enough.
  const now = useNow(10000);

  const track = useCallback((object: SkyObject) => {
    setTargetId(object.id);
    setSelected(null);
    setTab('track');
  }, []);

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right', 'bottom']}>
        <View style={styles.content}>
          {tab === 'tonight' && (
            <TonightScreen
              observer={observer}
              now={now}
              onSelect={setSelected}
              onOpenPlace={() => setPlaceOpen(true)}
            />
          )}
          {tab === 'sky' && (
            <SkyScreen
              observer={observer}
              now={now}
              selectedId={targetId}
              onSelect={setSelected}
            />
          )}
          {tab === 'track' && (
            <TrackScreen
              observer={observer}
              now={now}
              targetId={targetId}
              onPickTarget={(object) => setTargetId(object.id)}
            />
          )}
        </View>

        <View style={styles.tabBar}>
          {TABS.map((item) => (
            <Pressable
              key={item.key}
              onPress={() => setTab(item.key)}
              style={styles.tab}
              accessibilityRole="tab"
              accessibilityState={{ selected: tab === item.key }}
            >
              <Text style={[styles.tabLabel, tab === item.key && styles.tabLabelActive]}>
                {item.label}
              </Text>
              <View style={[styles.tabUnderline, tab === item.key && styles.tabUnderlineActive]} />
            </Pressable>
          ))}
        </View>
      </SafeAreaView>

      <ObjectDetail
        object={selected}
        location={observer.location}
        now={now}
        onClose={() => setSelected(null)}
        onTrack={track}
      />

      <PlaceSheet visible={placeOpen} observer={observer} onClose={() => setPlaceOpen(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  safe: { flex: 1 },
  content: { flex: 1 },
  tabBar: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
  tab: { flex: 1, alignItems: 'center', paddingTop: spacing.md, gap: spacing.sm },
  tabLabel: { ...typography.body, color: colors.textMuted, fontWeight: '600' },
  tabLabelActive: { color: colors.accent },
  tabUnderline: { height: 2, width: 28, backgroundColor: 'transparent', borderRadius: 1 },
  tabUnderlineActive: { backgroundColor: colors.accent },
});
