import {
  COMPENDIUM_BACKGROUNDS,
  COMPENDIUM_CLASSES,
  COMPENDIUM_FEATS,
  COMPENDIUM_REALMS,
  COMPENDIUM_SPECIES,
} from '../data/compendium';
import { getRealmArchetype, resolveArchetypeBase } from '../data/archetypes';
import { ABILITY_KEYS, SKILLS_LIST } from '../data/constants';
import {
  AbilityKey,
  AbilitySelection,
  AttackItem,
  CharacterSheetState,
  CombatActionItem,
  DamageComponent,
  ProficiencyLevel,
  RollLogEntry,
  RollMode,
  SpellItem,
  StatModifier,
} from '../types/rpg';

export function formatSigned(val: number): string {
  return val >= 0 ? `+${val}` : `${val}`;
}

export function getProficiencyBonus(level: number): number {
  const clamped = Math.max(1, Math.min(20, level || 1));
  return Math.ceil(clamped / 4) + 1;
}

export function getProficiencyBonusValue(
  level: number,
  profLevel: ProficiencyLevel
): number {
  const pb = getProficiencyBonus(level);
  switch (profLevel) {
    case 'None':
      return 0;
    case 'Half Proficiency':
      return Math.floor(pb / 2);
    case 'Proficient':
      return pb;
    case 'Expertise':
      return pb * 2;
    default:
      return 0;
  }
}

export function getActiveModifiers(sheet: CharacterSheetState): StatModifier[] {
  const mods: StatModifier[] = [];

  // 1. Species modifiers
  const species = COMPENDIUM_SPECIES.find((s) => s.id === sheet.speciesId);
  if (species) {
    mods.push(...species.modifiers);
  }

  // 2. Realm modifiers
  const realm = COMPENDIUM_REALMS.find((r) => r.id === sheet.realmId);
  if (realm) {
    mods.push(...realm.modifiers);
  }

  // 3. Feats modifiers
  for (const featId of sheet.featIds) {
    const feat = COMPENDIUM_FEATS.find((f) => f.id === featId);
    if (feat) {
      mods.push(...feat.modifiers);
    }
  }

  // 4. Active Combat Effects
  for (const eff of sheet.combatEffects) {
    if (eff.active && eff.modifiers) {
      mods.push(...eff.modifiers);
    }
  }

  // 5. Features with Advanced Modifiers
  for (const feat of sheet.features) {
    if (feat.advanced?.modifiers?.length) {
      mods.push(...feat.advanced.modifiers);
    }
  }

  return mods;
}

export interface ComputedAbility {
  key: AbilityKey;
  baseScore: number;
  bonusScore: number;
  totalScore: number;
  modifier: number;
  saveProficiency: ProficiencyLevel;
  saveBonus: number;
  sources: StatModifier[];
}

export function computeAbilities(
  sheet: CharacterSheetState
): Record<AbilityKey, ComputedAbility> {
  const allMods = getActiveModifiers(sheet);
  const result = {} as Record<AbilityKey, ComputedAbility>;

  for (const key of ABILITY_KEYS) {
    const state = sheet.abilities[key] || { baseScore: 10, saveProficiency: 'None' };
    const abilityMods = allMods.filter(
      (m) => m.target === 'AbilityScore' && m.subTarget === key
    );
    const bonusScore = abilityMods.reduce((acc, m) => acc + m.value, 0);
    const totalScore = state.baseScore + bonusScore;
    const modifier = Math.floor((totalScore - 10) / 2);

    const saveMods = allMods.filter(
      (m) =>
        m.target === 'SavingThrow' &&
        (m.subTarget === key || m.subTarget === 'All' || !m.subTarget)
    );
    const saveExtra = saveMods.reduce((acc, m) => acc + m.value, 0);
    const profVal = getProficiencyBonusValue(sheet.level, state.saveProficiency);
    const saveBonus = modifier + profVal + saveExtra;

    result[key] = {
      key,
      baseScore: state.baseScore,
      bonusScore,
      totalScore,
      modifier,
      saveProficiency: state.saveProficiency,
      saveBonus,
      sources: [...abilityMods, ...saveMods],
    };
  }

  return result;
}

