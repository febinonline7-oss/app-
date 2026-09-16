/**
 * Bright-star catalogue: naked-eye stars down to about magnitude 3, plus a
 * few fainter ones that complete a well-known figure.
 *
 * Positions are J2000.0 and are precessed to the date before use. Proper
 * motion is ignored — over a human lifetime it moves even Barnard's Star by
 * less than a moon's width, and these are all far slower.
 */

export type Star = {
  id: string;
  name: string;
  /** Bayer/Flamsteed designation, e.g. "alpha CMa". */
  designation: string;
  constellation: string;
  /** Right ascension J2000, hours. */
  raHours: number;
  /** Declination J2000, degrees. */
  dec: number;
  /** Apparent visual magnitude. */
  mag: number;
  /** B-V colour index; drives the tint drawn on the chart. */
  bv: number;
};

const s = (
  id: string,
  name: string,
  designation: string,
  constellation: string,
  raHours: number,
  dec: number,
  mag: number,
  bv = 0.4
): Star => ({ id, name, designation, constellation, raHours, dec, mag, bv });

export const STARS: Star[] = [
  // --- first magnitude ---------------------------------------------------
  s('sirius', 'Sirius', 'alpha CMa', 'Canis Major', 6.75247, -16.7161, -1.46, 0.0),
  s('canopus', 'Canopus', 'alpha Car', 'Carina', 6.39919, -52.6957, -0.74, 0.15),
  s('rigilkent', 'Rigil Kentaurus', 'alpha Cen', 'Centaurus', 14.66014, -60.8339, -0.27, 0.71),
  s('arcturus', 'Arcturus', 'alpha Boo', 'Bootes', 14.26103, 19.1825, -0.05, 1.23),
  s('vega', 'Vega', 'alpha Lyr', 'Lyra', 18.61565, 38.7837, 0.03, 0.0),
  s('capella', 'Capella', 'alpha Aur', 'Auriga', 5.27817, 45.998, 0.08, 0.8),
  s('rigel', 'Rigel', 'beta Ori', 'Orion', 5.24229, -8.2016, 0.13, -0.03),
  s('procyon', 'Procyon', 'alpha CMi', 'Canis Minor', 7.65514, 5.225, 0.34, 0.42),
  s('achernar', 'Achernar', 'alpha Eri', 'Eridanus', 1.62856, -57.2367, 0.46, -0.16),
  s('betelgeuse', 'Betelgeuse', 'alpha Ori', 'Orion', 5.91953, 7.4071, 0.5, 1.85),
  s('hadar', 'Hadar', 'beta Cen', 'Centaurus', 14.06372, -60.373, 0.61, -0.23),
  s('altair', 'Altair', 'alpha Aql', 'Aquila', 19.84639, 8.8683, 0.77, 0.22),
  s('acrux', 'Acrux', 'alpha Cru', 'Crux', 12.44331, -63.0991, 0.77, -0.24),
  s('aldebaran', 'Aldebaran', 'alpha Tau', 'Taurus', 4.59867, 16.5093, 0.85, 1.54),
  s('spica', 'Spica', 'alpha Vir', 'Virgo', 13.41986, -11.1614, 0.98, -0.23),
  s('antares', 'Antares', 'alpha Sco', 'Scorpius', 16.49011, -26.432, 1.09, 1.83),
  s('pollux', 'Pollux', 'beta Gem', 'Gemini', 7.75525, 28.0262, 1.14, 1.0),
  s('fomalhaut', 'Fomalhaut', 'alpha PsA', 'Piscis Austrinus', 22.96083, -29.6222, 1.16, 0.09),
  s('deneb', 'Deneb', 'alpha Cyg', 'Cygnus', 20.69053, 45.2803, 1.25, 0.09),
  s('mimosa', 'Mimosa', 'beta Cru', 'Crux', 12.79536, -59.6887, 1.25, -0.24),
  s('regulus', 'Regulus', 'alpha Leo', 'Leo', 10.13953, 11.9672, 1.4, -0.11),

  // --- second magnitude --------------------------------------------------
  s('adhara', 'Adhara', 'epsilon CMa', 'Canis Major', 6.97708, -28.9722, 1.5, -0.21),
  s('castor', 'Castor', 'alpha Gem', 'Gemini', 7.57667, 31.8883, 1.58, 0.03),
  s('shaula', 'Shaula', 'lambda Sco', 'Scorpius', 17.56014, -37.1039, 1.62, -0.23),
  s('gacrux', 'Gacrux', 'gamma Cru', 'Crux', 12.51942, -57.1133, 1.63, 1.59),
  s('bellatrix', 'Bellatrix', 'gamma Ori', 'Orion', 5.41886, 6.3497, 1.64, -0.22),
  s('elnath', 'Elnath', 'beta Tau', 'Taurus', 5.43819, 28.6075, 1.65, -0.13),
  s('miaplacidus', 'Miaplacidus', 'beta Car', 'Carina', 9.22006, -69.7172, 1.67, 0.07),
  s('alnilam', 'Alnilam', 'epsilon Ori', 'Orion', 5.60356, -1.2019, 1.69, -0.18),
  s('alnair', 'Alnair', 'alpha Gru', 'Grus', 22.13722, -46.9611, 1.74, -0.07),
  s('gammavel', 'Regor', 'gamma Vel', 'Vela', 8.15889, -47.3367, 1.75, -0.15),
  s('alnitak', 'Alnitak', 'zeta Ori', 'Orion', 5.67931, -1.9428, 1.77, -0.2),
  s('alioth', 'Alioth', 'epsilon UMa', 'Ursa Major', 12.90047, 55.9597, 1.77, -0.02),
  s('dubhe', 'Dubhe', 'alpha UMa', 'Ursa Major', 11.06214, 61.7511, 1.79, 1.07),
  s('mirfak', 'Mirfak', 'alpha Per', 'Perseus', 3.40539, 49.8611, 1.79, 0.48),
  s('wezen', 'Wezen', 'delta CMa', 'Canis Major', 7.13986, -26.3933, 1.84, 0.67),
  s('kausaustralis', 'Kaus Australis', 'epsilon Sgr', 'Sagittarius', 18.40286, -34.3847, 1.85, -0.03),
  s('sargas', 'Sargas', 'theta Sco', 'Scorpius', 17.62197, -42.9978, 1.86, 0.4),
  s('avior', 'Avior', 'epsilon Car', 'Carina', 8.37522, -59.5094, 1.86, 1.28),
  s('alkaid', 'Alkaid', 'eta UMa', 'Ursa Major', 13.79233, 49.3133, 1.86, -0.1),
  s('menkalinan', 'Menkalinan', 'beta Aur', 'Auriga', 5.99214, 44.9475, 1.9, 0.08),
  s('atria', 'Atria', 'alpha TrA', 'Triangulum Australe', 16.81108, -69.0278, 1.91, 1.44),
  s('alhena', 'Alhena', 'gamma Gem', 'Gemini', 6.62853, 16.3992, 1.93, 0.0),
  s('peacock', 'Peacock', 'alpha Pav', 'Pavo', 20.42747, -56.735, 1.94, -0.12),
  s('deltavel', 'Delta Velorum', 'delta Vel', 'Vela', 8.74506, -54.7083, 1.96, 0.04),
  s('mirzam', 'Mirzam', 'beta CMa', 'Canis Major', 6.37833, -17.9558, 1.98, -0.24),
  s('alphard', 'Alphard', 'alpha Hya', 'Hydra', 9.45978, -8.6586, 1.98, 1.44),
  s('polaris', 'Polaris', 'alpha UMi', 'Ursa Minor', 2.53031, 89.2641, 1.98, 0.6),
  s('hamal', 'Hamal', 'alpha Ari', 'Aries', 2.11956, 23.4625, 2.0, 1.15),
  s('diphda', 'Diphda', 'beta Cet', 'Cetus', 0.7265, -17.9867, 2.04, 1.02),
  s('nunki', 'Nunki', 'sigma Sgr', 'Sagittarius', 18.92108, -26.2967, 2.05, -0.13),
  s('menkent', 'Menkent', 'theta Cen', 'Centaurus', 14.11147, -36.3697, 2.06, 1.01),
  s('alpheratz', 'Alpheratz', 'alpha And', 'Andromeda', 0.13981, 29.0906, 2.06, -0.11),
  s('mirach', 'Mirach', 'beta And', 'Andromeda', 1.16219, 35.6206, 2.06, 1.58),
  s('saiph', 'Saiph', 'kappa Ori', 'Orion', 5.79594, -9.6697, 2.07, -0.17),
  s('tiaki', 'Tiaki', 'beta Gru', 'Grus', 22.71111, -46.8844, 2.07, 1.6),
  s('kochab', 'Kochab', 'beta UMi', 'Ursa Minor', 14.84508, 74.1556, 2.08, 1.47),
  s('algieba', 'Algieba', 'gamma Leo', 'Leo', 10.33289, 19.8414, 2.08, 1.13),
  s('rasalhague', 'Rasalhague', 'alpha Oph', 'Ophiuchus', 17.58225, 12.56, 2.08, 0.15),
  s('almach', 'Almach', 'gamma And', 'Andromeda', 2.06497, 42.3297, 2.1, 1.37),
  s('algol', 'Algol', 'beta Per', 'Perseus', 3.13614, 40.9556, 2.12, -0.05),
  s('denebola', 'Denebola', 'beta Leo', 'Leo', 11.81767, 14.5719, 2.14, 0.09),
  s('naos', 'Naos', 'zeta Pup', 'Puppis', 8.05975, -40.0031, 2.21, -0.27),
  s('aspidiske', 'Aspidiske', 'iota Car', 'Carina', 9.28483, -59.2753, 2.21, 0.18),
  s('alphecca', 'Alphecca', 'alpha CrB', 'Corona Borealis', 15.57814, 26.7147, 2.22, -0.02),
  s('muhlifain', 'Muhlifain', 'gamma Cen', 'Centaurus', 12.69194, -48.9597, 2.2, -0.01),
  s('suhail', 'Suhail', 'lambda Vel', 'Vela', 9.13328, -43.4325, 2.23, 1.67),
  s('mizar', 'Mizar', 'zeta UMa', 'Ursa Major', 13.39875, 54.9253, 2.23, 0.06),
  s('mintaka', 'Mintaka', 'delta Ori', 'Orion', 5.53344, -0.2992, 2.23, -0.18),
  s('sadr', 'Sadr', 'gamma Cyg', 'Cygnus', 20.37047, 40.2567, 2.23, 0.68),
  s('eltanin', 'Eltanin', 'gamma Dra', 'Draco', 17.94344, 51.4889, 2.23, 1.52),
  s('schedar', 'Schedar', 'alpha Cas', 'Cassiopeia', 0.67511, 56.5372, 2.24, 1.17),
  s('caph', 'Caph', 'beta Cas', 'Cassiopeia', 0.15297, 59.1497, 2.27, 0.38),
  s('dschubba', 'Dschubba', 'delta Sco', 'Scorpius', 16.00556, -22.6217, 2.29, -0.12),
  s('larawag', 'Larawag', 'epsilon Sco', 'Scorpius', 16.83617, -34.2933, 2.29, 1.14),
  s('epscen', 'Epsilon Centauri', 'epsilon Cen', 'Centaurus', 13.66481, -53.4664, 2.29, -0.22),
  s('etacen', 'Eta Centauri', 'eta Cen', 'Centaurus', 14.59178, -42.1578, 2.31, -0.19),
  s('izar', 'Izar', 'epsilon Boo', 'Bootes', 14.74978, 27.0742, 2.35, 0.97),
  s('merak', 'Merak', 'beta UMa', 'Ursa Major', 11.03069, 56.3825, 2.37, 0.03),
  s('girtab', 'Girtab', 'kappa Sco', 'Scorpius', 17.70814, -39.03, 2.39, -0.18),
  s('enif', 'Enif', 'epsilon Peg', 'Pegasus', 21.73644, 9.875, 2.39, 1.53),
  s('ankaa', 'Ankaa', 'alpha Phe', 'Phoenix', 0.43806, -42.3061, 2.4, 1.09),
  s('scheat', 'Scheat', 'beta Peg', 'Pegasus', 23.06292, 28.0828, 2.42, 1.67),
  s('sabik', 'Sabik', 'eta Oph', 'Ophiuchus', 17.17297, -15.725, 2.43, 0.06),
  s('phecda', 'Phecda', 'gamma UMa', 'Ursa Major', 11.89717, 53.6947, 2.44, 0.04),
  s('aludra', 'Aludra', 'eta CMa', 'Canis Major', 7.40158, -29.3031, 2.45, 0.66),
  s('alderamin', 'Alderamin', 'alpha Cep', 'Cepheus', 21.30967, 62.5856, 2.45, 0.22),
  s('gammacas', 'Navi', 'gamma Cas', 'Cassiopeia', 0.94514, 60.7167, 2.47, -0.15),
  s('gienah', 'Gienah', 'epsilon Cyg', 'Cygnus', 20.77019, 33.9703, 2.48, 1.02),
  s('markab', 'Markab', 'alpha Peg', 'Pegasus', 23.07936, 15.2053, 2.49, -0.04),
  s('menkar', 'Menkar', 'alpha Cet', 'Cetus', 3.038, 4.0897, 2.53, 1.63),
  s('zosma', 'Zosma', 'delta Leo', 'Leo', 11.23514, 20.5236, 2.56, 0.13),
  s('arneb', 'Arneb', 'alpha Lep', 'Lepus', 5.5455, -17.8222, 2.58, 0.21),
  s('gienahcrv', 'Gienah', 'gamma Crv', 'Corvus', 12.26344, -17.5419, 2.58, -0.11),
  s('ascella', 'Ascella', 'zeta Sgr', 'Sagittarius', 19.04353, -29.8803, 2.6, 0.06),
  s('zubeneschamali', 'Zubeneschamali', 'beta Lib', 'Libra', 15.28344, -9.3828, 2.61, -0.07),
  s('unukalhai', 'Unukalhai', 'alpha Ser', 'Serpens', 15.73781, 6.4256, 2.63, 1.17),
  s('sheratan', 'Sheratan', 'beta Ari', 'Aries', 1.91067, 20.8081, 2.64, 0.13),
  s('ruchbah', 'Ruchbah', 'delta Cas', 'Cassiopeia', 1.43028, 60.2353, 2.68, 0.13),
  s('kausmedia', 'Kaus Media', 'delta Sgr', 'Sagittarius', 18.34989, -29.8281, 2.7, 1.38),
  s('porrima', 'Porrima', 'gamma Vir', 'Virgo', 12.69433, -1.4494, 2.74, 0.36),
  s('zubenelgenubi', 'Zubenelgenubi', 'alpha Lib', 'Libra', 14.84797, -16.0417, 2.75, 0.15),
  s('cebalrai', 'Cebalrai', 'beta Oph', 'Ophiuchus', 17.72456, 4.5672, 2.76, 1.16),
  s('kornephoros', 'Kornephoros', 'beta Her', 'Hercules', 16.50367, 21.4897, 2.77, 0.94),
  s('rastaban', 'Rastaban', 'beta Dra', 'Draco', 17.50719, 52.3014, 2.79, 0.95),
  s('deltacru', 'Imai', 'delta Cru', 'Crux', 12.25242, -58.7489, 2.79, -0.19),
  s('kausborealis', 'Kaus Borealis', 'lambda Sgr', 'Sagittarius', 18.46617, -25.4217, 2.81, 1.04),
  s('algenib', 'Algenib', 'gamma Peg', 'Pegasus', 0.22061, 15.1836, 2.83, -0.19),
  s('vindemiatrix', 'Vindemiatrix', 'epsilon Vir', 'Virgo', 13.03628, 10.9592, 2.83, 0.93),
  s('nihal', 'Nihal', 'beta Lep', 'Lepus', 5.47075, -20.7594, 2.84, 0.82),
  s('alcyone', 'Alcyone', 'eta Tau', 'Taurus', 3.79142, 24.105, 2.87, -0.09),
  s('denebalgedi', 'Deneb Algedi', 'delta Cap', 'Capricornus', 21.784, -16.1272, 2.87, 0.29),
  s('deltacyg', 'Fawaris', 'delta Cyg', 'Cygnus', 19.74958, 45.1308, 2.87, -0.04),
  s('acamar', 'Acamar', 'theta Eri', 'Eridanus', 2.97103, -40.3047, 2.88, 0.13),
  s('sadalsuud', 'Sadalsuud', 'beta Aqr', 'Aquarius', 21.52597, -5.5711, 2.9, 0.83),
  s('algorab', 'Algorab', 'delta Crv', 'Corvus', 12.49775, -16.5156, 2.95, -0.05),
  s('sadalmelik', 'Sadalmelik', 'alpha Aqr', 'Aquarius', 22.09639, -0.3197, 2.95, 0.98),
  s('alnasl', 'Alnasl', 'gamma2 Sgr', 'Sagittarius', 18.09681, -30.4242, 2.98, 1.0),
  s('zetatau', 'Tianguan', 'zeta Tau', 'Taurus', 5.62742, 21.1425, 3.0, -0.15),
  s('furud', 'Furud', 'zeta CMa', 'Canis Major', 6.33856, -30.0633, 3.02, -0.19),
  s('albireo', 'Albireo', 'beta Cyg', 'Cygnus', 19.51203, 27.9597, 3.05, 1.09),
  s('dabih', 'Dabih', 'beta Cap', 'Capricornus', 20.35019, -14.7814, 3.05, 0.79),
  s('phisgr', 'Phi Sagittarii', 'phi Sgr', 'Sagittarius', 18.76094, -26.9908, 3.17, -0.11),
  s('megrez', 'Megrez', 'delta UMa', 'Ursa Major', 12.25711, 57.0325, 3.31, 0.08),
  s('tausgr', 'Tau Sagittarii', 'tau Sgr', 'Sagittarius', 19.11567, -27.6706, 3.32, 1.17),
  s('segin', 'Segin', 'epsilon Cas', 'Cassiopeia', 1.90658, 63.6703, 3.35, -0.15),
  s('rasalgethi', 'Rasalgethi', 'alpha Her', 'Hercules', 17.24414, 14.3903, 3.35, 1.44),
  s('thuban', 'Thuban', 'alpha Dra', 'Draco', 14.07314, 64.3758, 3.65, -0.05),
  s('tarazed', 'Tarazed', 'gamma Aql', 'Aquila', 19.771, 10.6133, 2.72, 1.52),
  s('alshain', 'Alshain', 'beta Aql', 'Aquila', 19.92189, 6.4067, 3.71, 0.86),
  s('alcor', 'Alcor', '80 UMa', 'Ursa Major', 13.42042, 54.9881, 3.99, 0.16),
];

