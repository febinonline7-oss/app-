/**
 * Time scales and angle helpers.
 *
 * Everything downstream works in Julian days (UT) and degrees, so the
 * conversions live here rather than being repeated per body.
 */

export const DEG = Math.PI / 180;
export const RAD = 180 / Math.PI;

/** Julian day number of the J2000.0 epoch (2000 Jan 1.5 TT). */
export const J2000 = 2451545.0;

export const sinD = (deg: number) => Math.sin(deg * DEG);
export const cosD = (deg: number) => Math.cos(deg * DEG);
export const tanD = (deg: number) => Math.tan(deg * DEG);
export const asinD = (x: number) => Math.asin(Math.max(-1, Math.min(1, x))) * RAD;
export const acosD = (x: number) => Math.acos(Math.max(-1, Math.min(1, x))) * RAD;
export const atan2D = (y: number, x: number) => Math.atan2(y, x) * RAD;

/** Normalise an angle to [0, 360). */
export function norm360(deg: number): number {
  const d = deg % 360;
  return d < 0 ? d + 360 : d;
}

/** Normalise an angle to [-180, 180). */
export function norm180(deg: number): number {
  return norm360(deg + 180) - 180;
}

/** Julian day (UT) for a JS Date. */
export function julianDay(date: Date): number {
  return date.getTime() / 86400000 + 2440587.5;
}

/**
 * Inverse of {@link julianDay}.
 *
 * Rounded to the millisecond: a Julian day is a large number, so the
 * round-trip loses a fraction of a millisecond, which is enough to turn a
 * 22:00 rise time into 21:59:59.999 and display it as 21:59.
 */
export function dateFromJulianDay(jd: number): Date {
  return new Date(Math.round((jd - 2440587.5) * 86400000));
}

/** Julian centuries of TT since J2000. UT is used as an approximation for TT. */
export function julianCenturies(jd: number): number {
  return (jd - J2000) / 36525;
}

/**
 * Greenwich mean sidereal time in degrees (Meeus, Astronomical Algorithms, 12.4).
 */
export function gmst(jd: number): number {
  const T = julianCenturies(jd);
  const theta =
    280.46061837 +
    360.98564736629 * (jd - J2000) +
    0.000387933 * T * T -
    (T * T * T) / 38710000;
  return norm360(theta);
}

/** Local mean sidereal time in degrees, east longitude positive. */
export function lmst(jd: number, longitude: number): number {
  return norm360(gmst(jd) + longitude);
}

/** Mean obliquity of the ecliptic in degrees (Meeus 22.2). */
export function meanObliquity(jd: number): number {
  const T = julianCenturies(jd);
  return (
    23.439291111 -
    0.0130041667 * T -
    1.638889e-7 * T * T +
    5.036111e-7 * T * T * T
  );
}
