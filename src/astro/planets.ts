/**
 * Planetary positions from JPL's approximate Keplerian elements
 * ("Approximate Positions of the Planets", Standish), valid 1800-2050 with
 * errors of order an arcminute for the inner planets and a few arcminutes
 * for the outer ones.
 *
 * Elements are referred to the mean ecliptic and equinox of J2000, so results
 * are precessed to the date before being handed to the horizon transform.
 */

import {
  Equatorial,
  eclipticToEquatorial,
  precess,
} from './coords';
import { J2000, atan2D, cosD, julianCenturies, norm360, sinD } from './time';

export type PlanetName =
  | 'Mercury'
  | 'Venus'
  | 'Mars'
  | 'Jupiter'
  | 'Saturn'
  | 'Uranus'
  | 'Neptune';

type Elements = {
  /** semi-major axis, AU */ a: number;
  /** eccentricity */ e: number;
  /** inclination, deg */ i: number;
  /** mean longitude, deg */ L: number;
  /** longitude of perihelion, deg */ peri: number;
  /** longitude of ascending node, deg */ node: number;
};

type ElementSet = { epoch: Elements; rate: Elements };

/** Rates are per Julian century. */
const ELEMENTS: Record<PlanetName | 'Earth', ElementSet> = {
  Mercury: {
    epoch: { a: 0.38709927, e: 0.20563593, i: 7.00497902, L: 252.25032350, peri: 77.45779628, node: 48.33076593 },
    rate: { a: 0.00000037, e: 0.00001906, i: -0.00594749, L: 149472.67411175, peri: 0.16047689, node: -0.12534081 },
  },
  Venus: {
    epoch: { a: 0.72333566, e: 0.00677672, i: 3.39467605, L: 181.97909950, peri: 131.60246718, node: 76.67984255 },
    rate: { a: 0.00000390, e: -0.00004107, i: -0.00078890, L: 58517.81538729, peri: 0.00268329, node: -0.27769418 },
  },
  Earth: {
    epoch: { a: 1.00000261, e: 0.01671123, i: -0.00001531, L: 100.46457166, peri: 102.93768193, node: 0.0 },
    rate: { a: 0.00000562, e: -0.00004392, i: -0.01294668, L: 35999.37244981, peri: 0.32327364, node: 0.0 },
  },
  Mars: {
    epoch: { a: 1.52371034, e: 0.09339410, i: 1.84969142, L: -4.55343205, peri: -23.94362959, node: 49.55953891 },
    rate: { a: 0.00001847, e: 0.00007882, i: -0.00813131, L: 19140.30268499, peri: 0.44441088, node: -0.29257343 },
  },
  Jupiter: {
    epoch: { a: 5.20288700, e: 0.04838624, i: 1.30439695, L: 34.39644051, peri: 14.72847983, node: 100.47390909 },
    rate: { a: -0.00011607, e: -0.00013253, i: -0.00183714, L: 3034.74612775, peri: 0.21252668, node: 0.20469106 },
  },
  Saturn: {
    epoch: { a: 9.53667594, e: 0.05386179, i: 2.48599187, L: 49.95424423, peri: 92.59887831, node: 113.66242448 },
    rate: { a: -0.00125060, e: -0.00050991, i: 0.00193609, L: 1222.49362201, peri: -0.41897216, node: -0.28867794 },
  },
  Uranus: {
    epoch: { a: 19.18916464, e: 0.04725744, i: 0.77263783, L: 313.23810451, peri: 170.95427630, node: 74.01692503 },
    rate: { a: -0.00196176, e: -0.00004397, i: -0.00242939, L: 428.48202785, peri: 0.40805281, node: 0.04240589 },
  },
  Neptune: {
    epoch: { a: 30.06992276, e: 0.00859048, i: 1.77004347, L: -55.12002969, peri: 44.96476227, node: 131.78422574 },
    rate: { a: 0.00026291, e: 0.00005105, i: 0.00035372, L: 218.45945325, peri: -0.32241464, node: -0.00508664 },
  },
};

/** Obliquity of the ecliptic at J2000, degrees. */
const OBLIQUITY_J2000 = 23.43928;

export const PLANET_NAMES: PlanetName[] = [
  'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune',
];

/** Angular diameter in arcseconds at 1 AU. */
const ANGULAR_DIAMETER: Record<PlanetName, number> = {
  Mercury: 6.74,
  Venus: 16.92,
  Mars: 9.36,
  Jupiter: 196.94,
  Saturn: 165.6,
  Uranus: 65.8,
  Neptune: 62.2,
};

type Vector3 = { x: number; y: number; z: number };

function elementsAt(name: PlanetName | 'Earth', T: number): Elements {
  const { epoch, rate } = ELEMENTS[name];
  return {
    a: epoch.a + rate.a * T,
    e: epoch.e + rate.e * T,
    i: epoch.i + rate.i * T,
    L: epoch.L + rate.L * T,
    peri: epoch.peri + rate.peri * T,
    node: epoch.node + rate.node * T,
  };
}

