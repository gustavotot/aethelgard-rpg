export type AbilityKey = 'STR' | 'DEX' | 'CON' | 'INT' | 'WIS' | 'CHA';

export type AbilitySelection = AbilityKey | 'None';

export type DamageType =
  | 'Acid'
  | 'Bludgeoning'
  | 'Cold'
  | 'Fire'
  | 'Force'
  | 'Lightning'
  | 'Necrotic'
  | 'Piercing'
  | 'Poison'
  | 'Psychic'
  | 'Radiant'
  | 'Slashing'
  | 'Thunder';

export type ProficiencyLevel =
  | 'None'
  | 'Half Proficiency'
  | 'Proficient'
  | 'Expertise';

export type ActionType =
  | 'Action'
  | 'Bonus Action'
  | 'Reaction'
  | 'Free Action'
  | 'Passive'
  | 'None';

export type AttackType =
  | 'Melee'
  | 'Ranged'
  | 'Spell Attack'
  | 'Spell Save'
  | 'Attack Save';

export type EquipmentType =
  | 'Weapon'
  | 'Armor'
  | 'Shield'
  | 'Helm'
  | 'Tool'
  | 'Basic';

export type WeaponCategory = 'Simple' | 'Martial';

export type WeaponRangeType = 'Melee' | 'Ranged';

export type SpellSchool =
  | 'Abjuration'
  | 'Conjuration'
  | 'Divination'
  | 'Enchantment'
  | 'Evocation'
  | 'Illusion'
  | 'Necromancy'
  | 'Transmutation';

export type AOEShape =
  | '(None)'
  | 'Line'
  | 'Cone'
  | 'Cube'
  | 'Wall'
  | 'Sphere'
  | 'Cylinder'
  | 'Hemisphere'
  | 'Circle'
  | 'Square'
  | 'Emanation';

export type SizeCategory =
  | 'None'
  | 'Tiny'
  | 'Small'
  | 'Medium'
  | 'Large'
  | 'Huge'
  | 'Gargantuan';

export type SourceType =
  | 'Species'
  | 'Realm'
  | 'Class'
  | 'Background'
  | 'Feat'
  | 'Feature'
  | 'Equipment'
  | 'Effect'
  | 'Custom';

export interface SourceReference {
  type: SourceType;
  id?: string;
  name: string;
}

export type ModifierTarget =
  | 'AbilityScore'
  | 'Attack'
  | 'Damage'
  | 'AC'
  | 'Initiative'
  | 'Speed'
  | 'SavingThrow'
  | 'Skill'
  | 'SpellSaveDC'
  | 'MaxHP';

export interface StatModifier {
  id: string;
  target: ModifierTarget;
  subTarget?: string; // e.g., 'INT', 'DEX', 'Stealth', 'All'
  value: number;
  damageType?: DamageType;
  label?: string;
  source: SourceReference;
}

export interface DamageComponent {
  dice: string;
  ability: AbilitySelection;
  type: DamageType | '';
}

export interface AttackItem {
  id: string;
  name: string;
  type: AttackType;
  range: string;
  ability: AbilitySelection;
  bonus: number;
  proficiency: ProficiencyLevel;
  damage1: DamageComponent;
  damage2?: DamageComponent;
  description: string;
  sourceEquipmentId?: string;
  source?: SourceReference;
  // Advanced options
  critThreshold?: number;
  extraNotes?: string;
  grantsAdvantage?: boolean;
}

export interface WeaponMasteryItem {
  id: string;
  weapon: string;
  property: string;
  effect: string;
  requirements: string;
  source?: SourceReference;
}

export interface CombatEffect {
  id: string;
  name: string;
  active: boolean;
  modDisplay: string;
  affects: string;
  modifiers: StatModifier[];
  description?: string;
  source?: SourceReference;
}

