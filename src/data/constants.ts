import {
  AbilityKey,
  ActionType,
  AOEShape,
  AttackType,
  DamageType,
  EquipmentType,
  ProficiencyLevel,
  SizeCategory,
  SkillDefinition,
  SpellSchool,
} from '../types/rpg';

export const ABILITY_KEYS: AbilityKey[] = ['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA'];

export const ABILITY_LABELS: Record<AbilityKey, { short: string; full: string; pt: string }> = {
  STR: { short: 'STR', full: 'Strength', pt: 'Força' },
  DEX: { short: 'DEX', full: 'Dexterity', pt: 'Destreza' },
  CON: { short: 'CON', full: 'Constitution', pt: 'Constituição' },
  INT: { short: 'INT', full: 'Intelligence', pt: 'Inteligência' },
  WIS: { short: 'WIS', full: 'Wisdom', pt: 'Sabedoria' },
  CHA: { short: 'CHA', full: 'Charisma', pt: 'Carisma' },
};

export const SKILLS_LIST: SkillDefinition[] = [
  { id: 'acrobatics', name: 'Acrobacia', ability: 'DEX' },
  { id: 'animal_handling', name: 'Adestrar Animais', ability: 'WIS' },
  { id: 'arcana', name: 'Arcanismo', ability: 'INT' },
  { id: 'athletics', name: 'Atletismo', ability: 'STR' },
  { id: 'deception', name: 'Enganação', ability: 'CHA' },
  { id: 'history', name: 'História', ability: 'INT' },
  { id: 'insight', name: 'Intuição', ability: 'WIS' },
  { id: 'intimidation', name: 'Intimidação', ability: 'CHA' },
  { id: 'investigation', name: 'Investigação', ability: 'INT' },
  { id: 'medicine', name: 'Medicina', ability: 'WIS' },
  { id: 'nature', name: 'Natureza', ability: 'INT' },
  { id: 'perception', name: 'Percepção', ability: 'WIS' },
  { id: 'performance', name: 'Atuação', ability: 'CHA' },
  { id: 'persuasion', name: 'Persuasão', ability: 'CHA' },
  { id: 'religion', name: 'Religião', ability: 'INT' },
  { id: 'sleight_of_hand', name: 'Prestidigitação', ability: 'DEX' },
  { id: 'stealth', name: 'Furtividade', ability: 'DEX' },
  { id: 'survival', name: 'Sobrevivência', ability: 'WIS' },
];

export const DAMAGE_TYPES: DamageType[] = [
  'Acid',
  'Bludgeoning',
  'Cold',
  'Fire',
  'Force',
  'Lightning',
  'Necrotic',
  'Piercing',
  'Poison',
  'Psychic',
  'Radiant',
  'Slashing',
  'Thunder',
];

export const DAMAGE_TYPE_META: Record<
  DamageType,
  { color: string; symbol: string; labelPt: string }
> = {
  Acid: { color: '#84cc16', symbol: '💧', labelPt: 'Ácido' },
  Bludgeoning: { color: '#a8a29e', symbol: '🔨', labelPt: 'Contundente' },
  Cold: { color: '#38bdf8', symbol: '❄️', labelPt: 'Frio' },
  Fire: { color: '#f97316', symbol: '🔥', labelPt: 'Fogo' },
  Force: { color: '#e11d48', symbol: '💥', labelPt: 'Energia (Force)' },
  Lightning: { color: '#eab308', symbol: '⚡', labelPt: 'Elétrico' },
  Necrotic: { color: '#a855f7', symbol: '💀', labelPt: 'Necrótico' },
  Piercing: { color: '#ef4444', symbol: '🏹', labelPt: 'Perfurante' },
  Poison: { color: '#22c55e', symbol: '🧪', labelPt: 'Veneno' },
  Psychic: { color: '#ec4899', symbol: '🧠', labelPt: 'Psíquico' },
  Radiant: { color: '#facc15', symbol: '☀️', labelPt: 'Radiante' },
  Slashing: { color: '#f87171', symbol: '⚔️', labelPt: 'Cortante' },
  Thunder: { color: '#818cf8', symbol: '🌩️', labelPt: 'Trovejante' },
};

export const PROFICIENCY_LEVELS: {
  value: ProficiencyLevel;
  label: string;
  shortLabel: string;
  multiplier: number;
}[] = [
  { value: 'None', label: 'Sem Proficiência', shortLabel: 'Sem', multiplier: 0 },
  { value: 'Half Proficiency', label: 'Meia Proficiência', shortLabel: 'Meia', multiplier: 0.5 },
  { value: 'Proficient', label: 'Proficiente', shortLabel: 'Prof', multiplier: 1 },
  { value: 'Expertise', label: 'Perícia', shortLabel: 'Per', multiplier: 2 },
];

export const ACTION_TYPES: ActionType[] = [
  'Action',
  'Bonus Action',
  'Reaction',
  'Free Action',
  'Passive',
  'None',
];

export const ATTACK_TYPES: AttackType[] = [
  'Melee',
  'Ranged',
  'Spell Attack',
  'Spell Save',
  'Attack Save',
];

