# SkyTrack

A stargazing app for phones. It works out what is above your horizon right
now, draws it on a chart, and then uses the compass and tilt sensors to point
you at whatever you pick.

Everything is computed on the device from orbital mechanics — there is no API
call, no key to configure, and it works with the phone in aeroplane mode
halfway up a hill.

## What it does

**Tonight** — a live list of what is up, sorted by how well placed it is. The
header tells you how dark it actually is (daylight through to astronomical
night), the moon's phase and whether it is going to wash out faint things, and
the faintest magnitude you could realistically see right now. Filter by
planets, stars or deep-sky objects.

**Sky** — a stereographic chart of the visible hemisphere: zenith at the
centre, horizon at the rim, constellation figures drawn in. Turn on *Turn with
me* and the chart rotates with the compass, so whatever is at the top of the
screen is what is in front of you.

**Track** — pick a target and the crosshair shows how far off you are in both
axes at once: "Turn 40° left", "Raise the phone 15°". It goes green when you
are within 6° of it. If the object has not risen yet it tells you when it
will, and if the sensors are unavailable it falls back to a plain bearing and
altitude you can follow by hand.

Tapping anything opens a detail sheet with its current altitude and azimuth,
right ascension and declination, rise/set/transit times, and the sort of thing
worth knowing about it.

## Running it

```bash
npm install
npx expo start
```

Then scan the QR code with Expo Go, or press `a`/`i` for an emulator.

The compass and tilt sensors only exist on real hardware. In a simulator the
Sky chart stays north-up and the Track screen shows the fallback bearing —
everything else works normally. If location is denied or unavailable, tap the
place name on the Tonight screen to enter coordinates or pick a city.

```bash
npm test         # 63 tests over the astronomy engine and the chart geometry
npm run typecheck
```

## How it is put together

The astronomy is a standalone, dependency-free TypeScript module under
`src/astro/`. It does not import React, so it can be tested as plain
arithmetic — which is most of what `src/astro/__tests__/astro.test.ts` does.

| File | What lives there |
| --- | --- |
| `time.ts` | Julian dates, sidereal time, obliquity, angle helpers |
| `coords.ts` | Ecliptic/equatorial/horizontal transforms, precession, refraction |
| `sun.ts` | Solar position and the equation of time |
| `moon.ts` | Lunar position, phase, topocentric correction |
| `planets.ts` | Planetary positions, phase, apparent magnitude |
| `stars.ts` | 131 bright stars and the constellation figures |
| `deepsky.ts` | 27 naked-eye and binocular deep-sky objects |
| `riseset.ts` | Rise, set and transit by sampling and bisection |
| `sky.ts` | Combines the above into one list of `SkyObject`s |

The UI layer (`src/screens`, `src/components`, `src/hooks`) only ever sees
`SkyObject`s with an altitude and azimuth already attached.

Rise and set times are found by sampling the altitude curve every ten minutes
and refining each crossing by bisection, rather than by the usual closed-form
approximation. It costs a few hundred evaluations but the same code then works
for a fixed star, a fast inner planet and the moon, which moves half a degree
an hour while you are searching for it.

## Accuracy, and where it runs out

This is built for pointing a phone, not for occultation timing.

- **Sun** — about 0.01°. Meeus's low-precision series.
- **Moon** — about 2 arcminutes, from the truncated ELP series. That is around
  a fifteenth of the moon's own diameter.
- **Planets** — roughly an arcminute for the inner planets and a few
  arcminutes for the outer ones, from JPL's approximate Keplerian elements.
  Those elements are fitted for **1800–2050**; outside that range the errors
  grow quickly.
- **Stars** — J2000 positions precessed to the date. Proper motion is ignored,
  which costs well under an arcsecond a year even for the fastest of them.

Known simplifications:

- Nutation is not modelled beyond the aberration term in the solar longitude.
- Planetary positions are not corrected for light travel time (tens of
  arcseconds at most).
- Saturn's magnitude ignores ring tilt, which is worth about a magnitude
  across its 29-year cycle.
- Only the moon gets a topocentric (parallax) correction; for everything else
  the shift is far below what you could aim at anyway.
- The limiting-magnitude estimate accounts for twilight and moonlight but
  knows nothing about your light pollution, so treat it as a guide.

The star catalogue is a curated bright-star list rather than a complete
survey: everything down to about magnitude 3, plus a few fainter stars that
complete a well-known figure. Constellation lines are only drawn for the
fourteen figures whose stars are all present.

## Tests

The suite checks the engine against facts about the real sky rather than
against its own output, so a mistyped orbital element or a flipped sign fails
loudly:

- solar declination reaching ±23.44° at the solstices, and zero at the equinox
- Earth's distance spanning perihelion to aphelion, with perihelion in early January
- the equation of time hitting −14 and +16 minutes
- new moon at the known new moon of 6 January 2000, full moon during the
  lunar eclipse of 21 January 2000
- the mean synodic month over a decade coming out at 29.5306 days
- every planet's perihelion and aphelion distance
- Venus never further than 48° from the sun, Mercury never further than 28°
- Polaris sitting at an altitude equal to your latitude, and due north
- the midnight sun at 78°N in June, and polar night there in December
- equal day and night at the equator on the equinox
- a star transiting four minutes earlier each day
