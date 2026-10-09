import { AttackItem, EquipmentItem } from '../types/rpg';

export interface LibraryWeapon {
  id: string;
  name: string;
  damage: string;
  type: string;
  props: string[];
  ability: 'STR' | 'DEX';
  range: 'Melee' | 'Ranged';
  weight: number;
}

export interface LibraryArmor {
  id: string;
  name: string;
  base: number;
  dexCap: number | null;
  type: 'leve' | 'media' | 'pesada' | 'nenhuma';
  weight: number;
  forMin?: number;
  stealthDis?: boolean;
}

export const LIBRARY_WEAPONS: LibraryWeapon[] = [
  { id: 'clava', name: 'Clava', damage: '1d6', type: 'contundente', props: ['leve'], ability: 'STR', range: 'Melee', weight: 1 },
  { id: 'adaga', name: 'Adaga', damage: '1d4', type: 'perfurante', props: ['acuidade', 'leve', 'arremesso'], ability: 'DEX', range: 'Melee', weight: 0.5 },
  { id: 'grande-clava', name: 'Grande Clava', damage: '1d8', type: 'contundente', props: ['duas mãos'], ability: 'STR', range: 'Melee', weight: 5 },
  { id: 'machadinha', name: 'Machadinha', damage: '1d6', type: 'cortante', props: ['leve', 'arremesso'], ability: 'STR', range: 'Melee', weight: 1 },
  { id: 'dardo', name: 'Dardo', damage: '1d4', type: 'perfurante', props: ['acuidade', 'arremesso'], ability: 'DEX', range: 'Ranged', weight: 0.5 },
  { id: 'azagaia', name: 'Azagaia', damage: '1d6', type: 'perfurante', props: ['arremesso'], ability: 'STR', range: 'Ranged', weight: 1 },
  { id: 'maca', name: 'Maça', damage: '1d6', type: 'contundente', props: [], ability: 'STR', range: 'Melee', weight: 2 },
  { id: 'bordao', name: 'Bordão', damage: '1d6', type: 'contundente', props: ['versátil'], ability: 'STR', range: 'Melee', weight: 2 },
  { id: 'foice', name: 'Foice', damage: '1d4', type: 'cortante', props: ['leve'], ability: 'STR', range: 'Melee', weight: 1 },
  { id: 'funda', name: 'Funda', damage: '1d4', type: 'contundente', props: [], ability: 'DEX', range: 'Ranged', weight: 0.5 },
  { id: 'martelo-leve', name: 'Martelo Leve', damage: '1d4', type: 'contundente', props: ['leve', 'arremesso'], ability: 'STR', range: 'Melee', weight: 1 },
  { id: 'machado-batalha', name: 'Machado de Batalha', damage: '1d8', type: 'cortante', props: ['versátil'], ability: 'STR', range: 'Melee', weight: 2 },
  { id: 'mangual', name: 'Mangual', damage: '1d8', type: 'contundente', props: [], ability: 'STR', range: 'Melee', weight: 2.5 },
  { id: 'rapieira', name: 'Rapieira', damage: '1d8', type: 'perfurante', props: ['acuidade'], ability: 'DEX', range: 'Melee', weight: 1 },
  { id: 'cimitarra', name: 'Cimitarra', damage: '1d6', type: 'cortante', props: ['acuidade', 'leve'], ability: 'DEX', range: 'Melee', weight: 1.5 },
  { id: 'espada-curta', name: 'Espada Curta', damage: '1d6', type: 'perfurante', props: ['acuidade', 'leve'], ability: 'DEX', range: 'Melee', weight: 1 },
  { id: 'machado-guerra', name: 'Machado de Guerra', damage: '1d12', type: 'cortante', props: ['pesada', 'versátil'], ability: 'STR', range: 'Melee', weight: 3.5 },
  { id: 'espada-longa', name: 'Espada Longa', damage: '1d8', type: 'cortante', props: ['versátil'], ability: 'STR', range: 'Melee', weight: 1.5 },
  { id: 'martelo-guerra', name: 'Martelo de Guerra', damage: '1d8', type: 'contundente', props: ['versátil'], ability: 'STR', range: 'Melee', weight: 2 },
  { id: 'picareta-guerra', name: 'Picareta de Guerra', damage: '1d8', type: 'perfurante', props: [], ability: 'STR', range: 'Melee', weight: 1.5 },
  { id: 'alabarda', name: 'Alabarda', damage: '1d10', type: 'cortante', props: ['pesada', 'alcance', 'duas mãos'], ability: 'STR', range: 'Melee', weight: 3 },
  { id: 'lanca', name: 'Lança', damage: '1d6', type: 'perfurante', props: ['arremesso', 'versátil'], ability: 'STR', range: 'Melee', weight: 1.5 },
  { id: 'espada-grande', name: 'Espada Grande', damage: '2d6', type: 'cortante', props: ['pesada', 'duas mãos'], ability: 'STR', range: 'Melee', weight: 3.5 },
  { id: 'malho', name: 'Malho', damage: '2d6', type: 'contundente', props: ['pesada', 'duas mãos'], ability: 'STR', range: 'Melee', weight: 5 },
  { id: 'montante', name: 'Montante', damage: '1d10', type: 'cortante', props: ['pesada', 'alcance', 'duas mãos'], ability: 'STR', range: 'Melee', weight: 4 },
  { id: 'chicote', name: 'Chicote', damage: '1d4', type: 'cortante', props: ['acuidade', 'alcance'], ability: 'DEX', range: 'Melee', weight: 1.5 },
  { id: 'arco-curto', name: 'Arco Curto', damage: '1d6', type: 'perfurante', props: ['duas mãos'], ability: 'DEX', range: 'Ranged', weight: 1 },
  { id: 'besta-leve', name: 'Besta Leve', damage: '1d8', type: 'perfurante', props: ['munição', 'duas mãos'], ability: 'DEX', range: 'Ranged', weight: 2.5 },
  { id: 'arco-longo', name: 'Arco Longo', damage: '1d8', type: 'perfurante', props: ['pesada', 'duas mãos'], ability: 'DEX', range: 'Ranged', weight: 1.5 },
  { id: 'besta-mao', name: 'Besta de Mão', damage: '1d6', type: 'perfurante', props: ['munição', 'leve'], ability: 'DEX', range: 'Ranged', weight: 1.5 },
  { id: 'besta-pesada', name: 'Besta Pesada', damage: '1d10', type: 'perfurante', props: ['pesada', 'duas mãos'], ability: 'DEX', range: 'Ranged', weight: 9 },
  { id: 'glaive', name: 'Glaive', damage: '1d10', type: 'cortante', props: ['pesada', 'alcance', 'duas mãos'], ability: 'STR', range: 'Melee', weight: 3 },
  { id: 'pistola', name: 'Pistola', damage: '1d10', type: 'perfurante', props: ['munição'], ability: 'DEX', range: 'Ranged', weight: 1 },
  { id: 'mosquete', name: 'Mosquete', damage: '1d12', type: 'perfurante', props: ['munição', 'pesada', 'duas mãos'], ability: 'DEX', range: 'Ranged', weight: 2.5 },
  { id: 'rede', name: 'Rede', damage: '0', type: 'especial', props: ['arremesso'], ability: 'DEX', range: 'Ranged', weight: 1.5 },
  { id: 'ataque-desarmado', name: 'Ataque Desarmado', damage: '1 + FOR', type: 'contundente', props: ['natural'], ability: 'STR', range: 'Melee', weight: 0 },
];

