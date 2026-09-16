/**
 * Lunar position and phase.
 *
 * Uses the classic truncated ELP series (the perturbation set popularised by
 * Paul Schlyter), good to roughly 2 arcminutes in longitude — about a
 * fifteenth of the moon's own width, so it points a phone in the right place.
 */

import {
  Ecliptic,
  Equatorial,
  eclipticToEquatorial,
} from './coords';
import {
  DEG,
  asinD,
  atan2D,
  cosD,
  meanObliquity,
  norm360,
  sinD,
} from './time';
import { sunEcliptic } from './sun';

/** Earth radii per astronomical unit. */
const EARTH_RADII_PER_AU = 23454.8;

export type MoonPosition = Equatorial & {
  /** Geocentric distance in Earth radii. */
  distance: number;
  /** Geocentric distance in kilometres. */
  distanceKm: number;
  /** Illuminated fraction of the disc, 0-1. */
  illumination: number;
  /** Phase angle 0-360: 0 new, 90 first quarter, 180 full, 270 last quarter. */
  phase: number;
  phaseName: string;
  /** True when the moon is between new and full (waxing). */
  waxing: boolean;
};

/** Mean elements referred to the mean equinox of date. */
function meanElements(jd: number) {
  // Days since 1999 Dec 31.0 TDT, the epoch these series are written for.
  const d = jd - 2451543.5;
  return {
    d,
    N: norm360(125.1228 - 0.0529538083 * d), // longitude of ascending node
    i: 5.1454, // inclination
    w: norm360(318.0634 + 0.1643573223 * d), // argument of perigee
    a: 60.2666, // semi-major axis, Earth radii
    e: 0.054900,
    M: norm360(115.3654 + 13.0649929509 * d), // mean anomaly
  };
}

/** Solve Kepler's equation iteratively; the lunar eccentricity converges fast. */
function eccentricAnomaly(M: number, e: number): number {
  let E = M + e * (180 / Math.PI) * sinD(M) * (1 + e * cosD(M));
  for (let i = 0; i < 12; i++) {
    const delta =
      (E - e * (180 / Math.PI) * sinD(E) - M) / (1 - e * cosD(E));
    E -= delta;
    if (Math.abs(delta) < 1e-9) break;
  }
  return E;
}

export function moonEcliptic(jd: number): Ecliptic & { distance: number } {
  const el = meanElements(jd);
  const E = eccentricAnomaly(el.M, el.e);

  // Position in the orbital plane.
  const xv = el.a * (cosD(E) - el.e);
  const yv = el.a * (Math.sqrt(1 - el.e * el.e) * sinD(E));
  const v = atan2D(yv, xv);
  const r = Math.sqrt(xv * xv + yv * yv);

  // Rotate into ecliptic coordinates.
  const xh =
    r * (cosD(el.N) * cosD(v + el.w) - sinD(el.N) * sinD(v + el.w) * cosD(el.i));
  const yh =
    r * (sinD(el.N) * cosD(v + el.w) + cosD(el.N) * sinD(v + el.w) * cosD(el.i));
  const zh = r * (sinD(v + el.w) * sinD(el.i));

  let lon = atan2D(yh, xh);
  let lat = atan2D(zh, Math.sqrt(xh * xh + yh * yh));
  let dist = r;

  // Perturbations. Ls/Ms are solar, Lm/Mm lunar; D is the elongation and F
  // the argument of latitude.
  const Ms = norm360(356.0470 + 0.9856002585 * el.d);
  const Ls = norm360(282.9404 + 4.70935e-5 * el.d + Ms);
  const Lm = norm360(el.N + el.w + el.M);
  const Mm = el.M;
  const D = norm360(Lm - Ls);
  const F = norm360(Lm - el.N);

  lon +=
    -1.274 * sinD(Mm - 2 * D) + // evection
    0.658 * sinD(2 * D) + //       variation
    -0.186 * sinD(Ms) + //         yearly equation
    -0.059 * sinD(2 * Mm - 2 * D) +
    -0.057 * sinD(Mm - 2 * D + Ms) +
    0.053 * sinD(Mm + 2 * D) +
    0.046 * sinD(2 * D - Ms) +
    0.041 * sinD(Mm - Ms) +
    -0.035 * sinD(D) + //          parallactic equation
    -0.031 * sinD(Mm + Ms) +
    -0.015 * sinD(2 * F - 2 * D) +
    0.011 * sinD(Mm - 4 * D);

  lat +=
    -0.173 * sinD(F - 2 * D) +
    -0.055 * sinD(Mm - F - 2 * D) +
    -0.046 * sinD(Mm + F - 2 * D) +
    0.033 * sinD(F + 2 * D) +
    0.017 * sinD(2 * Mm + F);

  dist += -0.58 * cosD(Mm - 2 * D) - 0.46 * cosD(2 * D);

  return { lon: norm360(lon), lat, distance: dist };
}

const PHASE_NAMES = [
  'New Moon',
  'Waxing Crescent',
  'First Quarter',
  'Waxing Gibbous',
  'Full Moon',
  'Waning Gibbous',
  'Last Quarter',
  'Waning Crescent',
];

export function phaseName(phaseAngle: number): string {
  const p = norm360(phaseAngle);
  // Give the four exact phases a narrow window and the crescents the rest.
  const index = Math.floor((p + 22.5) / 45) % 8;
  return PHASE_NAMES[index];
}

export function moonPosition(jd: number): MoonPosition {
  const ecl = moonEcliptic(jd);
  const obliquity = meanObliquity(jd);
  const eq = eclipticToEquatorial(ecl, obliquity);

  // Phase from the geocentric elongation between moon and sun.
  const sun = sunEcliptic(jd);
  const elongation = norm360(ecl.lon - sun.lon);
  const illumination = (1 - cosD(elongation)) / 2;

  return {
    ra: eq.ra,
    dec: eq.dec,
    distance: ecl.distance,
    distanceKm: ecl.distance * (149597870.7 / EARTH_RADII_PER_AU),
    illumination,
    phase: elongation,
    phaseName: phaseName(elongation),
    waxing: elongation < 180,
  };
}

/**
 * Horizontal parallax of the moon in degrees. At ~1° it is large enough to
 * matter for rise and set times, unlike for any other body in the app.
 */
export function moonParallax(distanceEarthRadii: number): number {
  return asinD(1 / distanceEarthRadii);
}

/**
 * Topocentric correction: shifts the geocentric position to what an observer
 * on the surface actually sees. Up to ~1° near the horizon.
 */
export function moonTopocentric(
  moon: MoonPosition,
  latitude: number,
  localSiderealTime: number
): Equatorial {
  const parallax = moonParallax(moon.distance);
  const ha = norm360(localSiderealTime - moon.ra);
  // Flattening-corrected observer coordinates.
  const gclat = latitude - 0.1924 * sinD(2 * latitude);
  const rho = 0.99833 + 0.00167 * cosD(2 * latitude);

  const g = Math.atan(Math.tan(gclat * DEG) / cosD(ha)) * (180 / Math.PI);
  const raTopo = moon.ra - parallax * rho * cosD(gclat) * sinD(ha) / cosD(moon.dec);
  const decTopo =
    moon.dec -
    (Math.abs(g) < 1e-6
      ? parallax * rho * cosD(gclat) * cosD(ha) * sinD(moon.dec)
      : parallax * rho * sinD(gclat) * sinD(g - moon.dec) / sinD(g));

  return { ra: norm360(raTopo), dec: decTopo, distance: moon.distance };
}
