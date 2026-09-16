/**
 * The engine is checked against facts that are true of the real sky rather
 * than against its own output: solstice declinations, the synodic month,
 * maximum elongations, orbital distances and so on. A transcription error in
 * an orbital element or a sign flip in a rotation shows up as a failure here.
 */

import {
  DEG,
  J2000,
  angularSeparation,
  compassPoint,
  dateFromJulianDay,
  eclipticToEquatorial,
  equatorialToEcliptic,
  equatorialToHorizontal,
  equationOfTime,
  heliocentric,
  julianDay,
  limitingMagnitudeNow,
  meanObliquity,
  moonPosition,
  norm180,
  norm360,
  planetPosition,
  precess,
  riseSetTransit,
  fixed,
  skyConditions,
  computeSky,
  STARS_BY_ID,
  sunPosition,
  HORIZON,
} from '..';

const LONDON = { latitude: 51.4779, longitude: -0.0015 };
const SYDNEY = { latitude: -33.8688, longitude: 151.2093 };
const EQUATOR = { latitude: 0, longitude: 0 };

const utc = (iso: string) => new Date(iso);
const jdOf = (iso: string) => julianDay(utc(iso));

/** Sample a function across a date range, returning min and max. */
function extremes(
  startIso: string,
  days: number,
  stepDays: number,
  f: (jd: number) => number
) {
  let min = Infinity;
  let max = -Infinity;
  const start = jdOf(startIso);
  for (let jd = start; jd <= start + days; jd += stepDays) {
    const v = f(jd);
    if (v < min) min = v;
    if (v > max) max = v;
  }
  return { min, max };
}

describe('time scales', () => {
  test('J2000 epoch is 2000-01-01 12:00 UTC', () => {
    expect(jdOf('2000-01-01T12:00:00Z')).toBeCloseTo(J2000, 9);
  });

  test('julian day round-trips through Date', () => {
    const date = utc('2026-09-16T03:24:11Z');
    expect(dateFromJulianDay(julianDay(date)).toISOString()).toBe(
      date.toISOString()
    );
  });

  test('obliquity is 23.4393 degrees at J2000 and decreasing', () => {
    expect(meanObliquity(J2000)).toBeCloseTo(23.43929, 4);
    expect(meanObliquity(jdOf('2100-01-01T00:00:00Z'))).toBeLessThan(
      meanObliquity(J2000)
    );
  });

  test('angle normalisation', () => {
    expect(norm360(-10)).toBeCloseTo(350);
    expect(norm360(370)).toBeCloseTo(10);
    expect(norm180(350)).toBeCloseTo(-10);
    expect(norm180(-350)).toBeCloseTo(10);
  });
});