export const LIBRARY_ARMOR: LibraryArmor[] = [
  { id: 'acolchoada', name: 'Armadura acolchoada', base: 11, dexCap: null, type: 'leve', weight: 4 },
  { id: 'couro', name: 'Armadura de couro', base: 11, dexCap: null, type: 'leve', weight: 5 },
  { id: 'couro-batido', name: 'Couro batido', base: 12, dexCap: null, type: 'leve', weight: 6 },
  { id: 'gibao-peles', name: 'Gibão de peles', base: 12, dexCap: 2, type: 'media', weight: 6 },
  { id: 'camisa-malha', name: 'Camisa de malha', base: 13, dexCap: 2, type: 'media', weight: 9 },
  { id: 'cota-escamas', name: 'Cota de escamas', base: 14, dexCap: 2, type: 'media', weight: 20 },
  { id: 'cota-peitoral', name: 'Cota peitoral', base: 14, dexCap: 2, type: 'media', weight: 9 },
  { id: 'meia-armadura', name: 'Meia-armadura', base: 15, dexCap: 2, type: 'media', weight: 18 },
  { id: 'cota-aneis', name: 'Cota de anéis', base: 14, dexCap: 0, type: 'pesada', weight: 18, forMin: 13, stealthDis: true },
  { id: 'cota-malha', name: 'Cota de malha', base: 16, dexCap: 0, type: 'pesada', weight: 25, forMin: 13, stealthDis: true },
  { id: 'armadura-placas', name: 'Armadura de placas', base: 18, dexCap: 0, type: 'pesada', weight: 30, forMin: 15, stealthDis: true },
];

export const LIBRARY_SHIELD = {
  id: 'escudo',
  name: 'Escudo',
  ac: 2,
  weight: 3,
};

export const EQUIPMENT_THEMES: Record<
  string,
  { label: string; material: string; damage: string }
