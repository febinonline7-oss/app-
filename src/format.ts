import { dateFromJulianDay } from './astro';

/** Local clock time for a Julian day, e.g. "21:34". */
export function formatLocalTime(jd: number | null): string {
  if (jd === null) return '—';
  const date = dateFromJulianDay(jd);
  return `${String(date.getHours()).padStart(2, '0')}:${String(
    date.getMinutes()
  ).padStart(2, '0')}`;
}

/** Local time with a day marker when it is not today, e.g. "02:14 (+1d)". */
export function formatLocalTimeWithDay(jd: number | null, reference: Date): string {
  if (jd === null) return '—';
  const date = dateFromJulianDay(jd);
  const base = formatLocalTime(jd);
  const dayDelta = Math.round(
    (startOfDay(date).getTime() - startOfDay(reference).getTime()) / 86400000
  );
  if (dayDelta === 0) return base;
  return `${base} (${dayDelta > 0 ? '+' : ''}${dayDelta}d)`;
}

function startOfDay(date: Date): Date {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

/** "in 2h 15m" / "1h 03m ago" */
export function formatCountdown(jd: number | null, now: Date): string {
  if (jd === null) return '—';
  const deltaMinutes = Math.round(
    (dateFromJulianDay(jd).getTime() - now.getTime()) / 60000
  );
  const abs = Math.abs(deltaMinutes);
  const hours = Math.floor(abs / 60);
  const minutes = abs % 60;
  const span = hours > 0 ? `${hours}h ${String(minutes).padStart(2, '0')}m` : `${minutes}m`;
  return deltaMinutes >= 0 ? `in ${span}` : `${span} ago`;
}

/** Magnitudes read more naturally with an explicit sign. */
export function formatMagnitude(mag: number): string {
  if (mag <= -26) return 'mag −26.7';
  return `mag ${mag >= 0 ? '' : '−'}${Math.abs(mag).toFixed(1)}`;
}

export function formatAltitude(altitude: number): string {
  return `${altitude >= 0 ? '+' : '−'}${Math.abs(altitude).toFixed(0)}°`;
}

/** Signed turn instruction, e.g. -30 -> "30° left". */
export function formatTurn(delta: number): string {
  const rounded = Math.round(Math.abs(delta));
  if (rounded === 0) return 'straight ahead';
  return `${rounded}° ${delta > 0 ? 'right' : 'left'}`;
}