describe('coordinate transforms', () => {
  test('ecliptic and equatorial round-trip', () => {
    const obliquity = meanObliquity(J2000);
    for (const sample of [
      { lon: 12.3, lat: 4.5 },
      { lon: 210.7, lat: -32.1 },
      { lon: 359.0, lat: 60.0 },
    ]) {
      const back = equatorialToEcliptic(
        eclipticToEquatorial(sample, obliquity),
        obliquity
      );
      expect(back.lon).toBeCloseTo(sample.lon, 6);
      expect(back.lat).toBeCloseTo(sample.lat, 6);
    }
  });

  test('the vernal point is the origin of both systems', () => {
    const eq = eclipticToEquatorial({ lon: 0, lat: 0 }, meanObliquity(J2000));
    expect(eq.ra).toBeCloseTo(0, 6);
    expect(eq.dec).toBeCloseTo(0, 6);
  });

  test('the ecliptic pole sits at the obliquity from the celestial pole', () => {
    const obliquity = meanObliquity(J2000);
    const eq = eclipticToEquatorial({ lon: 0, lat: 90 }, obliquity);
    expect(eq.dec).toBeCloseTo(90 - obliquity, 6);
  });

  test('precession is an identity over zero interval', () => {
    const eq = { ra: 101.3, dec: -16.7 };
    const same = precess(eq, J2000, J2000);
    expect(same.ra).toBeCloseTo(eq.ra, 9);
    expect(same.dec).toBeCloseTo(eq.dec, 9);
  });

  test('precession moves a star by about 50 arcsec per year', () => {
    const star = { ra: 180, dec: 0 };
    const moved = precess(star, J2000, J2000 + 36525);
    // One century of general precession is about 1.396 degrees along the ecliptic.
    const separation = angularSeparation(star, moved);
    expect(separation).toBeGreaterThan(1.2);
    expect(separation).toBeLessThan(1.5);
  });

  test('precession is reversible', () => {
    const star = { ra: 88.79, dec: 7.41 };
    const then = jdOf('2050-01-01T00:00:00Z');
    const back = precess(precess(star, J2000, then), then, J2000);
    expect(angularSeparation(star, back)).toBeLessThan(1 / 3600);
  });

  test('Polaris sits at an altitude equal to the observer latitude', () => {
    const polaris = STARS_BY_ID.polaris;
    const eq = { ra: polaris.raHours * 15, dec: polaris.dec };
    for (const latitude of [10, 35, 51.5, 70]) {
      const horizontal = equatorialToHorizontal(
        eq,
        { latitude, longitude: 0 },
        jdOf('2026-06-01T22:00:00Z'),
        false
      );
      // Polaris is 0.74 degrees off the true pole, so allow that plus a margin.
      expect(Math.abs(horizontal.altitude - latitude)).toBeLessThan(1.0);
      // And it is always within a degree of due north.
      const fromNorth = Math.abs(norm180(horizontal.azimuth));
      expect(fromNorth).toBeLessThan(2.0);
    }
  });

  test('an object on the meridian is due south for a northern observer', () => {
    // The sun transits London around local apparent noon.
    const location = LONDON;
    const jd = riseSetTransit(
      (t) => sunPosition(t),
      location,
      jdOf('2026-06-21T00:00:00Z'),
      HORIZON.sun
    ).transit!;
    const horizontal = equatorialToHorizontal(sunPosition(jd), location, jd);
    expect(Math.abs(horizontal.azimuth - 180)).toBeLessThan(1);
  });

  test('and due north for a southern observer', () => {
    const jd = riseSetTransit(
      (t) => sunPosition(t),
      SYDNEY,
      jdOf('2026-06-21T00:00:00Z'),
      HORIZON.sun
    ).transit!;
    const horizontal = equatorialToHorizontal(sunPosition(jd), SYDNEY, jd);
    expect(Math.min(horizontal.azimuth, 360 - horizontal.azimuth)).toBeLessThan(1);
  });

  test('compass points', () => {
    expect(compassPoint(0)).toBe('N');
    expect(compassPoint(90)).toBe('E');
    expect(compassPoint(181)).toBe('S');
    expect(compassPoint(315)).toBe('NW');
    expect(compassPoint(359)).toBe('N');
  });
});

describe('the sun', () => {
  test('declination reaches the obliquity at the solstices', () => {
    const june = extremes('2026-01-01T00:00:00Z', 365, 0.25, (jd) => sunPosition(jd).dec);
    expect(june.max).toBeCloseTo(23.44, 1);
    expect(june.min).toBeCloseTo(-23.44, 1);
  });

  test('declination is zero at the March equinox', () => {
    // The 2026 March equinox falls on the 20th.
    const jd = jdOf('2026-03-20T14:46:00Z');
    expect(Math.abs(sunPosition(jd).dec)).toBeLessThan(0.05);
    expect(norm180(sunPosition(jd).eclipticLongitude)).toBeCloseTo(0, 1);
  });

  test('right ascension is 90 degrees at the June solstice', () => {
    const jd = jdOf('2026-06-21T08:25:00Z');
    expect(sunPosition(jd).ra).toBeCloseTo(90, 0);
  });

  test('Earth-Sun distance spans perihelion to aphelion', () => {
    const { min, max } = extremes('2026-01-01T00:00:00Z', 365, 0.5, (jd) => sunPosition(jd).distance);
    expect(min).toBeCloseTo(0.9833, 3);
    expect(max).toBeCloseTo(1.0167, 3);
  });

  test('perihelion falls in early January', () => {
    let best = Infinity;
    let bestJd = 0;
    const start = jdOf('2025-12-15T00:00:00Z');
    for (let jd = start; jd < start + 40; jd += 1 / 48) {
      const r = sunPosition(jd).distance;
      if (r < best) {
        best = r;
        bestJd = jd;
      }
    }
    const date = dateFromJulianDay(bestJd);
    expect(date.getUTCMonth()).toBe(0);
    expect(date.getUTCDate()).toBeLessThanOrEqual(6);
  });

  test('equation of time has its usual February and November extremes', () => {
    const { min, max } = extremes('2026-01-01T00:00:00Z', 365, 0.5, equationOfTime);
    expect(min).toBeCloseTo(-14.2, 0);
    expect(max).toBeCloseTo(16.4, 0);
  });
});

