import type {
  AOEShape,
  DamageType,
  SpellItem,
  SpellSchool,
} from '../types/rpg';
import spellsData from './dnd_spells_enriched.json';

export interface SpellStats {
  attackType: string;
  saveAbility: string;
  saveNote: string;
  target: string;
  aoeShape: string;
  aoeSize: string;
  damageByLevel: Record<string, { dice: string; type: string }>;
  healByLevel: Record<string, string> | null;
}

export interface LibrarySpell {
  name: string;
  level: number;
  school: string;
  classes: string[];
  actionType: string;
  concentration: boolean;
  ritual: boolean;
  range: string;
  components: string[];
  material?: string;
  duration: string;
  description: string;
  higherLevelSlot?: string;
  stats: SpellStats | null;
}

const SCHOOL_MAP: Record<string, SpellSchool> = {
  abjuration: 'Abjuration',
  conjuration: 'Conjuration',
  divination: 'Divination',
  enchantment: 'Enchantment',
  evocation: 'Evocation',
  illusion: 'Illusion',
  necromancy: 'Necromancy',
  transmutation: 'Transmutation',
};

const CASTING_TIME_MAP: Record<string, string> = {
  action: 'Action',
  bonusAction: 'Bonus Action',
  reaction: 'Reaction',
};

const AOE_SHAPE_MAP: Record<string, AOEShape> = {
  Sphere: 'Sphere',
  Cone: 'Cone',
  Cube: 'Cube',
  Cylinder: 'Cylinder',
  Line: 'Line',
  Wall: 'Wall',
  Hemisphere: 'Hemisphere',
  Circle: 'Circle',
  Square: 'Square',
  Emanation: 'Emanation',
};

export const SPELLS_LIBRARY: LibrarySpell[] = spellsData as LibrarySpell[];

export function librarySpellSlug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

export function librarySpellId(entry: LibrarySpell): string {
  return `spell-lib-${librarySpellSlug(entry.name)}`;
}

function cap(s: string): string {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : '';
}

export function librarySpellToSpellItem(entry: LibrarySpell): SpellItem {
  const school = SCHOOL_MAP[entry.school] ?? 'Evocation';
  const castingTime = CASTING_TIME_MAP[entry.actionType] ?? 'Action';
  const stats = entry.stats;

  const damageKeys =
    stats && Object.keys(stats.damageByLevel).map(Number).filter((n) => !Number.isNaN(n));
  const baseKey = damageKeys && damageKeys.length ? String(Math.min(...damageKeys)) : null;
  const baseDamage = baseKey ? stats?.damageByLevel[baseKey] : undefined;
  const aoeShape = stats ? (AOE_SHAPE_MAP[stats.aoeShape as keyof typeof AOE_SHAPE_MAP] ?? '(None)') : '(None)';

  const hasAttack = !!stats?.attackType;
  const hasSave = !!stats?.saveAbility;
  const hasHeal = !!stats?.healByLevel;

  return {
    id: librarySpellId(entry),
    name: entry.name,
    level: entry.level,
    school,
    range: entry.range,
    castingTime,
    spellcastingAbility: 'INT',
    target: stats?.target ?? '',
    duration: entry.duration,
    aoeSize: stats && stats.aoeSize ? `${stats.aoeSize} ft` : '',
    aoeShape,
    components: {
      v: entry.components.includes('v'),
      s: entry.components.includes('s'),
      m: entry.components.includes('m'),
    },
    ritual: entry.ritual,
    concentration: entry.concentration,
    alwaysPrepared: false,
    activeToggle: true,
    hasAttack,
    hasSave,
    hasHeal,
    damageOnly: false,
    attackAbility: 'INT',
    attackBonus: 0,
    attackProficiency: 'Proficient',
    saveAbility: (stats?.saveAbility || 'DEX') as SpellItem['saveAbility'],
    dcModifier: 0,
    healDice: hasHeal && stats?.healByLevel
      ? stats.healByLevel[Math.min(...Object.keys(stats.healByLevel).map(Number))]
      : '',
    healAbility: 'None',
    damage1: {
      dice: baseDamage?.dice ?? '',
      ability: 'None',
      type: (baseDamage ? cap(baseDamage.type) : '') as DamageType | '',
    },
    manaCost: entry.level > 0 ? entry.level * 5 : 0,
    heatGenerated: entry.level,
    description: entry.description,
    source: { type: 'Custom', name: 'Biblioteca SRD' },
  };
}

export function spellDamageBlurb(entry: LibrarySpell): string {
  const stats = entry.stats;
  if (!stats) return '';
  const parts: string[] = [];
  if (stats.attackType) parts.push(`Ataque ${stats.attackType.toLowerCase()}`);
  if (stats.saveAbility) parts.push(`Save ${stats.saveAbility}`);
  const damageKeys = Object.keys(stats.damageByLevel).map(Number).filter((n) => !Number.isNaN(n));
  if (damageKeys.length) {
    const base = stats.damageByLevel[String(Math.min(...damageKeys))];
    if (base?.dice) parts.push(`${base.dice} ${cap(base.type)}`);
  }
  if (stats.healByLevel) parts.push(`Cura ${stats.healByLevel[String(Math.min(...Object.keys(stats.healByLevel).map(Number)))]}`);
  if (stats.aoeShape && stats.aoeSize) parts.push(`${stats.aoeSize} ft ${stats.aoeShape.toLowerCase()}`);
  return parts.join(' · ');
}