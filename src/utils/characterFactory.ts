import {
  INITIAL_ELARA_CHARACTER,
  COMPENDIUM_CLASSES,
} from '../data/compendium';
import {
  LIBRARY_ARMOR,
  LIBRARY_SHIELD,
  LIBRARY_WEAPONS,
  libraryArmorToEquipment,
  libraryShieldToEquipment,
  libraryWeaponToEquipment,
} from '../data/equipmentLibrary';
import { ABILITY_KEYS, SKILLS_LIST } from '../data/constants';
import { getArchetypeById, resolveArchetypeBase } from '../data/archetypes';
import { AbilityKey, CharacterSheetState, SkillState } from '../types/rpg';
import {
  computeAbilities,
  computeVitals,
  synchronizeOrigins,
} from './calculations';

export const CREATION_HEAT_MULTIPLIER: Record<string, number> = {
  lamina_arcana: 4,
  guardiao_vanguarda: 3,
};

export const ABILITY_PRESETS: {
  id: string;
  label: string;
  desc: string;
  scores: Record<AbilityKey, number>;
}[] = [
  {
    id: 'agil_precisa',
    label: 'Ágil & Precisa',
    desc: 'Foco em DEX e INT — ideal para Arcanista e perícias.',
    scores: { STR: 8, DEX: 15, CON: 12, INT: 14, WIS: 10, CHA: 13 },
  },
  {
    id: 'arcano_sabia',
    label: 'Arcano & Sábia',
    desc: 'Foco em INT e WIS — conjuradora estudiosa e atenta.',
    scores: { STR: 8, DEX: 12, CON: 10, INT: 15, WIS: 14, CHA: 13 },
  },
  {
    id: 'baluarte',
    label: 'Baluarte',
    desc: 'Foco em STR e CON — para Guerreiros e vanguardas.',
    scores: { STR: 15, DEX: 10, CON: 14, INT: 8, WIS: 13, CHA: 12 },
  },
];

const STANDARD_POOL = 72;

export function abilityPresetSum(
  scores: Record<AbilityKey, number>
): number {
  return ABILITY_KEYS.reduce((a, k) => a + scores[k], 0);
}

export const DEFAULT_LEVEL = 1;

function blankSkills(): Record<string, SkillState> {
  const record: Record<string, SkillState> = {};
  for (const def of SKILLS_LIST) {
    record[def.id] = {
      proficiency: 'None',
      source: { type: 'Custom', name: 'Base' },
    };
  }
  return record;
}

export interface CreationOptions {
  name: string;
  realmId: string;
  classId: string;
  speciesId: string;
  abilityScores: Record<AbilityKey, number>;
  equipmentIds: string[];
}

export function recommendedEquipmentForClass(
  classId: string
): string[] {
  if (classId === 'lamina_arcana' || classId === 'arcanista') {
    return ['rapieira', 'arco-curto', 'couro'];
  }
  if (classId === 'vigilante') {
    return ['rapieira', 'arco-curto', 'couro'];
  }
  if (classId === 'creator') {
    return ['rapieira', 'couro'];
  }
  return ['espada-longa', 'cota-escamas', 'escudo'];
}

export function libraryItemToEquipment(
  id: string
): CharacterSheetState['equipment'][number] | null {
  if (id === LIBRARY_SHIELD.id) return libraryShieldToEquipment();
  const weapon = LIBRARY_WEAPONS.find((w) => w.id === id);
  if (weapon) return libraryWeaponToEquipment(weapon);
  const armor = LIBRARY_ARMOR.find((a) => a.id === id);
  if (armor) return libraryArmorToEquipment(armor);
  return null;
}