export const STARS_BY_ID: Record<string, Star> = Object.fromEntries(
  STARS.map((star) => [star.id, star])
);

/**
 * Stick figures for the constellations whose stars are all in the catalogue.
 * Each entry is a list of polylines referencing star ids.
 */
export const CONSTELLATION_LINES: { name: string; lines: string[][] }[] = [
  {
    name: 'Orion',
    lines: [
      ['betelgeuse', 'bellatrix'],
      ['bellatrix', 'mintaka', 'alnilam', 'alnitak', 'betelgeuse'],
      ['mintaka', 'rigel'],
      ['alnitak', 'saiph'],
      ['saiph', 'rigel'],
    ],
  },
  {
    name: 'Ursa Major',
    lines: [['dubhe', 'merak', 'phecda', 'megrez', 'alioth', 'mizar', 'alkaid'], ['megrez', 'dubhe']],
  },
  {
    name: 'Cassiopeia',
    lines: [['caph', 'schedar', 'gammacas', 'ruchbah', 'segin']],
  },
  {
    name: 'Cygnus',
    lines: [
      ['deneb', 'sadr', 'albireo'],
      ['gienah', 'sadr', 'deltacyg'],
    ],
  },
  {
    name: 'Crux',
    lines: [
      ['acrux', 'gacrux'],
      ['mimosa', 'deltacru'],
    ],
  },
  {
    name: 'Canis Major',
    lines: [
      ['mirzam', 'sirius', 'wezen', 'aludra'],
      ['wezen', 'adhara', 'furud'],
    ],
  },
  {
    name: 'Leo',
    lines: [['regulus', 'algieba', 'zosma', 'denebola'], ['denebola', 'regulus']],
  },
  {
    name: 'Scorpius',
    lines: [['dschubba', 'antares', 'larawag', 'sargas', 'girtab', 'shaula']],
  },
  {
    name: 'Gemini',
    lines: [['castor', 'pollux', 'alhena']],
  },
  {
    name: 'Pegasus',
    lines: [['markab', 'scheat', 'alpheratz', 'algenib', 'markab'], ['markab', 'enif']],
  },
  {
    name: 'Sagittarius',
    lines: [
      ['alnasl', 'kausmedia', 'kausaustralis', 'ascella', 'tausgr', 'nunki', 'phisgr', 'kausmedia'],
      ['kausmedia', 'kausborealis', 'phisgr'],
    ],
  },
  {
    name: 'Aquila',
    lines: [['tarazed', 'altair', 'alshain']],
  },
  {
    name: 'Ursa Minor',
    lines: [['polaris', 'kochab']],
  },
  {
    name: 'Andromeda',
    lines: [['alpheratz', 'mirach', 'almach']],
  },
];

/**
 * Approximate RGB tint for a B-V colour index, so hot stars read blue-white
 * and cool ones orange. Deliberately desaturated — real stars barely show
 * colour to the eye.
 */
export function starColor(bv: number): string {
  const clamped = Math.max(-0.4, Math.min(2.0, bv));
  if (clamped < 0.0) return '#aac6ff';
  if (clamped < 0.3) return '#cfe0ff';
  if (clamped < 0.6) return '#ffffff';
  if (clamped < 0.9) return '#fff4e0';
  if (clamped < 1.4) return '#ffd9a8';
  return '#ffb98a';
}