describe('the moon', () => {
  test('is new near the known new moon of 2000 January 6', () => {
    const jd = jdOf('2000-01-06T18:14:00Z');
    const phase = moonPosition(jd).phase;
    expect(Math.min(phase, 360 - phase)).toBeLessThan(3);
  });

  test('is full during the total lunar eclipse of 2000 January 21', () => {
    const jd = jdOf('2000-01-21T04:44:00Z');
    expect(Math.abs(moonPosition(jd).phase - 180)).toBeLessThan(3);
  });

  test('successive new moons are a synodic month apart', () => {
    const newMoons: number[] = [];
    const start = jdOf('2026-01-01T00:00:00Z');
    // A decade, because the length of a lunation swings by half a day either
    // side of the mean on a cycle longer than a year.
    const span = 3653;
    let previous = moonPosition(start).phase;
    for (let jd = start; jd < start + span; jd += 1 / 24) {
      const phase = moonPosition(jd).phase;
      // The elongation wraps through 360 at new moon.
      if (phase < previous) newMoons.push(jd);
      previous = phase;
    }
    expect(newMoons.length).toBe(124);

    const intervals = newMoons.slice(1).map((jd, i) => jd - newMoons[i]);
    const mean = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    expect(mean).toBeCloseTo(29.530588, 2);

    // Individual lunations vary by about half a day either side of the mean.
    expect(Math.min(...intervals)).toBeGreaterThan(29.18);
    expect(Math.max(...intervals)).toBeLessThan(29.93);
  });

  test('illumination matches the phase angle', () => {
    const jd = jdOf('2026-05-01T00:00:00Z');
    const moon = moonPosition(jd);
    const expected = (1 - Math.cos(moon.phase * DEG)) / 2;
    expect(moon.illumination).toBeCloseTo(expected, 9);
    expect(moon.illumination).toBeGreaterThanOrEqual(0);
    expect(moon.illumination).toBeLessThanOrEqual(1);
  });

  test('phase names line up with the quarters', () => {
    expect(moonPosition(jdOf('2000-01-06T18:14:00Z')).phaseName).toBe('New Moon');
    expect(moonPosition(jdOf('2000-01-21T04:44:00Z')).phaseName).toBe('Full Moon');
  });

  test('distance stays between perigee and apogee', () => {
    const { min, max } = extremes('2026-01-01T00:00:00Z', 365, 0.1, (jd) => moonPosition(jd).distanceKm);
    expect(min).toBeGreaterThan(355000);
    expect(min).toBeLessThan(372000);
    expect(max).toBeGreaterThan(403000);
    expect(max).toBeLessThan(407500);
  });

  test('never strays far from the ecliptic', () => {
    const { min, max } = extremes('2026-01-01T00:00:00Z', 60, 0.25, (jd) => {
      const moon = moonPosition(jd);
      return equatorialToEcliptic(moon, meanObliquity(jd)).lat;
    });
    // The lunar orbit is inclined 5.145 degrees.
    expect(max).toBeLessThan(5.4);
    expect(min).toBeGreaterThan(-5.4);
    expect(max).toBeGreaterThan(4.8);
  });
});

