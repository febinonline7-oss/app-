/**
 * A short list of deep-sky objects that are genuinely worth pointing a phone
 * at: naked-eye or binocular targets, not a full Messier catalogue.
 *
 * Positions are J2000.0.
 */

export type DeepSkyType = 'galaxy' | 'nebula' | 'cluster' | 'globular';

export type DeepSkyObject = {
  id: string;
  name: string;
  catalog: string;
  type: DeepSkyType;
  raHours: number;
  dec: number;
  mag: number;
  /** One line on what you will actually see. */
  note: string;
};

const d = (
  id: string,
  name: string,
  catalog: string,
  type: DeepSkyType,
  raHours: number,
  dec: number,
  mag: number,
  note: string
): DeepSkyObject => ({ id, name, catalog, type, raHours, dec, mag, note });

export const DEEP_SKY: DeepSkyObject[] = [
  d('m45', 'Pleiades', 'M45', 'cluster', 3.79, 24.1167, 1.6,
    'Six or seven stars to the naked eye, dozens in binoculars.'),
  d('m31', 'Andromeda Galaxy', 'M31', 'galaxy', 0.71231, 41.2692, 3.4,
    'The furthest thing visible without optics — a faint oval smudge.'),
  d('m42', 'Orion Nebula', 'M42', 'nebula', 5.58814, -5.3911, 4.0,
    'The middle "star" of Orion\'s sword; obviously fuzzy in binoculars.'),
  d('m44', 'Beehive Cluster', 'M44', 'cluster', 8.6733, 19.9833, 3.7,
    'A hazy patch to the eye, a swarm of stars in binoculars.'),
  d('m7', 'Ptolemy Cluster', 'M7', 'cluster', 17.8975, -34.7933, 3.3,
    'Big, bright and low in the Milky Way near the scorpion\'s sting.'),
  d('m6', 'Butterfly Cluster', 'M6', 'cluster', 17.6683, -32.2167, 4.2,
    'Just north-west of M7 and noticeably smaller.'),
  d('omegacen', 'Omega Centauri', 'NGC 5139', 'globular', 13.44647, -47.4794, 3.9,
    'The finest globular cluster in the sky, if you are far enough south.'),
  d('47tuc', '47 Tucanae', 'NGC 104', 'globular', 0.40158, -72.0814, 4.1,
    'Second only to Omega Centauri; sits beside the Small Magellanic Cloud.'),
  d('lmc', 'Large Magellanic Cloud', 'LMC', 'galaxy', 5.39292, -69.7561, 0.9,
    'A detached piece of Milky Way to the naked eye. Southern skies only.'),
  d('smc', 'Small Magellanic Cloud', 'SMC', 'galaxy', 0.87911, -72.8286, 2.7,
    'Fainter companion to the LMC, best on a truly dark night.'),
  d('carina', 'Carina Nebula', 'NGC 3372', 'nebula', 10.75236, -59.8678, 1.0,
    'Larger and brighter than Orion\'s nebula, but far south.'),
  d('m13', 'Hercules Cluster', 'M13', 'globular', 16.69478, 36.4603, 5.8,
    'The best globular for northern observers; a fuzzy ball in binoculars.'),
  d('m22', 'Sagittarius Cluster', 'M22', 'globular', 18.6067, -23.9047, 5.1,
    'Brighter than M13 but sits low for northern latitudes.'),
  d('m8', 'Lagoon Nebula', 'M8', 'nebula', 18.06028, -24.3867, 6.0,
    'Visible as a misty patch in the Milky Way on a dark night.'),
  d('doublecluster', 'Double Cluster', 'NGC 869/884', 'cluster', 2.31667, 57.1333, 4.3,
    'Two clusters in one binocular field between Perseus and Cassiopeia.'),
  d('m11', 'Wild Duck Cluster', 'M11', 'cluster', 18.8517, -6.2667, 6.3,
    'Dense, wedge-shaped cluster in a rich Milky Way field.'),
  d('m3', 'M3', 'M3', 'globular', 13.70322, 28.3772, 6.2,
    'A fine spring globular halfway from Arcturus to Cor Caroli.'),
  d('m4', 'M4', 'M4', 'globular', 16.39311, -26.5258, 5.9,
    'Loose globular sitting right next to Antares.'),
  d('m15', 'M15', 'M15', 'globular', 21.49953, 12.1669, 6.2,
    'Compact globular off the nose of Pegasus.'),
  d('m33', 'Triangulum Galaxy', 'M33', 'galaxy', 1.56414, 30.6603, 5.7,
    'Large but very diffuse — needs a dark sky more than magnification.'),
  d('m51', 'Whirlpool Galaxy', 'M51', 'galaxy', 13.49797, 47.1953, 8.4,
    'Face-on spiral below the tip of the Big Dipper\'s handle. Telescope target.'),
  d('m81', 'Bode\'s Galaxy', 'M81', 'galaxy', 9.92589, 69.0653, 6.9,
    'Bright galaxy pair with M82 in the same low-power field.'),
  d('m104', 'Sombrero Galaxy', 'M104', 'galaxy', 12.6665, -11.6231, 8.0,
    'Edge-on galaxy with a dark dust lane. Telescope target.'),
  d('m57', 'Ring Nebula', 'M57', 'nebula', 18.89308, 33.0292, 8.8,
    'A small grey smoke ring between the two south stars of Lyra.'),
  d('m27', 'Dumbbell Nebula', 'M27', 'nebula', 19.99342, 22.7211, 7.4,
    'The brightest planetary nebula; an apple-core shape in a small scope.'),
  d('ngc253', 'Sculptor Galaxy', 'NGC 253', 'galaxy', 0.7925, -25.2883, 7.1,
    'Big, bright edge-on galaxy — a southern showpiece.'),
  d('m83', 'Southern Pinwheel', 'M83', 'galaxy', 13.61692, -29.8658, 7.5,
    'Face-on spiral, one of the brightest galaxies in the southern sky.'),
];