export function buildCharacterSheet(
  opts: CreationOptions
): CharacterSheetState {
  const base: CharacterSheetState = JSON.parse(
    JSON.stringify(INITIAL_ELARA_CHARACTER)
  ) as CharacterSheetState;

  const cls = COMPENDIUM_CLASSES.find((c) => c.id === opts.classId);

  const equipment: CharacterSheetState['equipment'] = [];
  for (const eid of opts.equipmentIds) {
    const eq = libraryItemToEquipment(eid);
    if (eq) equipment.push(eq);
  }

  const abilities = {} as Record<AbilityKey, CharacterSheetState['abilities'][AbilityKey]>;
  for (const key of ABILITY_KEYS) {
    abilities[key] = {
      baseScore: opts.abilityScores[key] ?? 8,
      saveProficiency: 'None',
    };
  }

  let sheet: CharacterSheetState = {
    ...base,
    id: `char-${Date.now()}`,
    name: opts.name.trim().toUpperCase() || 'NOVA FICHA',
    level: DEFAULT_LEVEL,
    speciesId: opts.speciesId,
    realmId: opts.realmId,
    classId: opts.classId,
    backgroundId: '',
    featIds: [],
    inspiration: false,
    hpCurrent: 1,
    hpMaxBase: 1,
    hpTemp: 0,
    hpMaxBonusTemp: 0,
    hpMaxBonusTurns: 0,
    hpMaxPenaltyNecrotic: 0,
    acBase: 10,
    speedBase: 30,
    initiativeBonusManual: 0,
    manaCurrent: 0,
    manaMax: 0,
    heatCurrent: 0,
    heatMax: 0,
    spellSaveDcBase: 8,
    resistances: '',
    vulnerabilities: '',
    immunities: '',
    conditionImmunities: '',
    activeConditions: [],
    darkvisionFt: 0,
    abilities,
    skills: {
      ...blankSkills(),
    },
    standaloneAttacks: [],
    weaponMasteries: [],
    combatEffects: [],
    combatActions: [
      {
        id: 'ca-attack',
        category: 'Actions',
        name: 'Attack',
        details:
          'Faça um ataque com uma arma equipada ou um ataque desarmado.',
        source: { type: 'Custom', name: 'Regras de Combate' },
      },
      {
        id: 'ca-opportunity-attack',
        category: 'Reactions',
        name: 'Opportunity Attack',
        details:
          'Você pode fazer uma jogada de ataque corpo a corpo contra a criatura que sair do seu alcance.',
        trigger: 'Criatura hostil sai do seu alcance sem usar Disengage.',
        effect: '1 ataque corpo a corpo com arma equipada.',
        requirements: 'Reação disponível.',
        source: { type: 'Custom', name: 'Regras de Combate' },
      },
    ],
    spells: [],
    currency: { copper: 0, silver: 0, electrum: 0, gold: 0, platinum: 0 },
    equipment,
    otherPossessions: [],
    features: [],
    noteCategories: base.noteCategories.map((c) => ({
      ...c,
      entries: [],
    })),
    backgrounds: [],
    characteristics: [],
    appearances: [],
    proficiencies: [],
  };

  sheet = synchronizeOrigins(sheet, {
    speciesId: opts.speciesId,
    realmId: opts.realmId,
    classId: opts.classId,
    backgroundId: '',
    level: DEFAULT_LEVEL,
    featIds: [],
  });

  if (cls) {
    const levelBlock = cls.featuresByLevel.find(
      (fb) => fb.level <= DEFAULT_LEVEL
    );
    if (levelBlock) {
      sheet.combatActions = [
        ...sheet.combatActions,
        ...(levelBlock.combatActions || []).map((ca, idx) => ({
          ...ca,
          id: `auto-ca-${cls.id}-${idx}`,
        })),
      ];
      sheet.combatEffects = [
        ...sheet.combatEffects,
        ...(levelBlock.combatEffects || []).map((ce, idx) => ({
          ...ce,
          id: `auto-eff-${cls.id}-${idx}`,
        })),
      ];
    }
  }

  const computedAbilities = computeAbilities(sheet);
  const computed = computeVitals(sheet, computedAbilities);

  const conMod = computedAbilities.CON.modifier;
  const hitDie = cls?.hitDie ?? 10;
  const maxHP = hitDie + conMod;
  sheet.hpMaxBase = maxHP;
  sheet.hpCurrent = computed.effectiveMaxHP;

  const intMod = computedAbilities.INT.modifier;
  sheet.manaMax = cls?.manaBase
    ? Math.max(1, DEFAULT_LEVEL + intMod) * cls.manaBase
    : 0;
  sheet.manaCurrent = sheet.manaMax;

  const baseArchetype = getArchetypeById(resolveArchetypeBase(opts.classId));
  const multiplier =
    baseArchetype?.calorMultiplier ??
    CREATION_HEAT_MULTIPLIER[opts.classId] ??
    3;
  const primaryMods = (cls?.primaryAbilities || ['DEX', 'INT']).map(
    (k) => computedAbilities[k as AbilityKey]?.modifier ?? 0
  );
  const bestPrimaryMod = Math.max(...primaryMods, 0);
  sheet.heatMax = multiplier * bestPrimaryMod + DEFAULT_LEVEL;

  sheet.acBase = 10 + computedAbilities.DEX.modifier;

  return sheet;
}

export function realmGroupLabel(group?: 'fruto' | 'caos'): string {
  return group === 'caos' ? 'Reino do Caos' : 'Reino Fruto';
}