export function getAbilityModValue(
  ability: AbilitySelection,
  abilities: Record<AbilityKey, ComputedAbility>
): number {
  if (!ability || ability === 'None') return 0;
  return abilities[ability]?.modifier ?? 0;
}

export interface ComputedSkill {
  id: string;
  name: string;
  ability: AbilityKey;
  proficiency: ProficiencyLevel;
  abilityMod: number;
  profBonus: number;
  extraBonus: number;
  totalBonus: number;
  passiveScore: number;
  sourceName: string;
  modifiers: StatModifier[];
}

export function computeSkills(
  sheet: CharacterSheetState,
  abilities: Record<AbilityKey, ComputedAbility>
): Record<string, ComputedSkill> {
  const allMods = getActiveModifiers(sheet);
  const out: Record<string, ComputedSkill> = {};

  for (const def of SKILLS_LIST) {
    const st = sheet.skills[def.id] || {
      proficiency: 'None',
      source: { type: 'Custom', name: 'Base' },
    };
    const abilityMod = abilities[def.ability]?.modifier ?? 0;
    const profBonus = getProficiencyBonusValue(sheet.level, st.proficiency);
    const skillMods = allMods.filter(
      (m) =>
        m.target === 'Skill' &&
        (m.subTarget === def.id || m.subTarget === 'All')
    );
    const modSum = skillMods.reduce((a, b) => a + b.value, 0);
    const extraBonus = (st.bonusOverride || 0) + modSum;
    const totalBonus = abilityMod + profBonus + extraBonus;

    out[def.id] = {
      id: def.id,
      name: def.name,
      ability: def.ability,
      proficiency: st.proficiency,
      abilityMod,
      profBonus,
      extraBonus,
      totalBonus,
      passiveScore: 10 + totalBonus,
      sourceName: st.source?.name || 'Base',
      modifiers: skillMods,
    };
  }

  return out;
}

export function computeVitals(
  sheet: CharacterSheetState,
  abilities: Record<AbilityKey, ComputedAbility>
) {
  const allMods = getActiveModifiers(sheet);

  const acMods = allMods.filter((m) => m.target === 'AC');
  const acModBonus = acMods.reduce((a, b) => a + b.value, 0);
  const equippedArmorBonus = sheet.equipment
    .filter((eq) => eq.equipped && eq.armorAcBonus)
    .reduce((a, b) => a + (b.armorAcBonus || 0), 0);

  const effectiveAC = sheet.acBase + acModBonus + equippedArmorBonus;

  const hpMods = allMods.filter((m) => m.target === 'MaxHP');
  const baseMaxHP =
    sheet.hpMaxBase + hpMods.reduce((a, b) => a + b.value, 0);
  const tempMaxBonus = Math.max(0, sheet.hpMaxBonusTemp || 0);
  const necroticMaxPenalty = Math.max(0, sheet.hpMaxPenaltyNecrotic || 0);
  const effectiveMaxHP = Math.max(
    1,
    baseMaxHP + tempMaxBonus - necroticMaxPenalty
  );

  const initMods = allMods.filter((m) => m.target === 'Initiative');
  const effectiveInitiative =
    abilities.DEX.modifier +
    sheet.initiativeBonusManual +
    initMods.reduce((a, b) => a + b.value, 0);

  const speedMods = allMods.filter((m) => m.target === 'Speed');
  const effectiveSpeed =
    sheet.speedBase + speedMods.reduce((a, b) => a + b.value, 0);

  return {
    effectiveAC,
    acSources: acMods,
    baseMaxHP,
    tempMaxBonus,
    necroticMaxPenalty,
    effectiveMaxHP,
    hpSources: hpMods,
    effectiveInitiative,
    initSources: initMods,
    effectiveSpeed,
    speedSources: speedMods,
  };
}

/**
 * Combines dice expression (e.g. "1d8" or "1d4+2") with an ability modifier (e.g. +4)
 * into a clean display string like "1d8+4" or "1d4+6".
 */
