/**
 * Rise, transit and set times.
 *
 * Rather than the closed-form circular-orbit approximation, this samples the
 * altitude curve and refines each horizon crossing by bisection. It costs a
 * few hundred position evaluations but handles everything uniformly — the
 * moon (which moves 13° a day), a fast inner planet, and a fixed star all go
 * through the same code path.
 */

import { Equatorial, GeoLocation, equatorialToHorizontal } from './coords';

/** Standard altitude of the horizon crossing for each kind of body. */
export const HORIZON = {
  /** Point sources, allowing for refraction at the horizon. */
  star: -0.5667,
  /** Upper limb of the solar disc. */
  sun: -0.8333,
  /** Moon: refraction and semidiameter roughly cancel its parallax. */
  moon: 0.125,
  civilTwilight: -6,
  nauticalTwilight: -12,
  astronomicalTwilight: -18,
} as const;

export type RiseSet = {
  /** Julian day of rise, or null if the object never crosses the horizon. */
  rise: number | null;
  set: number | null;
  /** Julian day of upper culmination. */
  transit: number | null;
  /** Altitude at transit, degrees — how high it ever gets. */
  transitAltitude: number;
  /** True when the object stays above the horizon for the whole window. */
  alwaysUp: boolean;
  /** True when it never rises during the window. */
  neverUp: boolean;
};

/** A position provider: given a Julian day, return equatorial coordinates. */
export type Ephemeris = (jd: number) => Equatorial;

/** Wrap fixed coordinates (a star) as an Ephemeris. */
export function fixed(eq: Equatorial): Ephemeris {
  return () => eq;
}

function altitudeAt(
  ephemeris: Ephemeris,
  location: GeoLocation,
  jd: number
): number {
  return equatorialToHorizontal(ephemeris(jd), location, jd).altitude;
}

/**
 * Find rise/transit/set within `windowDays` starting at `startJd`.
 *
 * `stepMinutes` sets the sampling resolution; 10 minutes is fine because no
 * visible body changes altitude fast enough to enter and leave the sky
 * between samples.
 */
export function riseSetTransit(
  ephemeris: Ephemeris,
  location: GeoLocation,
  startJd: number,
  horizon: number = HORIZON.star,
  windowDays = 1,
  stepMinutes = 10
): RiseSet {
  const step = stepMinutes / 1440;
  const steps = Math.ceil(windowDays / step);

  let rise: number | null = null;
  let set: number | null = null;
  let transit: number | null = null;
  let transitAltitude = -90;

  let prevJd = startJd;
  let prevAlt = altitudeAt(ephemeris, location, prevJd);
  let everAbove = prevAlt > horizon;
  let everBelow = prevAlt <= horizon;
  let prevSlope = 0;

  for (let i = 1; i <= steps; i++) {
    const jd = startJd + i * step;
    const alt = altitudeAt(ephemeris, location, jd);

    if (alt > horizon) everAbove = true;
    else everBelow = true;

    if (rise === null && prevAlt <= horizon && alt > horizon) {
      rise = refineCrossing(ephemeris, location, prevJd, jd, horizon);
    }
    if (set === null && prevAlt > horizon && alt <= horizon) {
      set = refineCrossing(ephemeris, location, prevJd, jd, horizon);
    }

    // Upper culmination: the altitude curve turns over from rising to falling.
    const slope = alt - prevAlt;
    if (transit === null && prevSlope > 0 && slope <= 0) {
      const peak = refinePeak(ephemeris, location, prevJd - step, jd);
      transit = peak.jd;
      transitAltitude = peak.altitude;
    }
    prevSlope = slope;

    prevJd = jd;
    prevAlt = alt;
  }

  if (transit === null) {
    // No turning point inside the window (common for a short window): fall
    // back to the highest sample.
    const peak = scanPeak(ephemeris, location, startJd, windowDays, stepMinutes);
    transit = peak.jd;
    transitAltitude = peak.altitude;
  }

  return {
    rise,
    set,
    transit,
    transitAltitude,
    alwaysUp: everAbove && !everBelow,
    neverUp: everBelow && !everAbove,
  };
}

/** Bisect a bracketed horizon crossing down to about one second. */
function refineCrossing(
  ephemeris: Ephemeris,
  location: GeoLocation,
  loJd: number,
  hiJd: number,
  horizon: number
): number {
  let lo = loJd;
  let hi = hiJd;
  const loAbove = altitudeAt(ephemeris, location, lo) > horizon;

  for (let i = 0; i < 24; i++) {
    const mid = (lo + hi) / 2;
    const above = altitudeAt(ephemeris, location, mid) > horizon;
    if (above === loAbove) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
}

/** Golden-section search for the altitude maximum in a bracket. */
function refinePeak(
  ephemeris: Ephemeris,
  location: GeoLocation,
  loJd: number,
  hiJd: number
): { jd: number; altitude: number } {
  const phi = (Math.sqrt(5) - 1) / 2;
  let a = loJd;
  let b = hiJd;
  let c = b - phi * (b - a);
  let d = a + phi * (b - a);
  let fc = altitudeAt(ephemeris, location, c);
  let fd = altitudeAt(ephemeris, location, d);

  for (let i = 0; i < 40 && b - a > 1e-6; i++) {
    if (fc > fd) {
      b = d;
      d = c;
      fd = fc;
      c = b - phi * (b - a);
      fc = altitudeAt(ephemeris, location, c);
    } else {
      a = c;
      c = d;
      fc = fd;
      d = a + phi * (b - a);
      fd = altitudeAt(ephemeris, location, d);
    }
  }
  const jd = (a + b) / 2;
  return { jd, altitude: altitudeAt(ephemeris, location, jd) };
}

function scanPeak(
  ephemeris: Ephemeris,
  location: GeoLocation,
  startJd: number,
  windowDays: number,
  stepMinutes: number
): { jd: number; altitude: number } {
  const step = stepMinutes / 1440;
  let bestJd = startJd;
  let best = -90;
  for (let jd = startJd; jd <= startJd + windowDays; jd += step) {
    const alt = altitudeAt(ephemeris, location, jd);
    if (alt > best) {
      best = alt;
      bestJd = jd;
    }
  }
  return { jd: bestJd, altitude: best };
}
