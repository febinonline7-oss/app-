/**
 * Coordinate systems and the transforms between them.
 *
 * Convention used throughout the app:
 *   - right ascension in degrees (not hours) unless a name says otherwise
 *   - azimuth measured from north, increasing eastwards
 *   - altitude positive above the horizon
 */

import {
  DEG,
  acosD,
  asinD,
  atan2D,
  cosD,
  julianCenturies,
  lmst,
  norm360,
  sinD,
  tanD,
} from './time';

export type Equatorial = {
  /** Right ascension, degrees. */
  ra: number;
  /** Declination, degrees. */
  dec: number;
  /** Distance in AU (planets/sun) or Earth radii (moon). Absent for stars. */
  distance?: number;
};

export type Horizontal = {
  /** Altitude above the horizon, degrees. */
  altitude: number;
  /** Azimuth from north through east, degrees. */
  azimuth: number;
};

export type Ecliptic = {
  /** Ecliptic longitude, degrees. */
  lon: number;
  /** Ecliptic latitude, degrees. */
  lat: number;
  distance?: number;
};

export type GeoLocation = {
  latitude: number;
  longitude: number;
  /** Metres above sea level; only used to lower the visible horizon. */
  elevation?: number;
};

/** Ecliptic -> equatorial of the same epoch. */
export function eclipticToEquatorial(
  ecl: Ecliptic,
  obliquity: number
): Equatorial {
  const { lon, lat } = ecl;
  const ra = atan2D(
    sinD(lon) * cosD(obliquity) - tanD(lat) * sinD(obliquity),
    cosD(lon)
  );
  const dec = asinD(
    sinD(lat) * cosD(obliquity) + cosD(lat) * sinD(obliquity) * sinD(lon)
  );
  return { ra: norm360(ra), dec, distance: ecl.distance };
}

/** Equatorial -> ecliptic of the same epoch. */
export function equatorialToEcliptic(
  eq: Equatorial,
  obliquity: number
): Ecliptic {
  const lon = atan2D(
    sinD(eq.ra) * cosD(obliquity) + tanD(eq.dec) * sinD(obliquity),
    cosD(eq.ra)
  );
  const lat = asinD(
    sinD(eq.dec) * cosD(obliquity) - cosD(eq.dec) * sinD(obliquity) * sinD(eq.ra)
  );
  return { lon: norm360(lon), lat, distance: eq.distance };
}

/**
 * Equatorial of date -> horizontal for an observer.
 *
 * `refract` applies Bennett's approximation for atmospheric refraction, which
 * matters most near the horizon (it lifts a rising object by about 0.5°).
 */
export function equatorialToHorizontal(
  eq: Equatorial,
  location: GeoLocation,
  jd: number,
  refract = true
): Horizontal {
  const hourAngle = norm360(lmst(jd, location.longitude) - eq.ra);
  const lat = location.latitude;

  const altitude = asinD(
    sinD(lat) * sinD(eq.dec) + cosD(lat) * cosD(eq.dec) * cosD(hourAngle)
  );
  const azimuth = norm360(
    atan2D(
      -cosD(eq.dec) * cosD(lat) * sinD(hourAngle),
      sinD(eq.dec) - sinD(lat) * sinD(altitude)
    )
  );

  return {
    altitude: refract ? altitude + refraction(altitude) : altitude,
    azimuth,
  };
}

/**
 * Atmospheric refraction in degrees for a true altitude (Bennett 1982).
 * Returns 0 well below the horizon where the formula stops being meaningful.
 */
export function refraction(trueAltitude: number): number {
  if (trueAltitude < -2) return 0;
  const h = Math.max(trueAltitude, -0.5);
  return 1.02 / Math.tan((h + 10.3 / (h + 5.11)) * DEG) / 60;
}

/**
 * Precess equatorial coordinates between epochs (Meeus 21.3).
 *
 * The star catalogue and the planetary elements are both J2000, but the
 * horizon transform needs coordinates of date — ignoring this would misplace
 * objects by roughly a third of a degree per 25 years.
 */
export function precess(eq: Equatorial, fromJd: number, toJd: number): Equatorial {
  if (fromJd === toJd) return eq;

  const T = julianCenturies(fromJd);
  const t = (toJd - fromJd) / 36525;

  const zeta =
    ((2306.2181 + 1.39656 * T - 0.000139 * T * T) * t +
      (0.30188 - 0.000344 * T) * t * t +
      0.017998 * t * t * t) /
    3600;
  const z =
    ((2306.2181 + 1.39656 * T - 0.000139 * T * T) * t +
      (1.09468 + 0.000066 * T) * t * t +
      0.018203 * t * t * t) /
    3600;
  const theta =
    ((2004.3109 - 0.8533 * T - 0.000217 * T * T) * t -
      (0.42665 + 0.000217 * T) * t * t -
      0.041833 * t * t * t) /
    3600;

  const A = cosD(eq.dec) * sinD(eq.ra + zeta);
  const B =
    cosD(theta) * cosD(eq.dec) * cosD(eq.ra + zeta) - sinD(theta) * sinD(eq.dec);
  const C =
    sinD(theta) * cosD(eq.dec) * cosD(eq.ra + zeta) + cosD(theta) * sinD(eq.dec);

  return {
    ra: norm360(atan2D(A, B) + z),
    dec: asinD(C),
    distance: eq.distance,
  };
}

/** Angular separation between two equatorial positions, degrees. */
export function angularSeparation(a: Equatorial, b: Equatorial): number {
  return acosD(
    sinD(a.dec) * sinD(b.dec) + cosD(a.dec) * cosD(b.dec) * cosD(a.ra - b.ra)
  );
}

/** Compass point for an azimuth, e.g. 135 -> "SE". */
export function compassPoint(azimuth: number): string {
  const points = [
    'N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE',
    'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW',
  ];
  return points[Math.round(norm360(azimuth) / 22.5) % 16];
}

/** Format degrees as `12° 34'`. */
export function formatDegrees(deg: number): string {
  const sign = deg < 0 ? '-' : '';
  const abs = Math.abs(deg);
  const d = Math.floor(abs);
  const m = Math.round((abs - d) * 60);
  return m === 60 ? `${sign}${d + 1}° 00'` : `${sign}${d}° ${String(m).padStart(2, '0')}'`;
}

/** Format a right ascension given in degrees as `12h 34m`. */
export function formatRa(raDegrees: number): string {
  const hours = norm360(raDegrees) / 15;
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  return m === 60 ? `${h + 1}h 00m` : `${h}h ${String(m).padStart(2, '0')}m`;
}