export interface CombatActionItem {
  id: string;
  category: 'Actions' | 'Bonus Actions' | 'Reactions' | 'Free Actions';
  name: string;
  subtitle?: string;
  details: string;
  trigger?: string;
  effect?: string;
  requirements?: string;
  usesMax?: number;
  usesCurrent?: number;
  source?: SourceReference;
}

export interface SpellItem {
  id: string;
  name: string;
  level: number; // 0 = Cantrip, 1..9
  school: SpellSchool;
  range: string;
  castingTime: string;
  spellcastingAbility: AbilitySelection;
  target: string;
  duration: string;
  aoeSize: string;
  aoeShape: AOEShape;
  components: {
    v: boolean;
    s: boolean;
    m: boolean;
  };
  ritual: boolean;
  concentration: boolean;
  alwaysPrepared: boolean;
  activeToggle?: boolean;
  // Dynamic non-mutually-exclusive behaviors
  hasAttack: boolean;
  hasSave: boolean;
  hasHeal: boolean;
  damageOnly: boolean;
  // Attack block
  attackAbility: AbilitySelection;
  attackBonus: number;
  attackProficiency: ProficiencyLevel;
  // Save block
  saveAbility: AbilitySelection;
  dcModifier: number;
  // Heal block
  healDice: string;
  healAbility: AbilitySelection;
  // Damage block
  damage1: DamageComponent;
  damage2?: DamageComponent;
  // Future Mana & Heat architecture compatibility
  manaCost?: number;
  heatGenerated?: number;
  // true/omitted = autorizada; false = fora das afinidades do reino, aguarda aprovação do Mestre
  gmApproved?: boolean;
  description: string;
  source?: SourceReference;
}

export type FeatureActionKind =
  | 'Attack'
  | 'Damage'
  | 'Heal'
  | 'Movement'
  | 'Passive'
  | 'Utility';

export interface FeatureActionItem extends AttackItem {
  // O que a ação FAZ (como as ações embutidas de um equipamento)
  kind: FeatureActionKind;
  actionType: ActionType;
  trigger?: string;
  target?: string;
  duration?: string;
  // Cura (kind Heal)
  healDice?: string;
  healAbility?: AbilitySelection;
  // Movimento (kind Movement)
  moveFt?: number;
  // Save (para ataques/efeitos que exigem teste do alvo)
  saveAbility?: AbilitySelection;
  saveDC?: number; // 0 = fórmula padrão (8 + Prof + mod do atributo)
  // Metadados de magia (spell-like)
  school?: SpellSchool;
  circle?: number; // 0 = truque, 1..9
  manaCost?: number;
  spellAbility?: AbilitySelection;
  // Usos próprios da ação (recarga como equipamento)
  usesMax?: number;
  usesCurrent?: number;
  rechargeOn?: 'Turn' | 'Combat' | 'Short Rest' | 'Long Rest' | 'None';
}

export interface EquipmentItem {
  id: string;
  name: string;
  type: EquipmentType;
  equipped: boolean;
  quantity: number;
  unitWeight: number;
  // Weapon properties when type === 'Weapon'
  rangeType?: WeaponRangeType;
  weaponCategory?: WeaponCategory;
  weaponType?: string;
  // Embedded attacks that sync automatically to Combat
  attacks: AttackItem[];
  // Armor / Shield AC properties
  armorAcBonus?: number;
  // Attunement
  requiresAttunement?: boolean;
  attuned?: boolean;
  description: string;
  source?: SourceReference;
}

export interface PossessionItem {
  id: string;
  name: string;
  quantity: number;
  unitWeight: number;
  description: string;
}

export type FeatureCategory =
  | 'Classes'
  | 'Class Features'
  | 'Realm Talents'
  | 'Species Traits'
  | 'Feats'
  | 'Others';

