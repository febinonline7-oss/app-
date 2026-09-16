/**
 * The composition layer: turns catalogues plus a time and place into one
 * uniform list of things in the sky, which is all the UI ever deals with.
 */

import {
  Equatorial,
  GeoLocation,
  Horizontal,
  equatorialToHorizontal,
  precess,
} from './coords';
import { DEEP_SKY, DeepSkyObject } from './deepsky';
import { MoonPosition, moonPosition, moonTopocentric } from './moon';
import { PLANET_NAMES, PlanetName, planetPosition } from './planets';
import { HORIZON, RiseSet, fixed, riseSetTransit } from './riseset';
import { STARS, Star, starColor } from './stars';
import { SunPosition, sunPosition } from './sun';
import { J2000, julianDay, lmst, norm360 } from './time';

export type SkyObjectKind = 'sun' | 'moon' | 'planet' | 'star' | 'deepsky';

export type SkyObject = {
  id: string;
  name: string;
  kind: SkyObjectKind;
  /** Short subtitle: designation, catalogue number or planet blurb. */
  subtitle: string;
  magnitude: number;
  equatorial: Equatorial;
  horizontal: Horizontal;
  /** Colour used for the chart marker. */
  color: string;
  /** Extra per-kind detail, surfaced on the detail screen. */
  detail?: Record<string, string>;
};

export type SkyConditions = {
  jd: number;
  date: Date;
  location: GeoLocation;
  sun: SunPosition & { horizontal: Horizontal };
  moon: MoonPosition & { horizontal: Horizontal };
  /** Darkness category driven by the sun's altitude. */
  darkness: 'day' | 'civil' | 'nautical' | 'astronomical' | 'night';
  /** True once the sun is at least 18° below the horizon. */
  fullyDark: boolean;
  /** How much the moon will wash out faint objects, 0-1. */
  moonInterference: number;
};

const PLANET_BLURB: Record<PlanetName, string> = {
  Mercury: 'Never far from the sun — catch it in twilight',
  Venus: 'The brightest planet; morning or evening star',
  Mars: 'Distinctly orange to the naked eye',
  Jupiter: 'Four moons visible in steady binoculars',
  Saturn: 'Rings need a telescope, but it is easy to spot',
  Uranus: 'Just at the edge of naked-eye visibility',
  Neptune: 'Binoculars minimum; looks like a faint blue star',
};

const PLANET_COLOR: Record<PlanetName, string> = {
  Mercury: '#d9d0c4',
  Venus: '#fff3d6',
  Mars: '#ff8b64',
  Jupiter: '#ffdcae',
  Saturn: '#f5e3a8',
  Uranus: '#a8e6f0',
  Neptune: '#8fb6ff',
};

const DEEP_SKY_COLOR: Record<DeepSkyObject['type'], string> = {
  galaxy: '#c9b6ff',
  nebula: '#8fe5c0',
  cluster: '#ffe9a8',
  globular: '#ffd28f',
};

/** Convert catalogue coordinates (J2000, RA in hours) to equatorial of date. */
function catalogToDate(raHours: number, dec: number, jd: number): Equatorial {
  return precess({ ra: norm360(raHours * 15), dec }, J2000, jd);
}

export function starToSkyObject(
  star: Star,
  location: GeoLocation,
  jd: number
): SkyObject {
  const equatorial = catalogToDate(star.raHours, star.dec, jd);
  return {
    id: `star:${star.id}`,
    name: star.name,
    kind: 'star',
    subtitle: `${star.designation} · ${star.constellation}`,
    magnitude: star.mag,
    equatorial,
    horizontal: equatorialToHorizontal(equatorial, location, jd),
    color: starColor(star.bv),
    detail: { Constellation: star.constellation, Designation: star.designation },
  };
}

export function deepSkyToSkyObject(
  dso: DeepSkyObject,
  location: GeoLocation,
  jd: number
): SkyObject {
  const equatorial = catalogToDate(dso.raHours, dso.dec, jd);
  return {
    id: `dso:${dso.id}`,
    name: dso.name,
    kind: 'deepsky',
    subtitle: `${dso.catalog} · ${dso.type}`,
    magnitude: dso.mag,
    equatorial,
    horizontal: equatorialToHorizontal(equatorial, location, jd),
    color: DEEP_SKY_COLOR[dso.type],
    detail: { Type: dso.type, Catalogue: dso.catalog, About: dso.note },
  };
}