describe('the planets', () => {
  test('heliocentric distances match the known orbits', () => {
    const ranges: Record<string, [number, number, number, number]> = {
      // name: [min low, min high, max low, max high]
      Mercury: [0.305, 0.310, 0.465, 0.470],
      Venus: [0.717, 0.720, 0.727, 0.730],
      Mars: [1.380, 1.384, 1.664, 1.669],
      Jupiter: [4.94, 4.97, 5.44, 5.48],
      Saturn: [9.00, 9.06, 10.04, 10.10],
      Uranus: [18.2, 18.4, 20.0, 20.2],
      Neptune: [29.7, 29.9, 30.3, 30.5],
    };
    // Sample a full orbit for each planet.
    const spans: Record<string, number> = {
      Mercury: 88, Venus: 225, Mars: 687, Jupiter: 4333,
      Saturn: 10759, Uranus: 30687, Neptune: 60190,
    };

    for (const [name, [minLo, minHi, maxLo, maxHi]] of Object.entries(ranges)) {
      const span = spans[name];
      const { min, max } = extremes(
        '2020-01-01T00:00:00Z',
        span,
        Math.max(0.5, span / 2000),
        (jd) => {
          const v = heliocentric(name as any, jd);
          return Math.sqrt(v.x ** 2 + v.y ** 2 + v.z ** 2);
        }
      );
      expect(min).toBeGreaterThanOrEqual(minLo);
      expect(min).toBeLessThanOrEqual(minHi);
      expect(max).toBeGreaterThanOrEqual(maxLo);
      expect(max).toBeLessThanOrEqual(maxHi);
    }
  });

  test('Earth orbits at one astronomical unit', () => {
    const { min, max } = extremes('2026-01-01T00:00:00Z', 365, 0.5, (jd) => {
      const v = heliocentric('Earth', jd);
      return Math.sqrt(v.x ** 2 + v.y ** 2 + v.z ** 2);
    });
    expect(min).toBeCloseTo(0.9833, 3);
    expect(max).toBeCloseTo(1.0167, 3);
  });

  test('Earth is essentially in the ecliptic plane by definition', () => {
    const { min, max } = extremes('2026-01-01T00:00:00Z', 365, 1, (jd) =>
      Math.abs(heliocentric('Earth', jd).z)
    );
    expect(max).toBeLessThan(0.001);
    expect(min).toBeGreaterThanOrEqual(0);
  });

  test('inner planets stay within their maximum elongations', () => {
    const mercury = extremes('2026-01-01T00:00:00Z', 730, 0.25, (jd) => planetPosition('Mercury', jd).elongation);
    expect(mercury.max).toBeGreaterThan(17.5);
    expect(mercury.max).toBeLessThan(28.5);

    const venus = extremes('2026-01-01T00:00:00Z', 730, 0.25, (jd) => planetPosition('Venus', jd).elongation);
    expect(venus.max).toBeGreaterThan(44);
    expect(venus.max).toBeLessThan(48);
  });

  test('outer planets reach opposition', () => {
    for (const name of ['Mars', 'Jupiter', 'Saturn'] as const) {
      const { max } = extremes('2026-01-01T00:00:00Z', 900, 1, (jd) => planetPosition(name, jd).elongation);
      expect(max).toBeGreaterThan(175);
    }
  });

  test('brightness ranges look right', () => {
    const venus = extremes('2026-01-01T00:00:00Z', 584, 0.5, (jd) => planetPosition('Venus', jd).magnitude);
    expect(venus.min).toBeLessThan(-4.0);
    expect(venus.max).toBeLessThan(-3.0);

    const jupiter = extremes('2026-01-01T00:00:00Z', 400, 1, (jd) => planetPosition('Jupiter', jd).magnitude);
    expect(jupiter.min).toBeLessThan(-2.3);
    expect(jupiter.max).toBeGreaterThan(-2.2);

    const neptune = extremes('2026-01-01T00:00:00Z', 400, 1, (jd) => planetPosition('Neptune', jd).magnitude);
    expect(neptune.min).toBeGreaterThan(7.6);
    expect(neptune.max).toBeLessThan(8.1);
  });

  test('outer planets are fully lit, inner ones show phases', () => {
    const jupiter = planetPosition('Jupiter', jdOf('2026-06-01T00:00:00Z'));
    expect(jupiter.illumination).toBeGreaterThan(0.99);

    const venus = extremes('2026-01-01T00:00:00Z', 584, 1, (jd) => planetPosition('Venus', jd).illumination);
    expect(venus.min).toBeLessThan(0.05);
    expect(venus.max).toBeGreaterThan(0.99);
  });

  test('a planet sits on the ecliptic within its orbital inclination', () => {
    const { min, max } = extremes('2026-01-01T00:00:00Z', 365, 1, (jd) => {
      const mars = planetPosition('Mars', jd);
      return equatorialToEcliptic(precess(mars, jd, J2000), 23.43928).lat;
    });
    expect(Math.max(Math.abs(min), Math.abs(max))).toBeLessThan(7);
  });
});

