import { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import * as Location from 'expo-location';
import { DeviceMotion } from 'expo-sensors';

export type DeviceAim = {
  /** True-north heading the back of the phone points at, degrees. */
  heading: number | null;
  /** Altitude the back of the phone points at, degrees above the horizon. */
  pitch: number | null;
  /** Compass calibration, 0 (useless) to 3 (good). Null when unknown. */
  accuracy: number | null;
  available: boolean;
};

/**
 * Where the phone is pointing.
 *
 * Heading comes from the platform compass (which fuses magnetometer and
 * gyroscope and applies magnetic declination), and the elevation angle comes
 * from the gravity vector, which is far steadier than integrating rotation.
 */
export function useDeviceAim(enabled = true): DeviceAim {
  const [heading, setHeading] = useState<number | null>(null);
  const [pitch, setPitch] = useState<number | null>(null);
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [available, setAvailable] = useState(false);

  useEffect(() => {
    if (!enabled) return;

    let headingSubscription: Location.LocationSubscription | null = null;
    let motionSubscription: { remove: () => void } | null = null;
    let cancelled = false;

    const start = async () => {
      // The compass needs location permission to report true north rather
      // than magnetic north.
      try {
        const permission = await Location.getForegroundPermissionsAsync();
        if (!permission.granted) await Location.requestForegroundPermissionsAsync();
      } catch {
        // Fall through: magnetic heading is still better than nothing.
      }

      if (Platform.OS !== 'web') {
        try {
          headingSubscription = await Location.watchHeadingAsync((reading) => {
            if (cancelled) return;
            // trueHeading is -1 when location permission is missing.
            setHeading(reading.trueHeading >= 0 ? reading.trueHeading : reading.magHeading);
            setAccuracy(reading.accuracy);
            setAvailable(true);
          });
        } catch {
          // No compass on this device.
        }
      }

      try {
        if (await DeviceMotion.isAvailableAsync()) {
          DeviceMotion.setUpdateInterval(120);
          motionSubscription = DeviceMotion.addListener((motion) => {
            if (cancelled) return;
            const gravity = motion.accelerationIncludingGravity;
            if (!gravity) return;
            const magnitude = Math.hypot(gravity.x, gravity.y, gravity.z);
            if (magnitude < 1e-6) return;
            // The back camera looks along -z; the measured vector points up.
            const sinAltitude = -gravity.z / magnitude;
            setPitch(Math.asin(Math.max(-1, Math.min(1, sinAltitude))) * (180 / Math.PI));
            setAvailable(true);
          });
        }
      } catch {
        // No motion sensor; the screen degrades to compass only.
      }
    };

    start();

    return () => {
      cancelled = true;
      headingSubscription?.remove();
      motionSubscription?.remove();
    };
  }, [enabled]);

  return { heading, pitch, accuracy, available };
}