export function formatDamageExpression(
  dmg: DamageComponent | undefined,
  abilities: Record<AbilityKey, ComputedAbility>,
  extraNumericBonus = 0
): string {
  if (!dmg || !dmg.dice.trim()) return '';
  const raw = dmg.dice.trim();
  const abMod = getAbilityModValue(dmg.ability, abilities);
  const totalAdd = abMod + extraNumericBonus;

  // Match pattern like "1d8+2" or "2d6-1" or "1d8"
  const match = raw.match(/^(\d+d\d+)(?:\s*([+-])\s*(\d+))?$/i);
  if (match) {
    const baseDice = match[1];
    const existingSign = match[2];
    const existingNum = match[3] ? parseInt(match[3], 10) : 0;
    const signedExisting =
      existingSign === '-' ? -existingNum : existingNum;
    const finalBonus = signedExisting + totalAdd;
    if (finalBonus === 0) return baseDice;
    return `${baseDice}${finalBonus > 0 ? `+${finalBonus}` : finalBonus}`;
  }

  if (totalAdd === 0) return raw;
  return `${raw}${totalAdd > 0 ? `+${totalAdd}` : totalAdd}`;
}

export function getAllCombatAttacks(sheet: CharacterSheetState): AttackItem[] {
  const fromEquipment: AttackItem[] = [];
  for (const eq of sheet.equipment) {
    if (eq.equipped && eq.attacks && eq.attacks.length > 0) {
      for (const atk of eq.attacks) {
        fromEquipment.push({
          ...atk,
          sourceEquipmentId: eq.id,
          source: {
            type: 'Equipment',
            id: eq.id,
            name: eq.name,
          },
        });
      }
    }
  }
  // Ações embutidas de features (talentos/passivas do reino), como magias/equipamentos
  const fromFeatures: AttackItem[] = [];
  for (const f of sheet.features) {
    for (const a of f.actions || []) {
      if (a.kind === 'Attack' || (a.kind === 'Damage' && a.damage1?.dice)) {
        fromFeatures.push({
          ...a,
          source: { type: 'Feature', id: f.id, name: f.name },
        });
      }
    }
  }
  return [...fromEquipment, ...fromFeatures, ...sheet.standaloneAttacks];
}

export function calculateAttackStats(
  attack: AttackItem,
  sheet: CharacterSheetState,
  abilities: Record<AbilityKey, ComputedAbility>
) {
  const allMods = getActiveModifiers(sheet);
  const abMod = getAbilityModValue(attack.ability, abilities);
  const profBonus = getProficiencyBonusValue(sheet.level, attack.proficiency);

  // Check if attack has inherent magic bonus in dice or attack bonus
  const effectAtkBonus = allMods
    .filter((m) => m.target === 'Attack')
    .reduce((a, b) => a + b.value, 0);

  const hitBonus = abMod + attack.bonus + profBonus + effectAtkBonus;
  const hasHitRoll =
    attack.ability !== 'None' ||
    attack.proficiency !== 'None' ||
    attack.bonus !== 0;

  // Check active damage modifiers (e.g., Radiant Imbue)
  const activeDmgMods = allMods.filter((m) => m.target === 'Damage' && m.value !== 0);
  const untypedDmgBonus = activeDmgMods
    .filter((m) => !m.damageType)
    .reduce((a, b) => a + b.value, 0);
  const typedDmgMods = activeDmgMods.filter((m) => m.damageType);

  const dmg1Formula = formatDamageExpression(
    attack.damage1,
    abilities,
    untypedDmgBonus
  );
  const dmg2Formula = attack.damage2?.dice
    ? formatDamageExpression(attack.damage2, abilities, 0)
    : '';

  return {
    abMod,
    profBonus,
    effectAtkBonus,
    hitBonus,
    hasHitRoll,
    dmg1Formula,
    dmg2Formula,
    typedDmgMods,
  };
}

export function calculateSpellStats(
  spell: SpellItem,
  sheet: CharacterSheetState,
  abilities: Record<AbilityKey, ComputedAbility>
) {
  const pb = getProficiencyBonus(sheet.level);
  const castMod = getAbilityModValue(spell.spellcastingAbility, abilities);
  const atkAbility =
    spell.attackAbility !== 'None'
      ? spell.attackAbility
      : spell.spellcastingAbility;
  const atkAbMod = getAbilityModValue(atkAbility, abilities);
  const atkProf = getProficiencyBonusValue(sheet.level, spell.attackProficiency);

  const spellAttackBonus = atkAbMod + spell.attackBonus + atkProf;
  const spellSaveDC =
    (sheet.spellSaveDcBase || 8) + pb + castMod + (spell.dcModifier || 0);

  const dmg1Formula = formatDamageExpression(spell.damage1, abilities, 0);
  const dmg2Formula = spell.damage2?.dice
    ? formatDamageExpression(spell.damage2, abilities, 0)
    : '';
  const healFormula = spell.healDice
    ? formatDamageExpression(
        { dice: spell.healDice, ability: spell.healAbility, type: '' },
        abilities,
        0
      )
    : '';

  return {
    spellAttackBonus,
    spellSaveDC,
    dmg1Formula,
    dmg2Formula,
    healFormula,
  };
}