describe('rise, set and transit', () => {
  test('day and night are equal at the equinox on the equator', () => {
    const result = riseSetTransit(
      (jd) => sunPosition(jd),
      EQUATOR,
      jdOf('2026-03-20T00:00:00Z'),
      HORIZON.sun
    );
    expect(result.rise).not.toBeNull();
    expect(result.set).not.toBeNull();
    const dayLengthHours = (result.set! - result.rise!) * 24;
    // Refraction and the solar semidiameter add a few minutes to 12 hours.
    expect(dayLengthHours).toBeGreaterThan(12.0);
    expect(dayLengthHours).toBeLessThan(12.3);
  });

  test('the midnight sun never sets inside the Arctic Circle in June', () => {
    const result = riseSetTransit(
      (jd) => sunPosition(jd),
      { latitude: 78, longitude: 15 },
      jdOf('2026-06-21T00:00:00Z'),
      HORIZON.sun
    );
    expect(result.alwaysUp).toBe(true);
    expect(result.neverUp).toBe(false);
  });

  test('and never rises at the same latitude in December', () => {
    const result = riseSetTransit(
      (jd) => sunPosition(jd),
      { latitude: 78, longitude: 15 },
      jdOf('2026-12-21T00:00:00Z'),
      HORIZON.sun
    );
    expect(result.neverUp).toBe(true);
    expect(result.alwaysUp).toBe(false);
  });

  test('Polaris is circumpolar from London', () => {
    const polaris = STARS_BY_ID.polaris;
    const result = riseSetTransit(
      fixed({ ra: polaris.raHours * 15, dec: polaris.dec }),
      LONDON,
      jdOf('2026-09-16T00:00:00Z')
    );
    expect(result.alwaysUp).toBe(true);
  });

  test('and never visible from Sydney', () => {
    const polaris = STARS_BY_ID.polaris;
    const result = riseSetTransit(
      fixed({ ra: polaris.raHours * 15, dec: polaris.dec }),
      SYDNEY,
      jdOf('2026-09-16T00:00:00Z')
    );
    expect(result.neverUp).toBe(true);
  });

  test('transit altitude follows the standard meridian formula', () => {
    const sirius = STARS_BY_ID.sirius;
    const eq = { ra: sirius.raHours * 15, dec: sirius.dec };
    const result = riseSetTransit(fixed(eq), LONDON, jdOf('2026-01-15T00:00:00Z'));
    // Altitude at upper culmination = 90 - |latitude - declination|.
    const expected = 90 - Math.abs(LONDON.latitude - sirius.dec);
    // The engine includes refraction, which lifts a low object slightly.
    expect(result.transitAltitude).toBeGreaterThan(expected - 0.1);
    expect(result.transitAltitude).toBeLessThan(expected + 0.6);
  });

  test('a star rises about four minutes earlier each day', () => {
    const vega = STARS_BY_ID.vega;
    const eq = { ra: vega.raHours * 15, dec: vega.dec };
    const first = riseSetTransit(fixed(eq), LONDON, jdOf('2026-09-01T00:00:00Z'));
    const second = riseSetTransit(fixed(eq), LONDON, jdOf('2026-09-02T00:00:00Z'));
    const shiftMinutes = (second.transit! - first.transit! - 1) * 1440;
    expect(shiftMinutes).toBeGreaterThan(-4.5);
    expect(shiftMinutes).toBeLessThan(-3.5);
  });

  test('the moon rises later each day by roughly fifty minutes', () => {
    const start = jdOf('2026-04-10T00:00:00Z');
    const first = riseSetTransit((jd) => moonPosition(jd), LONDON, start, HORIZON.moon);
    const second = riseSetTransit((jd) => moonPosition(jd), LONDON, start + 1, HORIZON.moon);
    const delayMinutes = (second.rise! - first.rise! - 1) * 1440;
    expect(delayMinutes).toBeGreaterThan(20);
    expect(delayMinutes).toBeLessThan(90);
  });
});

