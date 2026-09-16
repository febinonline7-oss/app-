/**
 * Solar position, accurate to roughly 0.01° — far better than needed to
 * decide when it is dark enough to observe.
 *
 * Source: Meeus, Astronomical Algorithms, chapter 25 (low precision series).
 */

import { Equatorial, Ecliptic, eclipticToEquatorial } from './coords';
import {
  cosD,
  julianCenturies,
  meanObliquity,
  norm360,
  sinD,
} from './time';

export type SunPosition = Equatorial & {
  /** Apparent ecliptic longitude, degrees — drives the moon phase too. */
  eclipticLongitude: number;
  /** Earth-Sun distance in AU. */
  distance: number;
};

export function sunEcliptic(jd: number): Ecliptic & { distance: number } {
  const T = julianCenturies(jd);

  // Geometric mean longitude and mean anomaly.
  const L0 = norm360(280.46646 + 36000.76983 * T + 0.0003032 * T * T);
  const M = norm360(357.52911 + 35999.05029 * T - 0.0001537 * T * T);

  // Equation of the centre.
  const C =
    (1.914602 - 0.004817 * T - 0.000014 * T * T) * sinD(M) +
    (0.019993 - 0.000101 * T) * sinD(2 * M) +
    0.000289 * sinD(3 * M);

  const trueLongitude = L0 + C;
  const trueAnomaly = M + C;

  const e = 0.016708634 - 0.000042037 * T - 0.0000001267 * T * T;
  const distance = (1.000001018 * (1 - e * e)) / (1 + e * cosD(trueAnomaly));

  // Correct for nutation and aberration to get the apparent longitude.
  const omega = 125.04 - 1934.136 * T;
  const apparentLongitude = trueLongitude - 0.00569 - 0.00478 * sinD(omega);

  return { lon: norm360(apparentLongitude), lat: 0, distance };
}

export function sunPosition(jd: number): SunPosition {
  const ecl = sunEcliptic(jd);
  const T = julianCenturies(jd);
  const omega = 125.04 - 1934.136 * T;
  const obliquity = meanObliquity(jd) + 0.00256 * cosD(omega);
  const eq = eclipticToEquatorial(ecl, obliquity);
  return {
    ra: eq.ra,
    dec: eq.dec,
    distance: ecl.distance,
    eclipticLongitude: ecl.lon,
  };
}

/**
 * Equation of time in minutes: apparent solar time minus mean solar time.
 * Positive means a sundial runs ahead of the clock.
 */
export function equationOfTime(jd: number): number {
  const T = julianCenturies(jd);
  const L0 = norm360(280.46646 + 36000.76983 * T + 0.0003032 * T * T);
  const sun = sunPosition(jd);
  let eot = L0 - 0.0057183 - sun.ra + 0.00256 * cosD(125.04 - 1934.136 * T);
  // Fold into +/- 20 minutes; the raw difference can wrap a full turn.
  eot = ((eot % 360) + 540) % 360 - 180;
  return eot * 4;
}