export function calculateInventoryWeights(sheet: CharacterSheetState) {
  const equipmentWeight = sheet.equipment.reduce(
    (sum, item) => sum + (Number(item.quantity) || 0) * (Number(item.unitWeight) || 0),
    0
  );
  const possessionsWeight = sheet.otherPossessions.reduce(
    (sum, item) => sum + (Number(item.quantity) || 0) * (Number(item.unitWeight) || 0),
    0
  );
  const totalWeight = Number((equipmentWeight + possessionsWeight).toFixed(2));
  const strScore = sheet.abilities.STR?.baseScore || 10;
  const maxCarry = strScore * 15;
  const encumberedStatus =
    totalWeight > maxCarry ? 'Encumbered' : 'Unencumbered';

  return {
    equipmentWeight: Number(equipmentWeight.toFixed(2)),
    possessionsWeight: Number(possessionsWeight.toFixed(2)),
    totalWeight,
    maxCarry,
    encumberedStatus,
  };
}

/**
 * Automatically synchronizes character state when Species, Realm, Class, Level,
 * Background, or Feats are updated, without overwriting Custom user items.
 */
export function synchronizeOrigins(
  sheet: CharacterSheetState,
  updates: Partial<{
    speciesId: string;
    realmId: string;
    classId: string;
    backgroundId: string;
    level: number;
    featIds: string[];
  }>
): CharacterSheetState {
  const next: CharacterSheetState = {
    ...sheet,
    ...updates,
  };

  const species = COMPENDIUM_SPECIES.find((s) => s.id === next.speciesId);
  const realm = COMPENDIUM_REALMS.find((r) => r.id === next.realmId);
  const cls = COMPENDIUM_CLASSES.find((c) => c.id === next.classId);
  const bg = COMPENDIUM_BACKGROUNDS.find((b) => b.id === next.backgroundId);

  // 1. Update Speed & Darkvision from Species
  if (species) {
    next.speedBase = species.speedFt;
    next.darkvisionFt = species.darkvisionFt;
  }

  // 2. Rebuild auto-derived Features while preserving Custom features
  const customFeatures = next.features.filter(
    (f) => f.source.type === 'Custom'
  );
  const derivedFeatures = [];

  if (species) {
    species.traits.forEach((t, idx) => {
      derivedFeatures.push({
        ...t,
        id: `auto-feat-species-${species.id}-${idx}`,
      });
    });
  }

  if (realm) {
    realm.traits.forEach((t, idx) => {
      derivedFeatures.push({
        ...t,
        id: `auto-feat-realm-${realm.id}-${idx}`,
      });
    });
  }

  if (cls) {
    cls.featuresByLevel
      .filter((lvlBlock) => lvlBlock.level <= next.level)
      .forEach((lvlBlock) => {
        lvlBlock.features.forEach((f, idx) => {
          derivedFeatures.push({
            ...f,
            id: `auto-feat-class-${cls.id}-l${lvlBlock.level}-${idx}`,
          });
        });
      });
  }

  // Realm Archetype talents (automatic at their unlock levels)
  const baseArchetypeId = resolveArchetypeBase(next.classId);
  const realmArchetype = getRealmArchetype(realm, next.classId);
  if (realm && realmArchetype?.talentos) {
    realmArchetype.talentos
      .filter((t) => t.nivel <= next.level)
      .forEach((t, idx) => {
        const acts = (t.actions || []).map((a, i) => ({
          ...a,
          id: `auto-action-realm-talent-${realm.id}-${baseArchetypeId}-${t.nivel}-${i}`,
        }));
        const firstAct = acts[0];
        derivedFeatures.push({
          name: `Nv ${t.nivel} · ${t.nome}${t.revisao ? ' (em revisão)' : ''}`,
          category: 'Realm Talents',
          actionType: firstAct?.actionType ?? 'Passive',
          description:
            t.desc +
            (t.revisao ? ' — Marcado como pendente de revisão de conteúdo.' : ''),
          source: { type: 'Realm', id: realm.id, name: realm.name },
          id: `auto-feat-realm-talent-${realm.id}-${baseArchetypeId}-${t.nivel}`,
          actions: acts.length ? acts : undefined,
          advanced:
            firstAct && firstAct.usesMax && firstAct.usesMax > 0
              ? {
                  modifiers: [],
                  usesMax: firstAct.usesMax,
                  usesCurrent: firstAct.usesMax,
                  rechargeOn: firstAct.rechargeOn ?? 'None',
                }
              : undefined,
        });
      });
  }

  if (bg) {
    derivedFeatures.push({
      ...bg.feature,
      id: `auto-feat-bg-${bg.id}`,
    });
  }

  for (const featId of next.featIds) {
    const feat = COMPENDIUM_FEATS.find((f) => f.id === featId);
    if (feat) {
      derivedFeatures.push({
        ...feat.feature,
        id: `auto-feat-feat-${feat.id}`,
      });
    }
  }

  next.features = [...derivedFeatures, ...customFeatures];

  // 3. Rebuild Realm Combat Effects while preserving Custom/Class effects
  const nonRealmEffects = next.combatEffects.filter(
    (e) => e.source?.type !== 'Realm'
  );
  const realmEffects = (realm?.combatEffects || []).map((e, idx) => ({
    ...e,
    id:
      e.name.includes('Revendor')
        ? 'effect-revendor-radiant'
        : `auto-eff-realm-${realm?.id}-${idx}`,
  }));
  next.combatEffects = [...nonRealmEffects, ...realmEffects];

  // 3b. Ataque Extra (Guerreiro Nv 5) — ação de combate derivada com checkbox
  const withoutPinnedActions = next.combatActions.filter(
    (ca) => ca.id !== 'auto-ca-ataque-extra'
  );
  const extraActions: CombatActionItem[] = [];
  if (
    resolveArchetypeBase(next.classId) === 'guerreiro' &&
    next.level >= 5
  ) {
    extraActions.push({
      id: 'auto-ca-ataque-extra',
      category: 'Actions',
      name: 'Ataque Extra',
      subtitle: 'Guerreiro · Nv 5',
      details:
        'Quando você usa a ação Ataque, pode fazer dois ataques em vez de um (1x por turno).',
      trigger: 'Sua vez — ação Ataque.',
      effect: 'Faça um segundo ataque como parte da mesma ação Ataque.',
      usesMax: 1,
      usesCurrent: 1,
      source: { type: 'Class', id: 'guerreiro', name: 'Guerreiro' },
    });
  }
  next.combatActions = [...extraActions, ...withoutPinnedActions];

  // 4. Unlock Realm Exclusive Spells automatically (avoiding duplicates)
  const nonRealmSpells = next.spells.filter(
    (s) => s.source?.type !== 'Realm'
  );
  const realmSpells = (realm?.unlockedSpells || []).map((s, idx) => ({
    ...s,
    id: `auto-spell-realm-${realm?.id}-${idx}`,
  }));
  next.spells = [...nonRealmSpells, ...realmSpells];

  // 5. Rebuild Proficiencies & Languages from Species, Realm, Class, Background + Custom
  const customProfs = next.proficiencies.filter(
    (p) => p.source.type === 'Custom'
  );
  const derivedProfs = [
    ...(species?.proficiencies || []).map((p, i) => ({
      ...p,
      id: `auto-prof-sp-${i}`,
    })),
    ...(realm?.proficiencies || []).map((p, i) => ({
      ...p,
      id: `auto-prof-rm-${i}`,
    })),
    ...(cls?.proficiencies || []).map((p, i) => ({
      ...p,
      id: `auto-prof-cl-${i}`,
    })),
    ...(bg?.proficiencies || []).map((p, i) => ({
      ...p,
      id: `auto-prof-bg-${i}`,
    })),
  ];
  next.proficiencies = [...derivedProfs, ...customProfs];

  // 6. Apply Skill Grants from Class, Species (e.g. Elfo Keen Senses), Background
  const updatedSkills = { ...next.skills };
  // Reset non-custom skills first
  for (const skId of Object.keys(updatedSkills)) {
    if (updatedSkills[skId].source.type !== 'Custom') {
      updatedSkills[skId] = {
        proficiency: 'None',
        source: { type: 'Custom', name: 'Base' },
      };
    }
  }
  if (species?.id === 'elfo') {
    updatedSkills.perception = {
      proficiency: 'Proficient',
      source: { type: 'Species', id: 'elfo', name: 'Elfo (Keen Senses)' },
    };
  }
  if (cls) {
    for (const grant of cls.skillGrants) {
      updatedSkills[grant.skillId] = {
        proficiency: grant.level,
        source: { type: 'Class', id: cls.id, name: cls.name },
      };
    }
  }
  if (bg) {
    for (const grant of bg.skillGrants) {
      updatedSkills[grant.skillId] = {
        proficiency: grant.level,
        source: { type: 'Background', id: bg.id, name: bg.name },
      };
    }
  }
  next.skills = updatedSkills;

  return next;
}