describe('sky conditions and visibility', () => {
  test('midday is daylight and midnight is night', () => {
    const noon = skyConditions(utc('2026-06-21T12:00:00Z'), LONDON);
    expect(noon.darkness).toBe('day');
    expect(noon.sun.horizontal.altitude).toBeGreaterThan(50);

    const midnight = skyConditions(utc('2026-12-21T00:00:00Z'), LONDON);
    expect(midnight.darkness).toBe('night');
    expect(midnight.fullyDark).toBe(true);
  });

  test('London never gets astronomically dark at midsummer', () => {
    const conditions = skyConditions(utc('2026-06-21T01:00:00Z'), LONDON);
    expect(conditions.sun.horizontal.altitude).toBeGreaterThan(-18);
    expect(conditions.fullyDark).toBe(false);
  });

  test('the limiting magnitude collapses in daylight', () => {
    const day = skyConditions(utc('2026-06-21T12:00:00Z'), LONDON);
    const night = skyConditions(utc('2026-12-21T00:00:00Z'), LONDON);
    expect(limitingMagnitudeNow(day)).toBeLessThan(0);
    expect(limitingMagnitudeNow(night)).toBeGreaterThan(3);
  });

  test('a bright moon costs about two magnitudes', () => {
    const conditions = skyConditions(utc('2026-12-21T00:00:00Z'), LONDON);
    const dark = { ...conditions, moonInterference: 0 };
    const bright = { ...conditions, moonInterference: 1 };
    expect(limitingMagnitudeNow(dark) - limitingMagnitudeNow(bright)).toBeCloseTo(2, 5);
  });

  test('computeSky returns every catalogue entry with a horizon position', () => {
    const objects = computeSky(utc('2026-09-16T22:00:00Z'), LONDON);
    const kinds = new Set(objects.map((o) => o.kind));
    expect(kinds).toEqual(new Set(['sun', 'moon', 'planet', 'star', 'deepsky']));

    for (const object of objects) {
      expect(object.horizontal.altitude).toBeGreaterThanOrEqual(-91);
      expect(object.horizontal.altitude).toBeLessThanOrEqual(91);
      expect(object.horizontal.azimuth).toBeGreaterThanOrEqual(0);
      expect(object.horizontal.azimuth).toBeLessThan(360);
      expect(Number.isFinite(object.magnitude)).toBe(true);
    }
  });

  test('roughly half the sphere is above the horizon at any moment', () => {
    const objects = computeSky(utc('2026-09-16T22:00:00Z'), LONDON);
    const stars = objects.filter((o) => o.kind === 'star');
    const up = stars.filter((o) => o.horizontal.altitude > 0).length;
    const fraction = up / stars.length;
    // The catalogue is not evenly spread, so allow a wide band.
    expect(fraction).toBeGreaterThan(0.25);
    expect(fraction).toBeLessThan(0.75);
  });

  test('the same object is higher from a latitude closer to its declination', () => {
    const north = computeSky(utc('2026-01-15T22:00:00Z'), { latitude: 20, longitude: 0 });
    const south = computeSky(utc('2026-01-15T22:00:00Z'), { latitude: 60, longitude: 0 });
    const findSirius = (list: typeof north) => list.find((o) => o.name === 'Sirius')!;
    expect(findSirius(north).horizontal.altitude).toBeGreaterThan(
      findSirius(south).horizontal.altitude
    );
  });
});
