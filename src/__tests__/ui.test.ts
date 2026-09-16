/**
 * Checks on the pieces of presentation logic that carry real geometry or
 * arithmetic, where an error would silently point someone the wrong way.
 */

import { dateFromJulianDay, julianDay } from '../astro';
import { projectToDisc } from '../components/SkyChart';
import {
  formatAltitude,
  formatCountdown,
  formatLocalTime,
  formatLocalTimeWithDay,
  formatMagnitude,
  formatTurn,
} from '../format';

const RADIUS = 100;

describe('sky chart projection', () => {
  test('the zenith lands at the centre', () => {
    const point = projectToDisc(90, 123, RADIUS, 0);
    expect(point.x).toBeCloseTo(0, 6);
    expect(point.y).toBeCloseTo(0, 6);
    expect(point.visible).toBe(true);
  });

  test('the horizon lands on the rim', () => {
    for (const azimuth of [0, 45, 90, 180, 270]) {
      const point = projectToDisc(0, azimuth, RADIUS, 0);
      expect(Math.hypot(point.x, point.y)).toBeCloseTo(RADIUS, 6);
    }
  });

  test('north is up and east is right with no rotation', () => {
    const north = projectToDisc(0, 0, RADIUS, 0);
    expect(north.x).toBeCloseTo(0, 6);
    expect(north.y).toBeCloseTo(-RADIUS, 6);

    const east = projectToDisc(0, 90, RADIUS, 0);
    expect(east.x).toBeCloseTo(RADIUS, 6);
    expect(east.y).toBeCloseTo(0, 6);

    const south = projectToDisc(0, 180, RADIUS, 0);
    expect(south.y).toBeCloseTo(RADIUS, 6);

    const west = projectToDisc(0, 270, RADIUS, 0);
    expect(west.x).toBeCloseTo(-RADIUS, 6);
  });

  test('rotation puts the bearing you face at the top', () => {
    for (const heading of [0, 37, 90, 215, 359]) {
      const ahead = projectToDisc(0, heading, RADIUS, heading);
      expect(ahead.x).toBeCloseTo(0, 6);
      expect(ahead.y).toBeCloseTo(-RADIUS, 6);
    }
  });

  test('altitude compresses towards the centre, monotonically', () => {
    let previous = Infinity;
    for (const altitude of [0, 15, 30, 45, 60, 75, 89]) {
      const point = projectToDisc(altitude, 0, RADIUS, 0);
      const distance = Math.hypot(point.x, point.y);
      expect(distance).toBeLessThan(previous);
      previous = distance;
    }
  });

  test('objects below the horizon are flagged', () => {
    expect(projectToDisc(-5, 0, RADIUS, 0).visible).toBe(false);
    expect(projectToDisc(0.1, 0, RADIUS, 0).visible).toBe(true);
  });
});

describe('formatting', () => {
  test('turn instructions name the shorter way round', () => {
    expect(formatTurn(30)).toBe('30° right');
    expect(formatTurn(-30)).toBe('30° left');
    expect(formatTurn(0)).toBe('straight ahead');
  });

  test('altitudes carry an explicit sign', () => {
    expect(formatAltitude(41.6)).toBe('+42°');
    expect(formatAltitude(-3.2)).toBe('−3°');
  });

  test('magnitudes use a minus sign, not a hyphen', () => {
    expect(formatMagnitude(1.44)).toBe('mag 1.4');
    expect(formatMagnitude(-4.2)).toBe('mag −4.2');
    expect(formatMagnitude(-26.74)).toBe('mag −26.7');
  });

  test('countdowns read forwards and backwards', () => {
    const now = new Date('2026-09-16T21:00:00Z');
    const inTwoHours = julianDay(new Date('2026-09-16T23:15:00Z'));
    const anHourAgo = julianDay(new Date('2026-09-16T20:00:00Z'));
    expect(formatCountdown(inTwoHours, now)).toBe('in 2h 15m');
    expect(formatCountdown(anHourAgo, now)).toBe('1h 00m ago');
    expect(formatCountdown(null, now)).toBe('—');
  });

  test('local times match the device clock', () => {
    const date = new Date('2026-09-16T21:34:00Z');
    const expected = `${String(date.getHours()).padStart(2, '0')}:${String(
      date.getMinutes()
    ).padStart(2, '0')}`;
    expect(formatLocalTime(julianDay(date))).toBe(expected);
  });

  test('times on another day are marked as such', () => {
    const reference = new Date('2026-09-16T21:00:00Z');
    const tomorrow = new Date(reference);
    tomorrow.setDate(tomorrow.getDate() + 1);
    expect(formatLocalTimeWithDay(julianDay(tomorrow), reference)).toContain('(+1d)');
    expect(formatLocalTimeWithDay(julianDay(reference), reference)).not.toContain('d)');
  });

  test('julian day helpers agree with each other', () => {
    const date = new Date('2026-09-16T21:34:00Z');
    expect(dateFromJulianDay(julianDay(date)).getTime()).toBe(date.getTime());
  });
});
