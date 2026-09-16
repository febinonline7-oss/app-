import { useCallback, useEffect, useState } from 'react';
import * as Location from 'expo-location';

import { GeoLocation } from '../astro';

export type ObserverStatus =
  | 'locating'
  | 'ready'
  | 'denied'
  | 'unavailable'
  | 'manual';

export type Observer = {
  location: GeoLocation;
  status: ObserverStatus;
  /** Human-readable place name when reverse geocoding succeeds. */
  placeName: string | null;
  refresh: () => void;
  setManualLocation: (location: GeoLocation, name?: string) => void;
};

/** Greenwich: a defensible fallback when there is no fix yet. */
const DEFAULT_LOCATION: GeoLocation = {
  latitude: 51.4779,
  longitude: -0.0015,
  elevation: 0,
};

export function useObserver(): Observer {
  const [location, setLocation] = useState<GeoLocation>(DEFAULT_LOCATION);
  const [status, setStatus] = useState<ObserverStatus>('locating');
  const [placeName, setPlaceName] = useState<string | null>(null);

  const locate = useCallback(async () => {
    setStatus('locating');
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (!permission.granted) {
        setStatus('denied');
        return;
      }

      // A coarse fix is plenty: a kilometre of error moves an object by well
      // under an arcminute.
      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.LocationAccuracy.Balanced,
      });

      setLocation({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        elevation: position.coords.altitude ?? 0,
      });
      setStatus('ready');

      try {
        const places = await Location.reverseGeocodeAsync({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
        const place = places[0];
        if (place) {
          setPlaceName(
            [place.city ?? place.subregion, place.region ?? place.country]
              .filter(Boolean)
              .join(', ') || null
          );
        }
      } catch {
        // Reverse geocoding is a nicety; coordinates alone are enough.
      }
    } catch {
      setStatus('unavailable');
    }
  }, []);

  useEffect(() => {
    locate();
  }, [locate]);

  const setManualLocation = useCallback((next: GeoLocation, name?: string) => {
    setLocation(next);
    setPlaceName(name ?? null);
    setStatus('manual');
  }, []);

  return { location, status, placeName, refresh: locate, setManualLocation };
}