/** Kepler's equation, solved in degrees by Newton iteration. */
function solveKepler(meanAnomaly: number, e: number): number {
  const eStar = (180 / Math.PI) * e;
  let E = meanAnomaly + eStar * sinD(meanAnomaly);
  for (let i = 0; i < 20; i++) {
    const dM = meanAnomaly - (E - eStar * sinD(E));
    const dE = dM / (1 - e * cosD(E));
    E += dE;
    if (Math.abs(dE) < 1e-9) break;
  }
  return E;
}

/** Heliocentric position in the J2000 ecliptic frame, AU. */
export function heliocentric(name: PlanetName | 'Earth', jd: number): Vector3 {
  const T = julianCenturies(jd);
  const el = elementsAt(name, T);

  const argPeri = el.peri - el.node;
  // Mean anomaly folded to +/-180 so Kepler's equation converges cleanly.
  const M = ((el.L - el.peri) % 360 + 540) % 360 - 180;
  const E = solveKepler(M, el.e);

  // Position in the orbital plane.
  const xp = el.a * (cosD(E) - el.e);
  const yp = el.a * Math.sqrt(1 - el.e * el.e) * sinD(E);

  const cosW = cosD(argPeri), sinW = sinD(argPeri);
  const cosN = cosD(el.node), sinN = sinD(el.node);
  const cosI = cosD(el.i), sinI = sinD(el.i);

  return {
    x: (cosW * cosN - sinW * sinN * cosI) * xp + (-sinW * cosN - cosW * sinN * cosI) * yp,
    y: (cosW * sinN + sinW * cosN * cosI) * xp + (-sinW * sinN + cosW * cosN * cosI) * yp,
    z: sinW * sinI * xp + cosW * sinI * yp,
  };
}

export type PlanetPosition = Equatorial & {
  name: PlanetName;
  /** Distance from Earth, AU. */
  distance: number;
  /** Distance from the Sun, AU. */
  heliocentricDistance: number;
  /** Sun-planet-Earth angle, degrees. */
  phaseAngle: number;
  /** Illuminated fraction of the disc, 0-1. */
  illumination: number;
  /** Apparent visual magnitude. */
  magnitude: number;
  /** Apparent angular diameter, arcseconds. */
  angularDiameter: number;
  /** Elongation from the sun, degrees — small values mean lost in twilight. */
  elongation: number;
};

export function planetPosition(name: PlanetName, jd: number): PlanetPosition {
  const planet = heliocentric(name, jd);
  const earth = heliocentric('Earth', jd);

  const gx = planet.x - earth.x;
  const gy = planet.y - earth.y;
  const gz = planet.z - earth.z;

  const delta = Math.sqrt(gx * gx + gy * gy + gz * gz);
  const r = Math.sqrt(planet.x ** 2 + planet.y ** 2 + planet.z ** 2);
  const R = Math.sqrt(earth.x ** 2 + earth.y ** 2 + earth.z ** 2);

  const lon = norm360(atan2D(gy, gx));
  const lat = atan2D(gz, Math.sqrt(gx * gx + gy * gy));

  const eqJ2000 = eclipticToEquatorial({ lon, lat, distance: delta }, OBLIQUITY_J2000);
  const eq = precess(eqJ2000, J2000, jd);

  // Phase angle at the planet, and elongation as seen from Earth.
  const cosPhase = (r * r + delta * delta - R * R) / (2 * r * delta);
  const phaseAngle = Math.acos(Math.max(-1, Math.min(1, cosPhase))) * (180 / Math.PI);
  const cosElong = (R * R + delta * delta - r * r) / (2 * R * delta);
  const elongation = Math.acos(Math.max(-1, Math.min(1, cosElong))) * (180 / Math.PI);

  return {
    name,
    ra: eq.ra,
    dec: eq.dec,
    distance: delta,
    heliocentricDistance: r,
    phaseAngle,
    illumination: (1 + cosD(phaseAngle)) / 2,
    magnitude: apparentMagnitude(name, r, delta, phaseAngle),
    angularDiameter: ANGULAR_DIAMETER[name] / delta,
    elongation,
  };
}

/**
 * Apparent visual magnitude (Astronomical Almanac polynomials).
 *
 * Saturn is the rough one: its brightness swings by about a magnitude with
 * ring tilt, which this ignores.
 */
export function apparentMagnitude(
  name: PlanetName,
  r: number,
  delta: number,
  phaseAngle: number
): number {
  const base = 5 * Math.log10(r * delta);
  const i = phaseAngle;
  switch (name) {
    case 'Mercury':
      return -0.42 + base + 0.0380 * i - 0.000273 * i * i + 0.000002 * i * i * i;
    case 'Venus':
      return -4.40 + base + 0.0009 * i + 0.000239 * i * i - 0.00000065 * i * i * i;
    case 'Mars':
      return -1.52 + base + 0.016 * i;
    case 'Jupiter':
      return -9.40 + base + 0.005 * i;
    case 'Saturn':
      return -8.88 + base;
    case 'Uranus':
      return -7.19 + base;
    case 'Neptune':
      return -6.87 + base;
  }
}
