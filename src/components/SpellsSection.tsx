import React, { useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  Filter,
  Lock,
  MinusCircle,
  Pencil,
  Plus,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  Zap,
} from 'lucide-react';
import {
  AbilityKey,
  AbilitySelection,
  AOEShape,
  CharacterSheetState,
  DamageType,
  ProficiencyLevel,
  SpellItem,
  SpellSchool,
} from '../types/rpg';
import {
  ABILITY_KEYS,
  AOE_SHAPES,
  DAMAGE_TYPE_META,
  DAMAGE_TYPES,
  PROFICIENCY_LEVELS,
  SPELL_SCHOOLS,
} from '../data/constants';
import {
  calculateSpellStats,
  ComputedAbility,
  formatSigned,
  getProficiencyBonus,
  getProficiencyBonusValue,
} from '../utils/calculations';

interface SpellsSectionProps {
  sheet: CharacterSheetState;
  abilities: Record<AbilityKey, ComputedAbility>;
  onUpdateSheet: (updater: (prev: CharacterSheetState) => CharacterSheetState) => void;
  onRollAttack: (
    attackName: string,
    hitBonus: number,
    damageFormula: string,
    damageType: string
  ) => void;
  onRollDamageOnly: (
    title: string,
    damageFormula: string,
    damageType: string
  ) => void;
  onCastSpellToLog?: (spellName: string, manaSpent: number, heatAdded: number) => void;
}

const SPELL_LEVEL_LABELS: Record<number, string> = {
  0: 'CANTRIPS',
  1: '1ST (5 MANA)',
  2: '2ND (10 MANA)',
  3: '3RD (15 MANA)',
  4: '4TH (20 MANA)',
  5: '5TH (25 MANA)',
  6: '6TH (30 MANA)',
  7: '7TH (35 MANA)',
  8: '8TH (40 MANA)',
  9: '9TH (45 MANA)',
};