export interface FeatureTraitItem {
  id: string;
  name: string;
  category: FeatureCategory;
  actionType: ActionType;
  description: string;
  source: SourceReference;
  // Ações embutidas (como um equipamento que gera ataques)
  actions?: FeatureActionItem[];
  // Metadados de magia (spell-like) — usados para o editor estilo magia
  level?: number; // 0 = truque/cantrip (passiva), 1..9
  school?: SpellSchool;
  range?: string;
  castingTime?: string;
  target?: string;
  duration?: string;
  components?: { v: boolean; s: boolean; m: boolean };
  concentration?: boolean;
  alwaysPrepared?: boolean;
  activeToggle?: boolean;
  manaCost?: number;
  spellAbility?: AbilitySelection;
  // Advanced Editor capabilities
  advanced?: {
    modifiers: StatModifier[];
    usesMax: number;
    usesCurrent: number;
    rechargeOn: 'Turn' | 'Combat' | 'Short Rest' | 'Long Rest' | 'None';
    linkedEffectId?: string;
    customCheckboxes?: { id: string; label: string; checked: boolean }[];
    customButtons?: { id: string; label: string; rollFormula?: string; note?: string }[];
  };
}

export interface NoteEntry {
  id: string;
  name: string;
  relationship: string;
  description: string;
  additionalNotes: string;
}

export interface NoteCategory {
  id: string;
  name: string;
  isDefault?: boolean;
  description?: string;
  entries: NoteEntry[];
}

export interface BackgroundEntry {
  id: string;
  title: string;
  description: string;
  sourceId?: string;
}

export interface CharacteristicEntry {
  id: string;
  label: string;
  value: string;
  unit?: string;
  isDefault?: boolean;
  options?: string[];
}

export interface AppearanceEntry {
  id: string;
  name: string;
  description: string;
}

export type ProficiencyCategory = 'Weapons' | 'Armor' | 'Tools' | 'Languages';

export interface ProficiencyEntry {
  id: string;
  category: ProficiencyCategory;
  name: string;
  source: SourceReference;
}

export interface SkillDefinition {
  id: string;
  name: string;
  ability: AbilityKey;
}

export interface SkillState {
  proficiency: ProficiencyLevel;
  bonusOverride?: number;
  source: SourceReference;
}

export interface AbilityState {
  baseScore: number;
  saveProficiency: ProficiencyLevel;
  saveSource?: SourceReference;
}

export interface CurrencyState {
  copper: number;
  silver: number;
  electrum: number;
  gold: number;
  platinum: number;
}

export interface CharacterSheetState {
  id: string;
  name: string;
  level: number;
  speciesId: string;
  realmId: string;
  classId: string;
  backgroundId: string;
  featIds: string[];
  // Vitals
  inspiration: boolean;
  hpCurrent: number;
  hpMaxBase: number;
  hpTemp: number;
  hpMaxBonusTemp?: number;
  hpMaxBonusTurns?: number;
  hpMaxPenaltyNecrotic?: number;
  acBase: number;
  speedBase: number;
  initiativeBonusManual: number;
  // Mana & Heat (Future-ready resource bars)
  manaCurrent: number;
  manaMax: number;
  heatCurrent: number;
  heatMax: number;
  // Configurable Spell Save Base (Section 9.3)
  spellSaveDcBase: number;
  // Defenses & Conditions
  resistances: string;
  vulnerabilities: string;
  immunities: string;
  conditionImmunities: string;
  activeConditions: string[];
  darkvisionFt: number;
  // Core Stats
  abilities: Record<AbilityKey, AbilityState>;
  skills: Record<string, SkillState>;
  // Sections
  standaloneAttacks: AttackItem[];
  weaponMasteries: WeaponMasteryItem[];
  combatEffects: CombatEffect[];
  combatActions: CombatActionItem[];
  spells: SpellItem[];
  currency: CurrencyState;
  equipment: EquipmentItem[];
  otherPossessions: PossessionItem[];
  features: FeatureTraitItem[];
  noteCategories: NoteCategory[];
  backgrounds: BackgroundEntry[];
  characteristics: CharacteristicEntry[];
  appearances: AppearanceEntry[];
  proficiencies: ProficiencyEntry[];
}