// Dice Rolling Helpers
export function rollDie(sides: number): number {
  return Math.floor(Math.random() * sides) + 1;
}

export function evaluateDiceFormula(formula: string): {
  total: number;
  breakdown: string;
} {
  if (!formula || !formula.trim()) {
    return { total: 0, breakdown: '0' };
  }
  const clean = formula.replace(/\s+/g, '');
  const tokens = clean.match(/[+-]?[^+-]+/g) || [];
  let total = 0;
  const parts: string[] = [];

  for (const token of tokens) {
    const diceMatch = token.match(/^([+-]?)(\d+)d(\d+)$/i);
    if (diceMatch) {
      const sign = diceMatch[1] === '-' ? -1 : 1;
      const count = Math.min(50, parseInt(diceMatch[2], 10));
      const sides = parseInt(diceMatch[3], 10);
      const rolls: number[] = [];
      for (let i = 0; i < count; i++) {
        rolls.push(rollDie(sides));
      }
      const sum = rolls.reduce((a, b) => a + b, 0) * sign;
      total += sum;
      parts.push(
        `${sign < 0 ? '-' : parts.length > 0 ? '+' : ''}[${rolls.join(', ')}] (${ count }d${sides})`
      );
    } else {
      const num = parseInt(token, 10);
      if (!isNaN(num)) {
        total += num;
        parts.push(`${num >= 0 && parts.length > 0 ? `+${num}` : num}`);
      }
    }
  }

  return {
    total,
    breakdown: parts.join(' '),
  };
}

