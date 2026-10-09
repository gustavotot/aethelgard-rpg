const FRUTO_NAMES = [
  'Kalen',
  'Ilyas',
  'Seraphine',
  'Aldric',
  'Maelys',
  'Thalion',
  'Ysara',
  'Corvin',
  'Lirael',
  'Elias',
  'Rowan',
  'Selene',
  'Dorian',
  'Ambre',
  'Kael',
  'Isolde',
  'Wren',
  'Casimir',
  'Vesper',
  'Elowen',
  'Marek',
  'Soren',
  'Nyra',
  'Thorne',
  'Alaric',
  'Branna',
  'Cedric',
  'Mirabel',
  'Gareth',
  'Lucian',
];

const CAOS_NAMES = [
  'Morvath',
  'Zakar',
  'Vhaez',
  'Khorin',
  'Savra',
  'Draven',
  'Nyx',
  'Oberon',
  'Bellatrix',
  'Ravana',
  'Sable',
  'Kain',
  'Morrigan',
  'Thrace',
  'Vex',
  'Erebos',
  'Milo',
  'Ashen',
  'Rook',
  'Serai',
  'Grimm',
  'Vael',
  'Nox',
  'Zephyra',
  'Marrow',
  'Syrin',
  'Onyx',
  'Vadim',
  'Corvus',
  'Shade',
];

export function randomCharacterName(realmGroup?: 'fruto' | 'caos'): string {
  const pool =
    realmGroup === 'caos'
      ? CAOS_NAMES
      : realmGroup === 'fruto'
        ? FRUTO_NAMES
        : Math.random() < 0.3
          ? CAOS_NAMES
          : FRUTO_NAMES;
  return pool[Math.floor(Math.random() * pool.length)];
}