export type SheetSectionId =
  | 'abilities'
  | 'skills'
  | 'combat'
  | 'spells'
  | 'inventory'
  | 'features'
  | 'notes'
  | 'about'
  | 'proficiencies'
  | 'conditions';

export type RollMode = 'normal' | 'advantage' | 'disadvantage';

export interface RollLogEntry {
  id: string;
  timestamp: string;
  title: string;
  subtitle: string;
  rollMode: RollMode;
  d20Rolls?: number[];
  keptD20?: number;
  modifier?: number;
  total?: number;
  breakdown?: string;
  damageTotal?: number;
  damageBreakdown?: string;
  damageType?: string;
  isCrit?: boolean;
  isFumble?: boolean;
}

// Compendium Models
export interface CompendiumSpecies {
  id: string;
  name: string;
  tagline: string;
  speedFt: number;
  darkvisionFt: number;
  size: SizeCategory;
  lore: string;
  modifiers: StatModifier[];
  traits: Omit<FeatureTraitItem, 'id'>[];
  proficiencies: Omit<ProficiencyEntry, 'id'>[];
}

export interface CompendiumRealm {
  id: string;
  name: string;
  tagline: string;
  elementAffinity: string;
  lore: string;
  modifiers: StatModifier[];
  traits: Omit<FeatureTraitItem, 'id'>[];
  combatEffects: Omit<CombatEffect, 'id'>[];
  unlockedSpells: Omit<SpellItem, 'id'>[];
  proficiencies: Omit<ProficiencyEntry, 'id'>[];
  // Extended metadata (16 reinos/d omínios) — opcional, para wizard & lore
  group?: 'fruto' | 'caos';
  cor?: string;
  icone?: string;
  virtude?: string;
  atributo?: string;
  citacao?: string;
  fonte?: { nome: string; desc: string };
  passiva?: {
    nome: string;
    desc: string;
    actions?: Omit<FeatureActionItem, 'id'>[];
  };
  vantagens?: string[];
  corrupcao?: string;
  reflexo?: string;
  racas?: {
    id: string;
    nome: string;
    stats: string;
    desc: string;
    traits: string[];
  }[];
  arquetipos?: RealmArchetype[];
}

export interface RealmTalent {
  nivel: number; // 3 | 6 | 9 | 12 | 16 (desbloqueio automático por nível)
  nome: string;
  desc: string;
  revisao?: boolean;
  actions?: Omit<FeatureActionItem, 'id'>[];
}

export interface RealmArchetype {
  classe: string; // id do arquétipo base (ex: 'arcanista')
  icone: string;
  nome: string; // variante do arquétipo no reino (ex: 'Sacerdote Radiante')
  desc: string;
  revisao?: boolean;
  talentos?: RealmTalent[];
}

export interface CompendiumClass {
  id: string;
  name: string;
  tagline: string;
  hitDie: number;
  manaBase?: number;
  primaryAbilities: AbilityKey[];
  savingThrows: AbilityKey[];
  lore: string;
  proficiencies: Omit<ProficiencyEntry, 'id'>[];
  skillGrants: { skillId: string; level: ProficiencyLevel }[];
  featuresByLevel: {
    level: number;
    features: Omit<FeatureTraitItem, 'id'>[];
    combatActions?: Omit<CombatActionItem, 'id'>[];
    combatEffects?: Omit<CombatEffect, 'id'>[];
  }[];
}

export interface CompendiumBackground {
  id: string;
  name: string;
  tagline: string;
  description: string;
  skillGrants: { skillId: string; level: ProficiencyLevel }[];
  proficiencies: Omit<ProficiencyEntry, 'id'>[];
  feature: Omit<FeatureTraitItem, 'id'>;
}

export interface CompendiumFeat {
  id: string;
  name: string;
  tagline: string;
  description: string;
  modifiers: StatModifier[];
  feature: Omit<FeatureTraitItem, 'id'>;
}