export function createD20RollLog(params: {
  title: string;
  subtitle: string;
  modifier: number;
  rollMode: RollMode;
  damageFormula?: string;
  damageType?: string;
}): RollLogEntry {
  const r1 = rollDie(20);
  const r2 = rollDie(20);
  const d20Rolls = params.rollMode === 'normal' ? [r1] : [r1, r2];
  let keptD20 = r1;
  if (params.rollMode === 'advantage') keptD20 = Math.max(r1, r2);
  if (params.rollMode === 'disadvantage') keptD20 = Math.min(r1, r2);

  const total = keptD20 + params.modifier;
  const isCrit = keptD20 === 20;
  const isFumble = keptD20 === 1;

  let damageTotal: number | undefined;
  let damageBreakdown: string | undefined;

  if (params.damageFormula) {
    const dmgRes = evaluateDiceFormula(params.damageFormula);
    damageTotal = dmgRes.total;
    damageBreakdown = dmgRes.breakdown;
  }

  return {
    id: `roll-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    timestamp: new Date().toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }),
    title: params.title,
    subtitle: params.subtitle,
    rollMode: params.rollMode,
    d20Rolls,
    keptD20,
    modifier: params.modifier,
    total,
    breakdown: `d20 (${
      params.rollMode === 'normal'
        ? keptD20
        : `${d20Rolls.join(', ')} → ${keptD20}`
    }) ${formatSigned(params.modifier)}`,
    damageTotal,
    damageBreakdown,
    damageType: params.damageType,
    isCrit,
    isFumble,
  };
}