export const EQUIPMENT_TYPES: EquipmentType[] = [
  'Weapon',
  'Armor',
  'Shield',
  'Helm',
  'Tool',
  'Basic',
];

export const SIMPLE_WEAPONS: string[] = [
  'Club',
  'Dagger',
  'Dart',
  'Greatclub',
  'Handaxe',
  'Javelin',
  'Light Crossbow',
  'Light Hammer',
  'Mace',
  'Quarterstaff',
  'Shortbow',
  'Sling',
  'Spear',
];

export const MARTIAL_WEAPONS: string[] = [
  'Battleaxe',
  'Blowgun',
  'Flail',
  'Glaive',
  'Greataxe',
  'Greatsword',
  'Halberd',
  'Hand Crossbow',
  'Heavy Crossbow',
  'Lance',
  'Longbow',
  'Longsword',
  'Maul',
  'Morningstar',
  'Net',
  'Pike',
  'Rapier',
  'Scimitar',
  'Shortsword',
  'Trident',
  'Warhammer',
  'War Pick',
  'Whip',
];

export const SPELL_SCHOOLS: SpellSchool[] = [
  'Abjuration',
  'Conjuration',
  'Divination',
  'Enchantment',
  'Evocation',
  'Illusion',
  'Necromancy',
  'Transmutation',
];

export const AOE_SHAPES: AOEShape[] = [
  '(None)',
  'Line',
  'Cone',
  'Cube',
  'Wall',
  'Sphere',
  'Cylinder',
  'Hemisphere',
  'Circle',
  'Square',
  'Emanation',
];

export const SIZE_CATEGORIES: SizeCategory[] = [
  'None',
  'Tiny',
  'Small',
  'Medium',
  'Large',
  'Huge',
  'Gargantuan',
];

export const ARMOR_CATEGORIES: string[] = ['Light', 'Medium', 'Heavy', 'Shields'];

export const BASE_LANGUAGES: string[] = [
  'Common',
  'Elvish',
  'Dwarvish',
  'Draconic',
  'Celestial',
  'Sylvan',
  'Infernal',
  'Abyssal',
  'Undercommon',
];

export const BASE_COMBAT_ACTIONS: { name: string; details: string }[] = [
  {
    name: 'Attack',
    details: 'Realiza um ataque corpo a corpo, à distância ou desarmado com uma arma equipada.',
  },
  {
    name: 'Dash',
    details: 'Ganha deslocamento adicional igual ao seu Speed atual durante este turno.',
  },
  {
    name: 'Disengage',
    details: 'Seu movimento não provoca Opportunity Attacks pelo resto do turno.',
  },
  {
    name: 'Dodge',
    details: 'Até o início do seu próximo turno, qualquer jogada de ataque contra você tem Disadvantage se você puder ver o atacante, e você faz testes de resistência de DEX com Advantage.',
  },
  {
    name: 'Help',
    details: 'Auxilia outra criatura em um teste de atributo ou concede Advantage na próxima jogada de ataque contra um alvo a até 5 ft.',
  },
  {
    name: 'Influence',
    details: 'Interage socialmente ou tenta alterar a atitude de uma criatura (Deception, Intimidation, Performance, Persuasion ou Animal Handling).',
  },
  {
    name: 'Magic',
    details: 'Conjura uma magia com tempo de conjuração de 1 Action ou ativa um item/habilidade mágica.',
  },
  {
    name: 'Ready',
    details: 'Prepara uma ação para ser disparada como Reaction quando um gatilho perceptível ocorrer.',
  },
  {
    name: 'Search',
    details: 'Dedica atenção para discernir algo que não é óbvio (Insight, Medicine, Perception ou Survival).',
  },
  {
    name: 'Study',
    details: 'Analisa memórias, tomos ou pistas sobre um objeto ou criatura (Arcana, History, Investigation, Nature ou Religion).',
  },
  {
    name: 'Utilize',
    details: 'Usa um objeto mundano, ferramenta ou interage com um mecanismo complexo do ambiente.',
  },
];

export const CONDITIONS_LIST: string[] = [
  'Blinded',
  'Charmed',
  'Deafened',
  'Exhaustion',
  'Frightened',
  'Grappled',
  'Incapacitated',
  'Invisible',
  'Paralyzed',
  'Petrified',
  'Poisoned',
  'Prone',
  'Restrained',
  'Stunned',
  'Unconscious',
];

export const CONDITION_LABELS_PT: Record<string, string> = {
  Blinded: 'Cego',
  Charmed: 'Enfeitiçado',
  Deafened: 'Surdo',
  Exhaustion: 'Exaustão',
  Frightened: 'Amedrontado',
  Grappled: 'Agarrado',
  Incapacitated: 'Incapacitado',
  Invisible: 'Invisível',
  Paralyzed: 'Paralisado',
  Petrified: 'Petrificado',
  Poisoned: 'Envenenado',
  Prone: 'Deitado',
  Restrained: 'Imobilizado',
  Stunned: 'Atordoado',
  Unconscious: 'Inconsciente',
};

export const conditionLabel = (cond: string): string =>
  CONDITION_LABELS_PT[cond] ?? cond;