export const SpellsSection: React.FC<SpellsSectionProps> = ({
  sheet,
  abilities,
  onUpdateSheet,
  onRollAttack,
  onRollDamageOnly,
  onCastSpellToLog,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [levelFilter, setLevelFilter] = useState<number | 'All'>('All');
  const [editingSpellId, setEditingSpellId] = useState<string | null>(null);
  const [expandedSpellId, setExpandedSpellId] = useState<string | null>(null);
  const [confirmRemoveSpellId, setConfirmRemoveSpellId] = useState<string | null>(
    null
  );
  const [advancedSpellMode, setAdvancedSpellMode] = useState(false);

  const handleUpdateSpell = (updated: SpellItem) => {
    onUpdateSheet((prev) => ({
      ...prev,
      spells: prev.spells.map((s) => (s.id === updated.id ? updated : s)),
    }));
  };

  const handleAddSpell = (level: number) => {
    const newId = `spell-custom-${Date.now()}`;
    const newSpell: SpellItem = {
      id: newId,
      name: 'Nova Magia',
      level,
      school: 'Evocation',
      range: '60 ft',
      castingTime: 'Action',
      spellcastingAbility: 'INT',
      target: '1 criatura',
      duration: 'Instantaneous',
      aoeSize: '',
      aoeShape: '(None)',
      components: { v: true, s: true, m: false },
      ritual: false,
      concentration: false,
      alwaysPrepared: false,
      activeToggle: true,
      hasAttack: level === 0,
      hasSave: false,
      hasHeal: false,
      damageOnly: level > 0,
      attackAbility: 'INT',
      attackBonus: 0,
      attackProficiency: 'Proficient',
      saveAbility: 'DEX',
      dcModifier: 0,
      healDice: '',
      healAbility: 'None',
      damage1: { dice: '1d8', ability: 'None', type: 'Radiant' },
      manaCost: level * 5,
      heatGenerated: level > 0 ? level : 0,
      description: '',
      source: { type: 'Custom', name: 'Grimório' },
    };
    onUpdateSheet((prev) => ({
      ...prev,
      spells: [...prev.spells, newSpell],
    }));
    setEditingSpellId(newId);
  };

  const handleConfirmDelete = (spellId: string) => {
    onUpdateSheet((prev) => ({
      ...prev,
      spells: prev.spells.filter((s) => s.id !== spellId),
    }));
    setConfirmRemoveSpellId(null);
    setEditingSpellId(null);
  };

  const getEffectiveManaCost = (spell: SpellItem): number => {
    if (spell.level <= 0) return 0;
    return spell.manaCost && spell.manaCost >= 5
      ? spell.manaCost
      : spell.level * 5;
  };

  const handleCastWithMana = (spell: SpellItem, logCastOnly = false) => {
    const mana = getEffectiveManaCost(spell);
    const heat = spell.heatGenerated ?? (spell.level > 0 ? spell.level : 0);
    if (mana > 0 || heat > 0) {
      onUpdateSheet((prev) => ({
        ...prev,
        manaCurrent: Math.max(0, prev.manaCurrent - mana),
        heatCurrent: Math.min(prev.heatMax, prev.heatCurrent + heat),
      }));
    }
    if (logCastOnly && onCastSpellToLog) {
      onCastSpellToLog(spell.name, mana, heat);
    }
  };

  // Levels that either have spells or are standard 0..2 + any higher levels present
  const activeLevels = Array.from(
    new Set([0, 1, 2, ...sheet.spells.map((s) => s.level)])
  ).sort((a, b) => a - b);

  const pb = getProficiencyBonus(sheet.level);
  const intSaveDC = sheet.spellSaveDcBase + pb + abilities.INT.modifier;

  return (
    <div className="rounded-lg border border-[#786137] bg-[#141418] p-4 shadow-lg space-y-5">
      {/* Top Search, Filter & Quick Add Bar matching Screenshot 8 */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex-1 min-w-[220px] flex items-center rounded border border-[#3a3835] bg-[#101014] px-3 py-1.5">
          <Search className="w-4 h-4 text-[#78746d] mr-2 shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search..."
            className="w-full bg-transparent text-xs text-white placeholder-[#6e6a63] focus:outline-none"
          />
          <Filter className="w-3.5 h-3.5 text-[#9e9a91] ml-2 mr-1 shrink-0" />
          <select
            value={levelFilter}
            onChange={(e) =>
              setLevelFilter(
                e.target.value === 'All' ? 'All' : parseInt(e.target.value, 10)
              )
            }
            aria-label="Filtrar por nível de magia"
            className="bg-transparent text-xs text-[#b8b4ac] focus:outline-none cursor-pointer"
          >
            <option value="All" className="bg-[#16161b]">
              All Levels
            </option>
            {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((lvl) => (
              <option key={lvl} value={lvl} className="bg-[#16161b]">
                {SPELL_LEVEL_LABELS[lvl]}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="px-2.5 py-1.5 rounded bg-[#18181e] border border-[#2c2a27] text-[#b8b4ac]">
            Spell Save DC (INT):{' '}
            <strong className="text-[#e5c172] font-mono-num">{intSaveDC}</strong>
          </span>
          <button
            type="button"
            onClick={() => handleAddSpell(1)}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded border border-[#8a6f3b] bg-[#1f1b14] hover:bg-[#2d261b] text-[#e5c172] font-semibold cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Nova Magia</span>
          </button>
        </div>
      </div>

      {/* SPELL GROUPS BY LEVEL matching Screenshot 8, 9, 10 */}
      <div className="space-y-6">
        {activeLevels
          .filter((lvl) => levelFilter === 'All' || levelFilter === lvl)
          .map((lvl) => {
            const groupSpells = sheet.spells.filter(
              (s) =>
                s.level === lvl &&
                s.name.toLowerCase().includes(searchQuery.toLowerCase())
            );

            return (
              <div key={lvl}>
                {/* Level Header */}
                <div className="grid grid-cols-12 items-center pb-2 border-b border-[#2c2a27] text-xs">
                  <div className="col-span-5 flex items-center gap-1.5 font-display font-bold tracking-wider text-[#d8b467] uppercase">
                    <Lock className="w-3 h-3 text-[#8c877e]" />
                    <span>{SPELL_LEVEL_LABELS[lvl]}</span>
                  </div>
                  <div className="col-span-2 text-center text-[#9e9a91] text-[11px]">
                    Range
                  </div>
                  <div className="col-span-2 text-center text-[#9e9a91] text-[11px]">
                    Hit / DC
                  </div>
                  <div className="col-span-2 text-right text-[#9e9a91] text-[11px]">
                    Damage
                  </div>
                  <div className="col-span-1 flex justify-end">
                    <button
                      type="button"
                      onClick={() => handleAddSpell(lvl)}
                      title={`Adicionar magia em ${SPELL_LEVEL_LABELS[lvl]}`}
                      className="p-1 text-[#a39e93] hover:text-[#e5c172] cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Spells List */}
                <div className="divide-y divide-[#201f25]">
                  {groupSpells.map((spell) => {
                    const stats = calculateSpellStats(spell, sheet, abilities);
                    const isEditing = editingSpellId === spell.id;
                    const isExpanded = expandedSpellId === spell.id;
                    const showDamageSection =
                      spell.hasAttack || spell.hasSave || spell.damageOnly;
                    const dmgMeta = spell.damage1.type
                      ? DAMAGE_TYPE_META[spell.damage1.type]
                      : null;
                    const gmBlocked = spell.gmApproved === false;

                    if (isEditing) {
                      // FULL DYNAMIC SPELL EDITOR matching Screenshots 9 & 10!
                      return (
                        <div
                          key={spell.id}
                          className="py-4 px-3 my-2 rounded border border-[#5c4b2b] bg-[#18181e] space-y-4 text-xs"
                        >
                          {/* Top Bar */}
                          <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-[#2a2825]">
                            <span className="font-display font-bold text-xs tracking-wider text-white uppercase">
                              EDIT: {spell.name}
                            </span>
                            <div className="flex items-center gap-2">
                              <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider text-[#a39e93]">
                                <Zap className="w-3 h-3 text-[#d8b467]" />
                                Quick Actions
                              </span>
                              <button
                                type="button"
                                onClick={() => setAdvancedSpellMode((p) => !p)}
                                className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors cursor-pointer ${
                                  advancedSpellMode
                                    ? 'bg-[#2d2516] text-[#f0cd7e] border border-[#c8a357]'
                                    : 'text-[#b8b4ac] hover:text-white'
                                }`}
                              >
                                <Settings className="w-3.5 h-3.5 text-[#c8a357]" />
                                <span>Advanced</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditingSpellId(null)}
                                className="px-3 py-1 rounded bg-[#2e2d35] hover:bg-[#3e3d47] text-white font-bold text-xs uppercase tracking-wider cursor-pointer"
                              >
                                DONE
                              </button>
                            </div>
                          </div>

                          {/* 8.1 Basic Info & 8.2 Casting & 8.3 Area Grid */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {/* Name */}
                            <div className="flex items-center border-b border-[#3a3835] pb-1">
                              <span className="text-[#9e9a91] uppercase text-[10px] mr-2 shrink-0">
                                NAME:
                              </span>
                              <input
                                type="text"
                                value={spell.name}
                                onChange={(e) =>
                                  handleUpdateSpell({
                                    ...spell,
                                    name: e.target.value,
                                  })
                                }
                                className="w-full bg-transparent text-white font-medium focus:outline-none"
                              />
                            </div>

                            {/* Level */}
                            <div className="flex items-center border-b border-[#3a3835] pb-1">
                              <span className="text-[#9e9a91] uppercase text-[10px] mr-2 shrink-0">
                                LEVEL:
                              </span>
                              <select
                                value={spell.level}
                                onChange={(e) => {
                                  const nextLvl = parseInt(e.target.value, 10);
                                  handleUpdateSpell({
                                    ...spell,
                                    level: nextLvl,
                                    manaCost: nextLvl * 5,
                                  });
                                }}
                                className="w-full bg-transparent text-white font-medium focus:outline-none cursor-pointer"
                              >
                                {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((l) => (
                                  <option
                                    key={l}
                                    value={l}
                                    className="bg-[#18181e]"
                                  >
                                    {l === 0
                                      ? 'Cantrip (0 Mana)'
                                      : `Ciclo ${l} (${l * 5} Mana)`}
                                  </option>
                                ))}
                              </select>
                            </div>

                            {/* School */}
                            <div className="flex items-center border-b border-[#3a3835] pb-1">
                              <span className="text-[#9e9a91] uppercase text-[10px] mr-2 shrink-0">
                                SCHOOL:
                              </span>
                              <select
                                value={spell.school}
                                onChange={(e) =>
                                  handleUpdateSpell({
                                    ...spell,
                                    school: e.target.value as SpellSchool,
                                  })
                                }
                                className="w-full bg-transparent text-white font-medium focus:outline-none cursor-pointer"
                              >
                                {SPELL_SCHOOLS.map((sch) => (
                                  <option
                                    key={sch}
                                    value={sch}
                                    className="bg-[#18181e]"
                                  >
                                    {sch}
                                  </option>
                                ))}
                              </select>
                            </div>

                            {/* Range */}
                            <div className="flex items-center border-b border-[#3a3835] pb-1">
                              <span className="text-[#9e9a91] uppercase text-[10px] mr-2 shrink-0">
                                RANGE:
                              </span>
                              <input
                                type="text"
                                value={spell.range}
                                onChange={(e) =>
                                  handleUpdateSpell({
                                    ...spell,
                                    range: e.target.value,
                                  })
                                }
                                className="w-full bg-transparent text-white font-medium focus:outline-none"
                              />
                            </div>

                            {/* Casting Time */}
                            <div className="flex items-center border-b border-[#3a3835] pb-1">
                              <span className="text-[#9e9a91] uppercase text-[10px] mr-2 shrink-0">
                                CASTING TIME:
                              </span>
                              <input
                                type="text"
                                value={spell.castingTime}
                                onChange={(e) =>
                                  handleUpdateSpell({
                                    ...spell,
                                    castingTime: e.target.value,
                                  })
                                }
                                className="w-full bg-transparent text-white font-medium focus:outline-none"
                              />
                            </div>

                            {/* Spellcasting Ability */}
                            <div className="flex items-center border-b border-[#3a3835] pb-1">
                              <span className="text-[#9e9a91] uppercase text-[10px] mr-2 shrink-0">
                                SPELLCASTING ABILITY:
                              </span>
                              <select
                                value={spell.spellcastingAbility}
                                onChange={(e) =>
                                  handleUpdateSpell({
                                    ...spell,
                                    spellcastingAbility: e.target
                                      .value as AbilitySelection,
                                  })
                                }
                                className="w-full bg-transparent text-white font-medium focus:outline-none cursor-pointer"
                              >
                                <option value="None" className="bg-[#18181e]">
                                  (None)
                                </option>
                                {ABILITY_KEYS.map((k) => (
                                  <option
                                    key={k}
                                    value={k}
                                    className="bg-[#18181e]"
                                  >
                                    {k} ({formatSigned(abilities[k].modifier)})
                                  </option>
                                ))}
                              </select>
                            </div>

                            {/* Target */}
                            <div className="flex items-center border-b border-[#3a3835] pb-1">
                              <span className="text-[#9e9a91] uppercase text-[10px] mr-2 shrink-0">
                                TARGET:
                              </span>
                              <input
                                type="text"
                                value={spell.target}
                                onChange={(e) =>
                                  handleUpdateSpell({
                                    ...spell,
                                    target: e.target.value,
                                  })
                                }
                                className="w-full bg-transparent text-white font-medium focus:outline-none"
                              />
                            </div>

                            {/* Duration */}
                            <div className="flex items-center border-b border-[#3a3835] pb-1">
                              <span className="text-[#9e9a91] uppercase text-[10px] mr-2 shrink-0">
                                DURATION:
                              </span>
                              <input
                                type="text"
                                value={spell.duration}
                                onChange={(e) =>
                                  handleUpdateSpell({
                                    ...spell,
                                    duration: e.target.value,
                                  })
                                }
                                className="w-full bg-transparent text-white font-medium focus:outline-none"
                              />
                            </div>

                            {/* AOE Size */}
                            <div className="flex items-center border-b border-[#3a3835] pb-1">
                              <span className="text-[#9e9a91] uppercase text-[10px] mr-2 shrink-0">
                                AOE SIZE:
                              </span>
                              <input
                                type="text"
                                value={spell.aoeSize}
                                onChange={(e) =>
                                  handleUpdateSpell({
                                    ...spell,
                                    aoeSize: e.target.value,
                                  })
                                }
                                placeholder="e.g. 20 ft"
                                className="w-full bg-transparent text-white font-medium focus:outline-none"
                              />
                            </div>

                            {/* AOE Shape */}
                            <div className="flex items-center border-b border-[#3a3835] pb-1">
                              <span className="text-[#9e9a91] uppercase text-[10px] mr-2 shrink-0">
                                AOE SHAPE:
                              </span>
                              <select
                                value={spell.aoeShape}
                                onChange={(e) =>
                                  handleUpdateSpell({
                                    ...spell,
                                    aoeShape: e.target.value as AOEShape,
                                  })
                                }
                                className="w-full bg-transparent text-white font-medium focus:outline-none cursor-pointer"
                              >
                                {AOE_SHAPES.map((sh) => (
                                  <option
                                    key={sh}
                                    value={sh}
                                    className="bg-[#18181e]"
                                  >
                                    {sh}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>

                          {/* 8.4 & 8.5 Components & Properties Checkboxes matching Screenshot 9 */}
                          <div className="flex flex-wrap items-center gap-4 pt-1">
                            {(
                              [
                                { key: 'v', label: 'V' },
                                { key: 's', label: 'S' },
                                { key: 'm', label: 'M' },
                              ] as const
                            ).map((comp) => {
                              const checked = spell.components[comp.key];
                              return (
                                <label
                                  key={comp.key}
                                  className="inline-flex items-center gap-1.5 cursor-pointer select-none"
                                >
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleUpdateSpell({
                                        ...spell,
                                        components: {
                                          ...spell.components,
                                          [comp.key]: !checked,
                                        },
                                      })
                                    }
                                    className={`w-4 h-4 rounded border flex items-center justify-center text-[10px] font-bold ${
                                      checked
                                        ? 'bg-[#a12a2a] border-[#ef4444] text-white'
                                        : 'bg-[#121216] border-[#3a3835] text-transparent'
                                    }`}
                                  >
                                    ✓
                                  </button>
                                  <span className="text-white">{comp.label}</span>
                                </label>
                              );
                            })}

                            <label className="inline-flex items-center gap-1.5 cursor-pointer select-none">
                              <button
                                type="button"
                                onClick={() =>
                                  handleUpdateSpell({
                                    ...spell,
                                    ritual: !spell.ritual,
                                  })
                                }
                                className={`w-4 h-4 rounded border flex items-center justify-center text-[10px] font-bold ${
                                  spell.ritual
                                    ? 'bg-[#a12a2a] border-[#ef4444] text-white'
                                    : 'bg-[#121216] border-[#3a3835] text-transparent'
                                }`}
                              >
                                ✓
                              </button>
                              <span className="text-white">Ritual</span>
                            </label>

                            <label className="inline-flex items-center gap-1.5 cursor-pointer select-none">
                              <button
                                type="button"
                                onClick={() =>
                                  handleUpdateSpell({
                                    ...spell,
                                    concentration: !spell.concentration,
                                  })
                                }
                                className={`w-4 h-4 rounded border flex items-center justify-center text-[10px] font-bold ${
                                  spell.concentration
                                    ? 'bg-[#a12a2a] border-[#ef4444] text-white'
                                    : 'bg-[#121216] border-[#3a3835] text-transparent'
                                }`}
                              >
                                ✓
                              </button>
                              <span className="text-white">Concentration</span>
                            </label>

                            <label className="inline-flex items-center gap-1.5 cursor-pointer select-none">
                              <button
                                type="button"
                                onClick={() =>
                                  handleUpdateSpell({
                                    ...spell,
                                    alwaysPrepared: !spell.alwaysPrepared,
                                  })
                                }
                                className={`w-4 h-4 rounded border flex items-center justify-center text-[10px] font-bold ${
                                  spell.alwaysPrepared
                                    ? 'bg-[#a12a2a] border-[#ef4444] text-white'
                                    : 'bg-[#121216] border-[#3a3835] text-transparent'
                                }`}
                              >
                                ✓
                              </button>
                              <span className="text-white">Always Prepared</span>
                            </label>
                          </div>

                          {/* 9. SPELL BEHAVIOR (NON-MUTUALLY-EXCLUSIVE) matching Screenshot 9 & 10! */}
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-[#26252b]">
                            {(
                              [
                                { field: 'hasAttack', label: 'Has Attack' },
                                { field: 'hasSave', label: 'Has Save' },
                                { field: 'hasHeal', label: 'Has Heal' },
                                { field: 'damageOnly', label: 'Damage Only' },
                              ] as const
                            ).map((beh) => {
                              const checked = spell[beh.field];
                              return (
                                <label
                                  key={beh.field}
                                  className="inline-flex items-center gap-2 cursor-pointer select-none"
                                >
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleUpdateSpell({
                                        ...spell,
                                        [beh.field]: !checked,
                                      })
                                    }
                                    className={`w-4 h-4 rounded border flex items-center justify-center text-[10px] font-bold ${
                                      checked
                                        ? 'bg-[#a12a2a] border-[#ef4444] text-white'
                                        : 'bg-[#121216] border-[#3a3835] text-transparent'
                                    }`}
                                  >
                                    ✓
                                  </button>
                                  <span className="text-white leading-tight">
                                    {beh.label}
                                  </span>
                                </label>
                              );
                            })}
                          </div>

                          {/* 9.1 HAS ATTACK BLOCK */}
                          {spell.hasAttack && (
                            <div className="space-y-2 pt-2 border-t border-[#26252b]">
                              <div className="grid grid-cols-12 gap-3 items-center">
                                <div className="col-span-2 text-[#9e9a91] uppercase text-[10px]">
                                  ATTACK:
                                </div>
                                <div className="col-span-5 flex items-center border-b border-[#3a3835] pb-1">
                                  <span className="text-[#9e9a91] uppercase text-[10px] mr-1.5">
                                    ABILITY:
                                  </span>
                                  <select
                                    value={spell.attackAbility}
                                    onChange={(e) =>
                                      handleUpdateSpell({
                                        ...spell,
                                        attackAbility: e.target
                                          .value as AbilitySelection,
                                      })
                                    }
                                    className="w-full bg-transparent text-white focus:outline-none cursor-pointer"
                                  >
                                    <option
                                      value="None"
                                      className="bg-[#18181e]"
                                    >
                                      None (+0)
                                    </option>
                                    {ABILITY_KEYS.map((k) => (
                                      <option
                                        key={k}
                                        value={k}
                                        className="bg-[#18181e]"
                                      >
                                        {k} ({formatSigned(abilities[k].modifier)})
                                      </option>
                                    ))}
                                  </select>
                                </div>
                                <div className="col-span-5 flex items-center border-b border-[#3a3835] pb-1">
                                  <span className="text-[#9e9a91] uppercase text-[10px] mr-1.5">
                                    BONUS:
                                  </span>
                                  <input
                                    type="number"
                                    value={spell.attackBonus}
                                    onChange={(e) =>
                                      handleUpdateSpell({
                                        ...spell,
                                        attackBonus:
                                          parseInt(e.target.value, 10) || 0,
                                      })
                                    }
                                    className="w-full bg-transparent font-mono-num text-white focus:outline-none"
                                  />
                                </div>
                              </div>

                              <div className="grid grid-cols-12 gap-3 items-center">
                                <div className="col-span-2" />
                                <div className="col-span-5 flex items-center border-b border-[#3a3835] pb-1">
                                  <span className="text-[#9e9a91] uppercase text-[10px] mr-1.5">
                                    PROFICIENCY:
                                  </span>
                                  <select
                                    value={spell.attackProficiency}
                                    onChange={(e) =>
                                      handleUpdateSpell({
                                        ...spell,
                                        attackProficiency: e.target
                                          .value as ProficiencyLevel,
                                      })
                                    }
                                    className="w-full bg-transparent text-white focus:outline-none cursor-pointer"
                                  >
                                    {PROFICIENCY_LEVELS.map((pl) => (
                                      <option
                                        key={pl.value}
                                        value={pl.value}
                                        className="bg-[#18181e]"
                                      >
                                        {pl.shortLabel} (
                                        {formatSigned(
                                          getProficiencyBonusValue(
                                            sheet.level,
                                            pl.value
                                          )
                                        )}
                                        )
                                      </option>
                                    ))}
                                  </select>
                                </div>
                                <div className="col-span-5 font-mono-num font-bold text-white text-sm">
                                  = {formatSigned(stats.spellAttackBonus)}
                                </div>
                              </div>
                            </div>
                          )}

                          {/* 9.3 HAS SAVE BLOCK */}
                          {spell.hasSave && (
                            <div className="grid grid-cols-12 gap-3 items-center pt-2 border-t border-[#26252b]">
                              <div className="col-span-2 text-[#9e9a91] uppercase text-[10px]">
                                SAVE:
                              </div>
                              <div className="col-span-4 flex items-center border-b border-[#3a3835] pb-1">
                                <span className="text-[#9e9a91] uppercase text-[10px] mr-1.5">
                                  ABILITY:
                                </span>
                                <select
                                  value={spell.saveAbility}
                                  onChange={(e) =>
                                    handleUpdateSpell({
                                      ...spell,
                                      saveAbility: e.target
                                        .value as AbilitySelection,
                                    })
                                  }
                                  className="w-full bg-transparent text-white focus:outline-none cursor-pointer"
                                >
                                  {ABILITY_KEYS.map((k) => (
                                    <option
                                      key={k}
                                      value={k}
                                      className="bg-[#18181e]"
                                    >
                                      {k}
                                    </option>
                                  ))}
                                </select>
                              </div>
                              <div className="col-span-3 flex items-center border-b border-[#3a3835] pb-1">
                                <span className="text-[#9e9a91] uppercase text-[10px] mr-1.5">
                                  DC MOD:
                                </span>
                                <input
                                  type="number"
                                  value={spell.dcModifier}
                                  onChange={(e) =>
                                    handleUpdateSpell({
                                      ...spell,
                                      dcModifier:
                                        parseInt(e.target.value, 10) || 0,
                                    })
                                  }
                                  className="w-full bg-transparent font-mono-num text-white focus:outline-none"
                                />
                              </div>
                              <div className="col-span-3 font-mono-num font-bold text-[#e5c172]">
                                = DC {stats.spellSaveDC} {spell.saveAbility}
                              </div>
                            </div>
                          )}

                          {/* 9.4 HAS HEAL BLOCK */}
                          {spell.hasHeal && (
                            <div className="grid grid-cols-12 gap-3 items-center pt-2 border-t border-[#26252b]">
                              <div className="col-span-2 text-[#9e9a91] uppercase text-[10px]">
                                HEAL:
                              </div>
                              <div className="col-span-4 flex items-center border-b border-[#3a3835] pb-1">
                                <span className="text-[#9e9a91] uppercase text-[10px] mr-1.5">
                                  DICE:
                                </span>
                                <input
                                  type="text"
                                  value={spell.healDice}
                                  onChange={(e) =>
                                    handleUpdateSpell({
                                      ...spell,
                                      healDice: e.target.value,
                                    })
                                  }
                                  placeholder="e.g. 1d8"
                                  className="w-full bg-transparent font-mono-num text-white focus:outline-none"
                                />
                              </div>
                              <div className="col-span-4 flex items-center border-b border-[#3a3835] pb-1">
                                <span className="text-[#9e9a91] uppercase text-[10px] mr-1.5">
                                  ABILITY:
                                </span>
                                <select
                                  value={spell.healAbility}
                                  onChange={(e) =>
                                    handleUpdateSpell({
                                      ...spell,
                                      healAbility: e.target
                                        .value as AbilitySelection,
                                    })
                                  }
                                  className="w-full bg-transparent text-white focus:outline-none cursor-pointer"
                                >
                                  <option value="None" className="bg-[#18181e]">
                                    None (+0)
                                  </option>
                                  {ABILITY_KEYS.map((k) => (
                                    <option
                                      key={k}
                                      value={k}
                                      className="bg-[#18181e]"
                                    >
                                      {k} ({formatSigned(abilities[k].modifier)})
                                    </option>
                                  ))}
                                </select>
                              </div>
                              <div className="col-span-2 font-mono-num font-bold text-[#4ade80]">
                                = {stats.healFormula || '0'}
                              </div>
                            </div>
                          )}

                          {/* 9.2 & 9.5 DAMAGE 1 & DAMAGE 2 BLOCK */}
                          {showDamageSection && (
                            <div className="space-y-3 pt-2 border-t border-[#26252b]">
                              {/* DMG 1 */}
                              <div className="grid grid-cols-12 gap-3 items-center">
                                <div className="col-span-2 text-[#9e9a91] uppercase text-[10px]">
                                  DMG 1:
                                </div>
                                <div className="col-span-5 flex items-center border-b border-[#3a3835] pb-1">
                                  <span className="text-[#9e9a91] uppercase text-[10px] mr-1.5">
                                    DICE:
                                  </span>
                                  <input
                                    type="text"
                                    value={spell.damage1.dice}
                                    onChange={(e) =>
                                      handleUpdateSpell({
                                        ...spell,
                                        damage1: {
                                          ...spell.damage1,
                                          dice: e.target.value,
                                        },
                                      })
                                    }
                                    placeholder="e.g. 1d8"
                                    className="w-full bg-transparent font-mono-num text-white focus:outline-none"
                                  />
                                </div>
                                <div className="col-span-5 flex items-center border-b border-[#3a3835] pb-1">
                                  <span className="text-[#9e9a91] uppercase text-[10px] mr-1.5">
                                    ABILITY:
                                  </span>
                                  <select
                                    value={spell.damage1.ability}
                                    onChange={(e) =>
                                      handleUpdateSpell({
                                        ...spell,
                                        damage1: {
                                          ...spell.damage1,
                                          ability: e.target
                                            .value as AbilitySelection,
                                        },
                                      })
                                    }
                                    className="w-full bg-transparent text-white focus:outline-none cursor-pointer"
                                  >
                                    <option
                                      value="None"
                                      className="bg-[#18181e]"
                                    >
                                      None (+0)
                                    </option>
                                    {ABILITY_KEYS.map((k) => (
                                      <option
                                        key={k}
                                        value={k}
                                        className="bg-[#18181e]"
                                      >
                                        {k} ({formatSigned(abilities[k].modifier)})
                                      </option>
                                    ))}
                                  </select>
                                </div>
                              </div>

                              <div className="grid grid-cols-12 gap-3 items-center">
                                <div className="col-span-2" />
                                <div className="col-span-5 flex items-center border-b border-[#3a3835] pb-1">
                                  <span className="text-[#9e9a91] uppercase text-[10px] mr-1.5">
                                    TYPE:
                                  </span>
                                  <select
                                    value={spell.damage1.type}
                                    onChange={(e) =>
                                      handleUpdateSpell({
                                        ...spell,
                                        damage1: {
                                          ...spell.damage1,
                                          type: e.target.value as DamageType,
                                        },
                                      })
                                    }
                                    className="w-full bg-transparent text-white focus:outline-none cursor-pointer"
                                  >
                                    <option value="" className="bg-[#18181e]">
                                      Choose
                                    </option>
                                    {DAMAGE_TYPES.map((dt) => (
                                      <option
                                        key={dt}
                                        value={dt}
                                        className="bg-[#18181e]"
                                      >
                                        {dt}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                                <div className="col-span-5 font-mono-num font-bold text-[#ef4444] text-sm">
                                  = {stats.dmg1Formula || '0'}{' '}
                                  {dmgMeta ? dmgMeta.symbol : ''}
                                </div>
                              </div>

                              {/* DMG 2 */}
                              <div className="grid grid-cols-12 gap-3 items-center">
                                <div className="col-span-2 text-[#9e9a91] uppercase text-[10px]">
                                  DMG 2:
                                </div>
                                <div className="col-span-5 flex items-center border-b border-[#3a3835] pb-1">
                                  <span className="text-[#9e9a91] uppercase text-[10px] mr-1.5">
                                    DICE:
                                  </span>
                                  <input
                                    type="text"
                                    value={spell.damage2?.dice || ''}
                                    onChange={(e) =>
                                      handleUpdateSpell({
                                        ...spell,
                                        damage2: {
                                          dice: e.target.value,
                                          ability:
                                            spell.damage2?.ability || 'None',
                                          type: spell.damage2?.type || '',
                                        },
                                      })
                                    }
                                    placeholder="e.g. 2d12+3"
                                    className="w-full bg-transparent font-mono-num text-white focus:outline-none"
                                  />
                                </div>
                                <div className="col-span-5 flex items-center border-b border-[#3a3835] pb-1">
                                  <span className="text-[#9e9a91] uppercase text-[10px] mr-1.5">
                                    ABILITY:
                                  </span>
                                  <select
                                    value={spell.damage2?.ability || 'None'}
                                    onChange={(e) =>
                                      handleUpdateSpell({
                                        ...spell,
                                        damage2: {
                                          dice: spell.damage2?.dice || '',
                                          ability: e.target
                                            .value as AbilitySelection,
                                          type: spell.damage2?.type || '',
                                        },
                                      })
                                    }
                                    className="w-full bg-transparent text-white focus:outline-none cursor-pointer"
                                  >
                                    <option
                                      value="None"
                                      className="bg-[#18181e]"
                                    >
                                      None (+0)
                                    </option>
                                    {ABILITY_KEYS.map((k) => (
                                      <option
                                        key={k}
                                        value={k}
                                        className="bg-[#18181e]"
                                      >
                                        {k} ({formatSigned(abilities[k].modifier)})
                                      </option>
                                    ))}
                                  </select>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Advanced Mana & Heat Settings (Section 9.3 & 10) */}
                          {advancedSpellMode && (
                            <div className="p-3 rounded bg-[#121216] border border-[#3a3426] grid grid-cols-2 gap-3">
                              <div>
                                <label className="block text-[#60a5fa] text-[11px] mb-1">
                                  Custo de Mana
                                </label>
                                <input
                                  type="number"
                                  min={0}
                                  value={spell.manaCost ?? 0}
                                  onChange={(e) =>
                                    handleUpdateSpell({
                                      ...spell,
                                      manaCost:
                                        parseInt(e.target.value, 10) || 0,
                                    })
                                  }
                                  className="w-full px-2 py-1 rounded bg-[#18181e] border border-[#2c2a27] font-mono-num text-white"
                                />
                              </div>
                              <div>
                                <label className="block text-[#fb923c] text-[11px] mb-1">
                                  Heat Gerado
                                </label>
                                <input
                                  type="number"
                                  min={0}
                                  value={spell.heatGenerated ?? 0}
                                  onChange={(e) =>
                                    handleUpdateSpell({
                                      ...spell,
                                      heatGenerated:
                                        parseInt(e.target.value, 10) || 0,
                                    })
                                  }
                                  className="w-full px-2 py-1 rounded bg-[#18181e] border border-[#2c2a27] font-mono-num text-white"
                                />
                              </div>
                            </div>
                          )}

                          {/* 9.6 DESCRIPTION */}
                          <div>
                            <label className="block text-[#9e9a91] uppercase text-[10px] mb-1">
                              DESCRIPTION
                            </label>
                            <textarea
                              rows={3}
                              value={spell.description}
                              onChange={(e) =>
                                handleUpdateSpell({
                                  ...spell,
                                  description: e.target.value,
                                })
                              }
                              className="w-full rounded border border-[#a13535]/70 bg-[#121216] p-2.5 text-white focus:border-[#c8a357] focus:outline-none"
                            />
                          </div>

                          {/* 9.7 REMOVE WITH CONFIRMATION */}
                          {confirmRemoveSpellId === spell.id ? (
                            <div className="flex items-center gap-3 p-2 rounded bg-[#2a1212] border border-[#ef4444]">
                              <span className="text-white font-medium">
                                Confirmar remoção de "{spell.name}"?
                              </span>
                              <button
                                type="button"
                                onClick={() => handleConfirmDelete(spell.id)}
                                className="px-2.5 py-1 rounded bg-[#b91c1c] text-white font-bold cursor-pointer"
                              >
                                Sim, Remover
                              </button>
                              <button
                                type="button"
                                onClick={() => setConfirmRemoveSpellId(null)}
                                className="px-2.5 py-1 rounded bg-[#26252b] text-[#d4d0c8] cursor-pointer"
                              >
                                Cancelar
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setConfirmRemoveSpellId(spell.id)}
                              className="inline-flex items-center gap-1.5 text-xs text-[#e07a7a] hover:text-[#f87171] cursor-pointer"
                            >
                              <MinusCircle className="w-4 h-4 fill-[#e07a7a]/20" />
                              <span>Remove</span>
                            </button>
                          )}
                        </div>
                      );
                    }

                    // COMPACT SPELL ROW matching Screenshot 8
                    return (
                      <div key={spell.id} className="py-3 text-xs">
                        <div className="grid grid-cols-12 items-center gap-1">
                          {/* Left Toggle + Name + C/R badge */}
                          <div className="col-span-5 flex items-center gap-2 pr-1">
                            {spell.level > 0 && (
                              <button
                                type="button"
                                onClick={() =>
                                  handleUpdateSpell({
                                    ...spell,
                                    activeToggle: !spell.activeToggle,
                                  })
                                }
                                title="Alternar estado ativo da magia"
                                className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors cursor-pointer ${
                                  spell.activeToggle
                                    ? 'bg-[#a12a2a]'
                                    : 'bg-[#2a2930]'
                                }`}
                              >
                                <span
                                  className={`inline-flex h-3.5 w-3.5 transform items-center justify-center rounded-full bg-white text-[#a12a2a] transition-transform ${
                                    spell.activeToggle
                                      ? 'translate-x-4'
                                      : 'translate-x-1'
                                  }`}
                                >
                                  <Sparkles className="w-2.5 h-2.5" />
                                </span>
                              </button>
                            )}

                            <div>
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <button
                                  type="button"
                                  disabled={gmBlocked}
                                  onClick={() => handleCastWithMana(spell, true)}
                                  title={
                                    gmBlocked
                                      ? `${spell.name} — aguardando aprovação do Mestre`
                                      : spell.level > 0
                                      ? `Conjurar ${spell.name} (-${getEffectiveManaCost(
                                          spell
                                        )} Mana)`
                                      : `Conjurar ${spell.name} (0 Mana)`
                                  }
                                  className={`font-semibold text-left transition-colors ${
                                    gmBlocked
                                      ? 'text-[#6e6a63] line-through decoration-[#7c1d1d] cursor-not-allowed'
                                      : 'text-white hover:text-[#38bdf8] cursor-pointer'
                                  }`}
                                >
                                  {spell.name}
                                </button>
                                {spell.level > 0 && (
                                  <button
                                    type="button"
                                    disabled={gmBlocked}
                                    onClick={() =>
                                      handleCastWithMana(spell, true)
                                    }
                                    title={
                                      gmBlocked
                                        ? 'Aguardando aprovação do Mestre'
                                        : 'Clique para conjurar e descontar a Mana do ciclo'
                                    }
                                    className={`px-1.5 py-0.5 rounded text-[10px] font-mono-num font-semibold ${
                                      gmBlocked
                                        ? 'bg-[#1c1b1f] border border-[#3a3835] text-[#6e6a63] cursor-not-allowed'
                                        : 'bg-[#101e36] hover:bg-[#193054] border border-[#254575] text-[#7dd3fc] cursor-pointer'
                                    }`}
                                  >
                                    -{getEffectiveManaCost(spell)}M
                                  </button>
                                )}
                                {gmBlocked && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      onUpdateSheet((p) => ({
                                        ...p,
                                        spells: p.spells.map((s) =>
                                          s.id === spell.id
                                            ? { ...s, gmApproved: true }
                                            : s
                                        ),
                                      }))
                                    }
                                    title="Aprovar esta magia (ação do Mestre)"
                                    className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded border border-[#22c55e]/50 bg-[#1d2a1b] text-[10px] font-semibold text-[#4ade80] cursor-pointer hover:bg-[#244030]"
                                  >
                                    <ShieldCheck className="w-3 h-3" />
                                    Aprovar
                                  </button>
                                )}
                                {spell.concentration && (
                                  <span
                                    title="Concentration"
                                    className="w-4 h-4 rounded-full bg-[#2a2930] text-[10px] font-bold text-[#d4d0c8] inline-flex items-center justify-center"
                                  >
                                    C
                                  </span>
                                )}
                                {spell.ritual && (
                                  <span
                                    title="Ritual"
                                    className="w-4 h-4 rounded-full bg-[#2a2930] text-[10px] font-bold text-[#d4d0c8] inline-flex items-center justify-center"
                                  >
                                    R
                                  </span>
                                )}
                              </div>
                              {spell.source?.type === 'Realm' && (
                                <div className="text-[10px] text-[#e5c172]">
                                  Reino: {spell.source.name}
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Range */}
                          <div className="col-span-2 text-center text-[11px] text-[#9e9a91]">
                            {spell.range || '—'}
                          </div>

                          {/* Hit / DC */}
                          <div className="col-span-2 text-center font-mono-num">
                            {spell.hasAttack && (
                              <button
                                type="button"
                                disabled={gmBlocked}
                                onClick={() => {
                                  handleCastWithMana(spell);
                                  onRollAttack(
                                    spell.name,
                                    stats.spellAttackBonus,
                                    stats.dmg1Formula,
                                    spell.damage1.type || 'Spell'
                                  );
                                }}
                                className={
                                  gmBlocked
                                    ? 'text-[#6e6a63] line-through decoration-[#7c1d1d] cursor-not-allowed font-bold'
                                    : 'font-bold text-[#e5c172] hover:underline cursor-pointer'
                                }
                              >
                                {formatSigned(stats.spellAttackBonus)} Attack
                              </button>
                            )}
                            {spell.hasSave && (
                              <div className="text-[11px] text-[#d8b467] font-semibold">
                                DC {stats.spellSaveDC} {spell.saveAbility}
                              </div>
                            )}
                            {!spell.hasAttack && !spell.hasSave && (
                              <span className="text-[#6e6a63]">—</span>
                            )}
                          </div>

                          {/* Damage / Heal */}
                          <div className="col-span-2 text-right font-mono-num">
                            {showDamageSection && stats.dmg1Formula ? (
                              <button
                                type="button"
                                disabled={gmBlocked}
                                onClick={() => {
                                  handleCastWithMana(spell);
                                  onRollDamageOnly(
                                    spell.name,
                                    stats.dmg1Formula,
                                    spell.damage1.type || 'Spell'
                                  );
                                }}
                                className={
                                  gmBlocked
                                    ? 'inline-flex items-center justify-end gap-1 font-bold text-[#6e6a63] line-through decoration-[#7c1d1d] cursor-not-allowed'
                                    : 'inline-flex items-center justify-end gap-1 font-bold text-[#f87171] hover:underline cursor-pointer'
                                }
                              >
                                <span>{stats.dmg1Formula}</span>
                                {dmgMeta && <span>{dmgMeta.symbol}</span>}
                              </button>
                            ) : spell.hasHeal && stats.healFormula ? (
                              <button
                                type="button"
                                disabled={gmBlocked}
                                onClick={() => {
                                  handleCastWithMana(spell);
                                  onRollDamageOnly(
                                    `${spell.name} (Heal)`,
                                    stats.healFormula,
                                    'Heal'
                                  );
                                }}
                                className={
                                  gmBlocked
                                    ? 'font-bold text-[#6e6a63] line-through decoration-[#7c1d1d] cursor-not-allowed'
                                    : 'font-bold text-[#4ade80] hover:underline cursor-pointer'
                                }
                              >
                                {stats.healFormula} 💚
                              </button>
                            ) : (
                              <span className="text-[#6e6a63]">—</span>
                            )}
                          </div>

                          {/* Edit & Expand */}
                          <div className="col-span-1 flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => setEditingSpellId(spell.id)}
                              className="p-1 text-[#8c877e] hover:text-white cursor-pointer"
                              aria-label={`Editar ${spell.name}`}
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                setExpandedSpellId(
                                  isExpanded ? null : spell.id
                                )
                              }
                              className="p-1 text-[#8c877e] hover:text-white cursor-pointer"
                            >
                              {isExpanded ? (
                                <ChevronUp className="w-3.5 h-3.5" />
                              ) : (
                                <ChevronDown className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                        </div>

                        {isExpanded && (
                          <div className="mt-2.5 p-3 rounded bg-[#18181e] border border-[#28272e] space-y-2 text-[#c7bfa8]">
                            <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-[#9e9a91]">
                              <span>School: {spell.school}</span>
                              <span>Casting: {spell.castingTime}</span>
                              <span>Duration: {spell.duration}</span>
                              {spell.manaCost !== undefined && (
                                <span className="text-[#60a5fa]">
                                  Mana: {spell.manaCost}
                                </span>
                              )}
                              {spell.heatGenerated !== undefined && (
                                <span className="text-[#fb923c]">
                                  Heat: +{spell.heatGenerated}
                                </span>
                              )}
                            </div>
                            <p className="text-xs leading-relaxed">
                              {spell.description || 'Sem descrição adicional.'}
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );
};