/** Everything in the sky at one instant, unsorted. */
export function computeSky(date: Date, location: GeoLocation): SkyObject[] {
  const jd = julianDay(date);
  const objects: SkyObject[] = [];

  const sun = sunPosition(jd);
  objects.push({
    id: 'sun',
    name: 'Sun',
    kind: 'sun',
    subtitle: 'Wait for it to set before observing',
    magnitude: -26.7,
    equatorial: sun,
    horizontal: equatorialToHorizontal(sun, location, jd),
    color: '#ffd34d',
    detail: { Distance: `${sun.distance.toFixed(4)} AU` },
  });

  const moon = moonPosition(jd);
  const moonEq = moonTopocentric(moon, location.latitude, lmst(jd, location.longitude));
  objects.push({
    id: 'moon',
    name: 'Moon',
    kind: 'moon',
    subtitle: `${moon.phaseName} · ${Math.round(moon.illumination * 100)}% lit`,
    magnitude: moonMagnitude(moon),
    equatorial: moonEq,
    horizontal: equatorialToHorizontal(moonEq, location, jd),
    color: '#f2f0e6',
    detail: {
      Phase: moon.phaseName,
      Illumination: `${Math.round(moon.illumination * 100)}%`,
      Distance: `${Math.round(moon.distanceKm).toLocaleString()} km`,
    },
  });

  for (const name of PLANET_NAMES) {
    const planet = planetPosition(name, jd);
    objects.push({
      id: `planet:${name.toLowerCase()}`,
      name,
      kind: 'planet',
      subtitle: PLANET_BLURB[name],
      magnitude: planet.magnitude,
      equatorial: planet,
      horizontal: equatorialToHorizontal(planet, location, jd),
      color: PLANET_COLOR[name],
      detail: {
        Distance: `${planet.distance.toFixed(3)} AU`,
        'Apparent size': `${planet.angularDiameter.toFixed(1)}"`,
        Illumination: `${Math.round(planet.illumination * 100)}%`,
        'Elongation from sun': `${planet.elongation.toFixed(0)}°`,
      },
    });
  }

  for (const star of STARS) objects.push(starToSkyObject(star, location, jd));
  for (const dso of DEEP_SKY) objects.push(deepSkyToSkyObject(dso, location, jd));

  return objects;
}

/**
 * Rough lunar magnitude from phase. Only used for sorting, so the classic
 * full-moon value with a phase falloff is enough.
 */
function moonMagnitude(moon: MoonPosition): number {
  const phase = Math.min(moon.phase, 360 - moon.phase);
  return -12.7 + 0.026 * phase + 4e-9 * Math.pow(phase, 4);
}

export function skyConditions(date: Date, location: GeoLocation): SkyConditions {
  const jd = julianDay(date);
  const sun = sunPosition(jd);
  const sunHorizontal = equatorialToHorizontal(sun, location, jd);
  const moon = moonPosition(jd);
  const moonHorizontal = equatorialToHorizontal(moon, location, jd);

  const alt = sunHorizontal.altitude;
  const darkness =
    alt > HORIZON.sun ? 'day'
    : alt > HORIZON.civilTwilight ? 'civil'
    : alt > HORIZON.nauticalTwilight ? 'nautical'
    : alt > HORIZON.astronomicalTwilight ? 'astronomical'
    : 'night';

  // The moon only washes out the sky while it is actually above the horizon.
  const moonInterference =
    moonHorizontal.altitude > 0
      ? moon.illumination * Math.min(1, moonHorizontal.altitude / 30)
      : 0;

  return {
    jd,
    date,
    location,
    sun: { ...sun, horizontal: sunHorizontal },
    moon: { ...moon, horizontal: moonHorizontal },
    darkness,
    fullyDark: darkness === 'night',
    moonInterference,
  };
}

/** The ephemeris function for an object, used for rise/set searches. */
export function ephemerisFor(object: SkyObject) {
  switch (object.kind) {
    case 'sun':
      return (jd: number) => sunPosition(jd);
    case 'moon':
      return (jd: number) => moonPosition(jd);
    case 'planet': {
      const name = (object.name as PlanetName);
      return (jd: number) => planetPosition(name, jd);
    }
    default:
      // Stars and deep-sky objects move only by precession, which is
      // negligible across a single night.
      return fixed(object.equatorial);
  }
}

export function horizonFor(object: SkyObject): number {
  if (object.kind === 'sun') return HORIZON.sun;
  if (object.kind === 'moon') return HORIZON.moon;
  return HORIZON.star;
}

/** Rise/transit/set for one object over the 24 hours from `date`. */
export function riseSetFor(
  object: SkyObject,
  location: GeoLocation,
  date: Date
): RiseSet {
  return riseSetTransit(
    ephemerisFor(object),
    location,
    julianDay(date),
    horizonFor(object)
  );
}

/**
 * Whether an object is worth looking at right now: bright enough for the
 * current sky, and high enough to be clear of buildings, trees and the worst
 * of the atmosphere.
 */
export function isObservable(
  object: SkyObject,
  limitingMagnitude: number,
  minAltitude = 5
): boolean {
  if (object.kind === 'sun') return object.horizontal.altitude > -0.8333;
  return (
    object.horizontal.altitude > minAltitude && object.magnitude <= limitingMagnitude
  );
}

/**
 * How faint you can realistically see right now, given twilight and moonlight.
 */
export function limitingMagnitudeNow(
  conditions: SkyConditions,
  darkSkyLimit = 5.5
): number {
  const sunAlt = conditions.sun.horizontal.altitude;

  // Daylight and twilight raise the sky background enormously.
  let limit: number;
  if (sunAlt > 0) limit = -3;
  else if (sunAlt > -6) limit = 1 + (Math.abs(sunAlt) / 6) * 2;
  else if (sunAlt > -12) limit = 3 + ((Math.abs(sunAlt) - 6) / 6) * 1.5;
  else if (sunAlt > -18) limit = 4.5 + ((Math.abs(sunAlt) - 12) / 6) * (darkSkyLimit - 4.5);
  else limit = darkSkyLimit;

  // A bright moon costs up to a couple of magnitudes.
  return limit - conditions.moonInterference * 2;
}