> = {
  havendor: { label: 'Forja Radiante', material: 'luz divina', damage: 'radiante' },
  aurivelle: { label: 'Madeira Encantada', material: 'madeira viva e cordas', damage: 'psíquico' },
  selah: { label: 'Fluxo', material: 'fibras naturais e energia', damage: 'força' },
  ringendah: { label: 'Arsenal Arcano', material: 'runas e portais', damage: 'energia' },
  knathi: { label: 'Tinta Viva', material: 'seiva e tinta', damage: 'perfurante' },
  lumivior: { label: 'Éter Tecnológico', material: 'metal e circuitos', damage: 'elétrico' },
  neruviah: { label: 'Coral das Marés', material: 'coral e água cristalizada', damage: 'gelo' },
  argolis: { label: 'Aço Tático', material: 'aço e mecanismos', damage: 'cortante' },
  sphalidor: { label: 'Aço Ressonante', material: 'cristal e metal vibrante', damage: 'sônico' },
};

const PT_TYPE_TO_EN: Record<string, string> = {
  contundente: 'Bludgeoning',
  cortante: 'Slashing',
  perfurante: 'Piercing',
  especial: '',
};

function cap(s: string): string {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : '';
}

export function libraryWeaponToEquipment(w: LibraryWeapon): EquipmentItem {
  const id = `eq-lib-${w.id}`;
  const atk: AttackItem = {
    id: `atk-eq-lib-${w.id}`,
    name: w.name,
    type: w.range === 'Ranged' ? 'Ranged' : 'Melee',
    range: w.range === 'Ranged' ? '80/320 ft.' : '5 ft.',
    ability: w.ability,
    bonus: 0,
    proficiency: 'Proficient',
    damage1: {
      dice: w.damage === '1 + FOR' ? '1' : w.damage,
      ability: w.damage === '1 + FOR' ? 'STR' : 'None',
      type: (PT_TYPE_TO_EN[w.type] || '') as EquipmentItem['attacks'][number]['damage1']['type'],
    },
    description: w.props.join(', '),
    sourceEquipmentId: id,
  };
  return {
    id,
    name: w.name,
    type: 'Weapon',
    equipped: true,
    quantity: 1,
    unitWeight: w.weight,
    rangeType: w.range,
    weaponCategory: 'Simple',
    weaponType: w.name,
    requiresAttunement: false,
    attuned: false,
    description: w.props.join(', '),
    source: { type: 'Custom', name: 'Biblioteca SRD' },
    attacks: [atk],
  };
}

export function libraryArmorToEquipment(a: LibraryArmor): EquipmentItem {
  return {
    id: `eq-lib-${a.id}`,
    name: a.name,
    type: 'Armor',
    equipped: true,
    quantity: 1,
    unitWeight: a.weight,
    requiresAttunement: false,
    attuned: false,
    armorAcBonus: a.base,
    description: [
      `Base ${a.base} CA`,
      a.dexCap === null ? 'DEX ilimitada' : `DEX máx ${a.dexCap}`,
      a.forMin ? `Requer FOR ${a.forMin}` : '',
      a.stealthDis ? 'Desvantagem em Furtividade' : '',
    ]
      .filter(Boolean)
      .join(' · '),
    source: { type: 'Custom', name: 'Biblioteca SRD' },
    attacks: [],
  };
}

export function libraryShieldToEquipment(): EquipmentItem {
  return {
    id: `eq-lib-${LIBRARY_SHIELD.id}`,
    name: LIBRARY_SHIELD.name,
    type: 'Shield',
    equipped: true,
    quantity: 1,
    unitWeight: LIBRARY_SHIELD.weight,
    requiresAttunement: false,
    attuned: false,
    armorAcBonus: LIBRARY_SHIELD.ac,
    description: `+${LIBRARY_SHIELD.ac} CA`,
    source: { type: 'Custom', name: 'Biblioteca SRD' },
    attacks: [],
  };
}

export function equipmentStatsLabel(eq: EquipmentItem): string {
  if (eq.type === 'Weapon') {
    const atk = eq.attacks[0];
    return atk
      ? `${eq.name} — ${atk.damage1.dice} ${atk.damage1.type} (${atk.ability})`
      : eq.name;
  }
  if (eq.type === 'Armor') return `${eq.name} — Base ${eq.armorAcBonus} CA`;
  if (eq.type === 'Shield') return `${eq.name} — +${eq.armorAcBonus} CA`;
  return eq.name;
}

export function weaponLibraryBlurb(w: LibraryWeapon): string {
  const typePt = cap(w.type).replace(/^Especial$/, '');
  return `${w.damage} ${typePt} · ${w.props.length ? w.props.join(', ') : '—'}`;
}

export function armorLibraryBlurb(a: LibraryArmor): string {
  return `Base ${a.base} CA · ${a.dexCap === null ? 'DEX ilimitada' : 'DEX máx ' + a.dexCap}${
    a.forMin ? ' · FOR ' + a.forMin : ''
  }`;
}