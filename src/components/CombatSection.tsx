import React, { useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  Lock,
  MinusCircle,
  Pencil,
  Plus,
  Search,
  Settings,
  Zap,
  Dices,
} from 'lucide-react';
import {
  AbilityKey,
  AbilitySelection,
  AttackItem,
  AttackType,
  CharacterSheetState,
  CombatActionItem,
  CombatEffect,
  DamageType,
  ModifierTarget,
  ProficiencyLevel,
  WeaponMasteryItem,
} from '../types/rpg';
import {
  ABILITY_KEYS,
  ATTACK_TYPES,
  BASE_COMBAT_ACTIONS,
  DAMAGE_TYPE_META,
  DAMAGE_TYPES,
  PROFICIENCY_LEVELS,
} from '../data/constants';
import {
  calculateAttackStats,
  calculateSpellStats,
  ComputedAbility,
  formatSigned,
  getAbilityModValue,
  getAllCombatAttacks,
  getProficiencyBonusValue,
} from '../utils/calculations';

interface CombatSectionProps {
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
}

export const CombatSection: React.FC<CombatSectionProps> = ({
  sheet,
  abilities,
  onUpdateSheet,
  onRollAttack,
  onRollDamageOnly,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterView, setFilterView] = useState<'All' | 'Attacks' | 'Effects' | 'Actions'>('All');
  const [editingAttackId, setEditingAttackId] = useState<string | null>(null);
  const [expandedAttackId, setExpandedAttackId] = useState<string | null>(null);
  const [advancedAttackMode, setAdvancedAttackMode] = useState(false);

  // Mastery state
  const [addingMastery, setAddingMastery] = useState(false);
  const [newMastery, setNewMastery] = useState<Omit<WeaponMasteryItem, 'id'>>({
    weapon: 'Rapier',
    property: 'Vex',
    effect: '',
    requirements: '',
  });

  // Effect editor state
  const [addingEffect, setAddingEffect] = useState(false);
  const [editingEffectId, setEditingEffectId] = useState<string | null>(null);
  const [effectDraft, setEffectDraft] = useState<{
    name: string;
    target: ModifierTarget;
    value: number;
    damageType: DamageType | '';
    description: string;
  }>({
    name: '',
    target: 'Damage',
    value: 2,
    damageType: '',
    description: '',
  });

  // Action editor state
  const [addingActionCat, setAddingActionCat] = useState<
    CombatActionItem['category'] | null
  >(null);
  const [actionDraft, setActionDraft] = useState<{
    name: string;
    details: string;
    trigger: string;
    effect: string;
    requirements: string;
    usesMax: number;
  }>({
    name: '',
    details: '',
    trigger: '',
    effect: '',
    requirements: '',
    usesMax: 0,
  });
  const [expandedBaseActions, setExpandedBaseActions] = useState(false);
  const [expandedActionIds, setExpandedActionIds] = useState<string[]>([]);

  const allAttacks = getAllCombatAttacks(sheet).filter((atk) =>
    atk.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Active spells for combat casting (cantrips + spells marked "ativa")
  const activeSpells = sheet.spells.filter(
    (sp) => sp.level === 0 || sp.activeToggle === true
  );

  const handleCastSpell = (spId: string) => {
    const sp = sheet.spells.find((x) => x.id === spId);
    if (!sp || sp.gmApproved === false) return;
    const stats = calculateSpellStats(sp, sheet, abilities);
    const manaLvlCost = (sp.level || 0) * 5;
    const manaCost =
      sp.manaCost !== undefined && sp.manaCost >= 5
        ? sp.manaCost
        : manaLvlCost;
    const heatCost = sp.heatGenerated ?? sp.level;
    const usesResources = (sp.level || 0) > 0;
    if (
      usesResources &&
      (sheet.manaCurrent < manaCost ||
        (sheet.heatMax > 0 && sheet.heatCurrent + heatCost > sheet.heatMax))
    ) {
      return;
    }
    onUpdateSheet((prev) =>
      usesResources
        ? {
            ...prev,
            manaCurrent: Math.max(0, prev.manaCurrent - manaCost),
            heatCurrent: prev.heatCurrent + heatCost,
          }
        : prev
    );
    const dmgFormula = [stats.dmg1Formula, stats.dmg2Formula]
      .filter(Boolean)
      .join(' + ');
    if (!dmgFormula) return;
    const hasAttackRoll =
      sp.attackAbility !== undefined && sp.attackAbility !== 'None';
    const dmgType = sp.damage1?.type || 'Damage';
    if (hasAttackRoll) {
      onRollAttack(sp.name, stats.spellAttackBonus, dmgFormula, dmgType);
    } else {
      onRollDamageOnly(sp.name, dmgFormula, dmgType);
    }
  };

  // Update an attack whether it comes from Equipment or Standalone
  const handleUpdateAttack = (updated: AttackItem) => {
    onUpdateSheet((prev) => {
      if (updated.sourceEquipmentId) {
        return {
          ...prev,
          equipment: prev.equipment.map((eq) => {
            if (eq.id !== updated.sourceEquipmentId) return eq;
            return {
              ...eq,
              attacks: eq.attacks.map((a) =>
                a.id === updated.id ? updated : a
              ),
            };
          }),
        };
      }
      return {
        ...prev,
        standaloneAttacks: prev.standaloneAttacks.map((a) =>
          a.id === updated.id ? updated : a
        ),
      };
    });
  };

  const handleRemoveAttack = (attack: AttackItem) => {
    onUpdateSheet((prev) => {
      if (attack.sourceEquipmentId) {
        return {
          ...prev,
          equipment: prev.equipment.map((eq) => {
            if (eq.id !== attack.sourceEquipmentId) return eq;
            return {
              ...eq,
              attacks: eq.attacks.filter((a) => a.id !== attack.id),
            };
          }),
        };
      }
      return {
        ...prev,
        standaloneAttacks: prev.standaloneAttacks.filter(
          (a) => a.id !== attack.id
        ),
      };
    });
    setEditingAttackId(null);
  };

  const handleAddStandaloneAttack = () => {
    const newId = `atk-custom-${Date.now()}`;
    const newAtk: AttackItem = {
      id: newId,
      name: 'Unarmed Strike',
      type: 'Melee',
      range: '5 ft.',
      ability: 'STR',
      bonus: 0,
      proficiency: 'Proficient',
      damage1: { dice: '1d4', ability: 'STR', type: 'Bludgeoning' },
      description: 'Golpe desarmado (soco, chute ou cabeçada).',
      source: { type: 'Custom', name: 'Combate' },
    };
    onUpdateSheet((prev) => ({
      ...prev,
      standaloneAttacks: [...prev.standaloneAttacks, newAtk],
    }));
    setEditingAttackId(newId);
  };

  const handleToggleEffect = (effId: string) => {
    onUpdateSheet((prev) => ({
      ...prev,
      combatEffects: prev.combatEffects.map((e) => {
        if (e.id !== effId) return e;
        const nextActive = !e.active;
        // Also ensure Dueling modifier value is 2 when active
        const updatedMods = e.modifiers.map((m) =>
          e.id === 'eff-dueling' ? { ...m, value: 2 } : m
        );
        return { ...e, active: nextActive, modifiers: updatedMods };
      }),
    }));
  };

  const handleSaveNewEffect = () => {
    if (!effectDraft.name.trim()) return;
    const newEff: CombatEffect = {
      id: `eff-custom-${Date.now()}`,
      name: effectDraft.name.trim(),
      active: true,
      modDisplay: `${formatSigned(effectDraft.value)}${
        effectDraft.damageType ? ` ${effectDraft.damageType}` : ''
      }`,
      affects: effectDraft.target,
      description: effectDraft.description,
      source: { type: 'Custom', name: 'Custom Effect' },
      modifiers: [
        {
          id: `mod-eff-${Date.now()}`,
          target: effectDraft.target,
          value: effectDraft.value,
          damageType: effectDraft.damageType || undefined,
          label: `${effectDraft.name} (${formatSigned(effectDraft.value)})`,
          source: { type: 'Effect', name: effectDraft.name.trim() },
        },
      ],
    };
    onUpdateSheet((prev) => ({
      ...prev,
      combatEffects: [...prev.combatEffects, newEff],
    }));
    setEffectDraft({
      name: '',
      target: 'Damage',
      value: 2,
      damageType: '',
      description: '',
    });
    setAddingEffect(false);
  };

  const handleSaveNewAction = () => {
    if (!addingActionCat || !actionDraft.name.trim()) return;
    const newItem: CombatActionItem = {
      id: `ca-custom-${Date.now()}`,
      category: addingActionCat,
      name: actionDraft.name.trim(),
      details: actionDraft.details,
      trigger: actionDraft.trigger || undefined,
      effect: actionDraft.effect || undefined,
      requirements: actionDraft.requirements || undefined,
      usesMax: actionDraft.usesMax > 0 ? actionDraft.usesMax : undefined,
      usesCurrent: actionDraft.usesMax > 0 ? actionDraft.usesMax : undefined,
      source: { type: 'Custom', name: 'Custom Action' },
    };
    onUpdateSheet((prev) => ({
      ...prev,
      combatActions: [...prev.combatActions, newItem],
    }));
    setActionDraft({
      name: '',
      details: '',
      trigger: '',
      effect: '',
      requirements: '',
      usesMax: 0,
    });
    setAddingActionCat(null);
  };

  const toggleActionExpanded = (id: string) => {
    setExpandedActionIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  return (
    <div className="rounded-lg border border-[#786137] bg-[#141418] p-4 shadow-lg space-y-6">
      {/* Top Search & Filter Bar matching Screenshot 6 */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1 flex items-center rounded border border-[#3a3835] bg-[#101014] px-3 py-1.5">
          <Search className="w-4 h-4 text-[#78746d] mr-2 shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search..."
            className="w-full bg-transparent text-xs text-white placeholder-[#6e6a63] focus:outline-none"
          />
          <select
            value={filterView}
            onChange={(e) =>
              setFilterView(e.target.value as typeof filterView)
            }
            aria-label="Filtrar seção de combate"
            className="bg-transparent text-xs text-[#b8b4ac] border-l border-[#2c2a27] pl-2 ml-2 focus:outline-none cursor-pointer"
          >
            <option value="All" className="bg-[#16161b]">
              Show: All
            </option>
            <option value="Attacks" className="bg-[#16161b]">
              Show: Attacks
            </option>
            <option value="Effects" className="bg-[#16161b]">
              Show: Effects
            </option>
            <option value="Actions" className="bg-[#16161b]">
              Show: Actions
            </option>
          </select>
        </div>
      </div>

      {/* 6.1 ATTACKS SECTION matching Screenshot 6 & 7 */}
      {(filterView === 'All' || filterView === 'Attacks') && (
        <div>
          <div className="grid grid-cols-12 items-center pb-2 border-b border-[#2c2a27] text-xs">
            <div className="col-span-5 flex items-center gap-1.5 font-display font-bold tracking-wider text-[#d8b467] uppercase">
              <Lock className="w-3 h-3 text-[#8c877e]" />
              <span>ATTACKS</span>
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
                onClick={handleAddStandaloneAttack}
                title="Adicionar ataque avulso (ex: Unarmed Strike, Ataque Especial)"
                className="p-1 text-[#a39e93] hover:text-[#e5c172] cursor-pointer"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="divide-y divide-[#201f25]">
            {allAttacks.map((atk) => {
              const stats = calculateAttackStats(atk, sheet, abilities);
              const isEditing = editingAttackId === atk.id;
              const isExpanded = expandedAttackId === atk.id;
              const dmgMeta = atk.damage1.type
                ? DAMAGE_TYPE_META[atk.damage1.type]
                : null;

              if (isEditing) {
                // INLINE EDITOR matching Screenshot 7!
                return (
                  <div
                    key={atk.id}
                    className="py-4 px-2.5 my-2 rounded border border-[#5c4b2b] bg-[#18181e] space-y-4"
                  >
                    {/* Editor Header Bar */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-[#2a2825]">
                      <span className="font-display font-bold text-xs tracking-wider text-white uppercase">
                        EDIT: {atk.name}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider text-[#a39e93]">
                          <Zap className="w-3 h-3 text-[#d8b467]" />
                          Quick Actions
                        </span>
                        <button
                          type="button"
                          onClick={() => setAdvancedAttackMode((p) => !p)}
                          className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors cursor-pointer ${
                            advancedAttackMode
                              ? 'bg-[#2d2516] text-[#f0cd7e] border border-[#c8a357]'
                              : 'text-[#b8b4ac] hover:text-white'
                          }`}
                        >
                          <Settings className="w-3.5 h-3.5 text-[#c8a357]" />
                          <span>Advanced</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingAttackId(null)}
                          className="px-3 py-1 rounded bg-[#2e2d35] hover:bg-[#3e3d47] text-white font-bold text-xs uppercase tracking-wider cursor-pointer"
                        >
                          DONE
                        </button>
                      </div>
                    </div>

                    {/* Row 1: Name & Type */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div className="flex items-center border-b border-[#3a3835] pb-1">
                        <span className="text-[#9e9a91] uppercase text-[10px] mr-2 shrink-0">
                          NAME:
                        </span>
                        <input
                          type="text"
                          value={atk.name}
                          onChange={(e) =>
                            handleUpdateAttack({ ...atk, name: e.target.value })
                          }
                          className="w-full bg-transparent text-white font-medium focus:outline-none"
                        />
                      </div>

                      <div className="flex items-center border-b border-[#3a3835] pb-1">
                        <span className="text-[#9e9a91] uppercase text-[10px] mr-2 shrink-0">
                          TYPE:
                        </span>
                        <select
                          value={atk.type}
                          onChange={(e) =>
                            handleUpdateAttack({
                              ...atk,
                              type: e.target.value as AttackType,
                            })
                          }
                          className="w-full bg-transparent text-white font-medium focus:outline-none cursor-pointer"
                        >
                          {ATTACK_TYPES.map((t) => (
                            <option key={t} value={t} className="bg-[#18181e]">
                              {t}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Row 2: Reach / Range */}
                    <div className="w-1/2 flex items-center border-b border-[#3a3835] pb-1 text-xs">
                      <span className="text-[#9e9a91] uppercase text-[10px] mr-2 shrink-0">
                        REACH / RANGE:
                      </span>
                      <input
                        type="text"
                        value={atk.range}
                        onChange={(e) =>
                          handleUpdateAttack({ ...atk, range: e.target.value })
                        }
                        className="w-full bg-transparent text-white font-medium focus:outline-none"
                      />
                    </div>

                    {/* Row 3: ATTACK Calculation (Ability + Bonus + Proficiency = +X) */}
                    <div className="space-y-2 text-xs">
                      <div className="grid grid-cols-12 gap-3 items-center">
                        <div className="col-span-2 text-[#9e9a91] uppercase text-[10px]">
                          ATTACK:
                        </div>
                        <div className="col-span-5 flex items-center border-b border-[#3a3835] pb-1">
                          <span className="text-[#9e9a91] uppercase text-[10px] mr-1.5">
                            ABILITY:
                          </span>
                          <select
                            value={atk.ability}
                            onChange={(e) =>
                              handleUpdateAttack({
                                ...atk,
                                ability: e.target.value as AbilitySelection,
                              })
                            }
                            className="w-full bg-transparent text-white font-medium focus:outline-none cursor-pointer"
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
                        <div className="col-span-5 flex items-center border-b border-[#3a3835] pb-1">
                          <span className="text-[#9e9a91] uppercase text-[10px] mr-1.5">
                            BONUS:
                          </span>
                          <input
                            type="number"
                            value={atk.bonus}
                            onChange={(e) =>
                              handleUpdateAttack({
                                ...atk,
                                bonus: parseInt(e.target.value, 10) || 0,
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
                            value={atk.proficiency}
                            onChange={(e) =>
                              handleUpdateAttack({
                                ...atk,
                                proficiency: e.target.value as ProficiencyLevel,
                              })
                            }
                            className="w-full bg-transparent text-white font-medium focus:outline-none cursor-pointer"
                          >
                            {PROFICIENCY_LEVELS.map((pl) => {
                              const pbVal = getProficiencyBonusValue(
                                sheet.level,
                                pl.value
                              );
                              return (
                                <option
                                  key={pl.value}
                                  value={pl.value}
                                  className="bg-[#18181e]"
                                >
                                  {pl.shortLabel} ({formatSigned(pbVal)})
                                </option>
                              );
                            })}
                          </select>
                        </div>
                        <div className="col-span-5 font-mono-num font-bold text-white text-sm">
                          = {formatSigned(stats.hitBonus)}
                        </div>
                      </div>
                    </div>

                    {/* Row 4: DMG 1 */}
                    <div className="space-y-2 text-xs">
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
                            value={atk.damage1.dice}
                            onChange={(e) =>
                              handleUpdateAttack({
                                ...atk,
                                damage1: {
                                  ...atk.damage1,
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
                            value={atk.damage1.ability}
                            onChange={(e) =>
                              handleUpdateAttack({
                                ...atk,
                                damage1: {
                                  ...atk.damage1,
                                  ability: e.target.value as AbilitySelection,
                                },
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
                      </div>

                      <div className="grid grid-cols-12 gap-3 items-center">
                        <div className="col-span-2" />
                        <div className="col-span-5 flex items-center border-b border-[#3a3835] pb-1">
                          <span className="text-[#9e9a91] uppercase text-[10px] mr-1.5">
                            TYPE:
                          </span>
                          <select
                            value={atk.damage1.type}
                            onChange={(e) =>
                              handleUpdateAttack({
                                ...atk,
                                damage1: {
                                  ...atk.damage1,
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
                        <div className="col-span-5 font-mono-num font-bold text-[#ef4444] text-sm flex items-center gap-1">
                          <span>= {stats.dmg1Formula || '0'}</span>
                          {dmgMeta && <span>{dmgMeta.symbol}</span>}
                        </div>
                      </div>
                    </div>

                    {/* Row 5: DMG 2 (Optional) */}
                    <div className="space-y-2 text-xs">
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
                            value={atk.damage2?.dice || ''}
                            onChange={(e) =>
                              handleUpdateAttack({
                                ...atk,
                                damage2: {
                                  dice: e.target.value,
                                  ability: atk.damage2?.ability || 'None',
                                  type: atk.damage2?.type || '',
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
                            value={atk.damage2?.ability || 'None'}
                            onChange={(e) =>
                              handleUpdateAttack({
                                ...atk,
                                damage2: {
                                  dice: atk.damage2?.dice || '',
                                  ability: e.target.value as AbilitySelection,
                                  type: atk.damage2?.type || '',
                                },
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
                      </div>

                      <div className="grid grid-cols-12 gap-3 items-center">
                        <div className="col-span-2" />
                        <div className="col-span-5 flex items-center border-b border-[#3a3835] pb-1">
                          <span className="text-[#9e9a91] uppercase text-[10px] mr-1.5">
                            TYPE:
                          </span>
                          <select
                            value={atk.damage2?.type || ''}
                            onChange={(e) =>
                              handleUpdateAttack({
                                ...atk,
                                damage2: {
                                  dice: atk.damage2?.dice || '',
                                  ability: atk.damage2?.ability || 'None',
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
                      </div>
                    </div>

                    {/* Advanced Attack Options when toggled */}
                    {advancedAttackMode && (
                      <div className="p-3 rounded bg-[#121216] border border-[#332e24] space-y-2 text-xs">
                        <div className="text-[#d8b467] font-semibold">
                          Configurações Avançadas do Ataque
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-[#9e9a91]"> Origem vinculada:</span>
                          <span className="text-white font-medium">
                            {atk.source?.name || 'Custom'}
                          </span>
                        </div>
                        <div className="text-[11px] text-[#858078]">
                          Nota: Proficiency e Expertise aumentam o bônus numérico de ataque ({formatSigned(stats.profBonus)}). Advantage (2d20 keep highest) é controlado separadamente no seletor de rolagem.
                        </div>
                      </div>
                    )}

                    {/* Description */}
                    <div className="text-xs">
                      <label className="block text-[#9e9a91] uppercase text-[10px] mb-1">
                        DESCRIPTION
                      </label>
                      <textarea
                        rows={3}
                        value={atk.description}
                        onChange={(e) =>
                          handleUpdateAttack({
                            ...atk,
                            description: e.target.value,
                          })
                        }
                        className="w-full rounded border border-[#3a3835] bg-[#121216] p-2 text-white focus:border-[#c8a357] focus:outline-none"
                      />
                    </div>

                    {/* Remove Button */}
                    <button
                      type="button"
                      onClick={() => handleRemoveAttack(atk)}
                      className="inline-flex items-center gap-1.5 text-xs text-[#e07a7a] hover:text-[#f87171] cursor-pointer"
                    >
                      <MinusCircle className="w-4 h-4 fill-[#e07a7a]/20" />
                      <span>Remove</span>
                    </button>
                  </div>
                );
              }

              // COMPACT ATTACK ROW matching Screenshot 6
              return (
                <div key={atk.id} className="py-2.5">
                  <div className="grid grid-cols-12 items-center gap-1 text-xs">
                    {/* Name */}
                    <div className="col-span-5 pr-1">
                      <button
                        type="button"
                        onClick={() =>
                          stats.hasHitRoll
                            ? onRollAttack(
                                atk.name,
                                stats.hitBonus,
                                stats.dmg1Formula,
                                atk.damage1.type || 'Damage'
                              )
                            : onRollDamageOnly(
                                atk.name,
                                stats.dmg1Formula,
                                atk.damage1.type || 'Damage'
                              )
                        }
                        className="text-left font-semibold text-white hover:text-[#f0cd7e] transition-colors cursor-pointer flex items-center gap-1.5"
                        title="Clique para rolar este ataque"
                      >
                        <span>{atk.name}</span>
                      </button>
                      {atk.sourceEquipmentId && (
                        <div className="text-[10px] text-[#78746d]">
                          Equip: {atk.source?.name}
                        </div>
                      )}
                    </div>

                    {/* Range */}
                    <div className="col-span-2 text-center text-[11px] text-[#9e9a91] font-mono-num">
                      {atk.range || '—'}
                    </div>

                    {/* Hit / DC */}
                    <div className="col-span-2 text-center">
                      {stats.hasHitRoll ? (
                        <button
                          type="button"
                          onClick={() =>
                            onRollAttack(
                              atk.name,
                              stats.hitBonus,
                              stats.dmg1Formula,
                              atk.damage1.type || 'Damage'
                            )
                          }
                          className="font-mono-num font-bold text-[#e5c172] hover:underline cursor-pointer"
                        >
                          {formatSigned(stats.hitBonus)} Attack
                        </button>
                      ) : (
                        <span className="text-[#6e6a63]">—</span>
                      )}
                    </div>

                    {/* Damage */}
                    <div className="col-span-2 text-right">
                      {stats.dmg1Formula ? (
                        <button
                          type="button"
                          onClick={() =>
                            onRollDamageOnly(
                              atk.name,
                              stats.dmg1Formula,
                              atk.damage1.type || 'Damage'
                            )
                          }
                          className="inline-flex items-center justify-end gap-1 font-mono-num font-bold text-[#f87171] hover:underline cursor-pointer"
                          title={`Dano ${atk.damage1.type || ''}`}
                        >
                          <span>{stats.dmg1Formula}</span>
                          {dmgMeta && (
                            <span className="text-xs">{dmgMeta.symbol}</span>
                          )}
                        </button>
                      ) : (
                        <span className="text-[#6e6a63]">—</span>
                      )}
                      {stats.typedDmgMods.map((tm) => (
                        <div
                          key={tm.id}
                          className="text-[10px] font-mono-num text-[#facc15]"
                        >
                          +{tm.value} {tm.damageType}
                        </div>
                      ))}
                    </div>

                    {/* Edit & Expand Icons */}
                    <div className="col-span-1 flex items-center justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => setEditingAttackId(atk.id)}
                        className="p-1 text-[#8c877e] hover:text-white cursor-pointer"
                        aria-label={`Editar ${atk.name}`}
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedAttackId(isExpanded ? null : atk.id)
                        }
                        className="p-1 text-[#8c877e] hover:text-white cursor-pointer"
                        aria-label="Expandir detalhes do ataque"
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
                    <div className="mt-2 p-2.5 rounded bg-[#18181e] border border-[#28272e] text-xs text-[#b8b4ac] space-y-1">
                      <div className="flex flex-wrap gap-3 text-[11px] text-[#9e9a91]">
                        <span>Tipo: {atk.type}</span>
                        <span>Alcance: {atk.range}</span>
                        <span>Atributo: {atk.ability}</span>
                        <span>Proficiência: {atk.proficiency}</span>
                      </div>
                      {atk.description && <p>{atk.description}</p>}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 6.2 WEAPON MASTERY SECTION matching Screenshot 6 */}
      {(filterView === 'All' || filterView === 'Attacks') && (
        <div>
          <div className="flex items-center justify-between pb-2 border-b border-[#2c2a27] text-xs">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5 font-display font-bold tracking-wider text-[#d8b467] uppercase">
                <Lock className="w-3 h-3 text-[#8c877e]" />
                <span>WEAPON MASTERY</span>
              </div>
              <span className="text-[#9e9a91]">Property</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[#9e9a91]">Name</span>
              <button
                type="button"
                onClick={() => setAddingMastery((p) => !p)}
                className="p-1 text-[#a39e93] hover:text-[#e5c172] cursor-pointer"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {addingMastery && (
            <div className="my-2 p-3 rounded border border-[#4a3f28] bg-[#18181e] space-y-2.5 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="Propriedade (ex: Vex, Nick, Slow)"
                  value={newMastery.property}
                  onChange={(e) =>
                    setNewMastery({ ...newMastery, property: e.target.value })
                  }
                  className="px-2.5 py-1.5 rounded bg-[#101014] border border-[#33312e] text-white"
                />
                <input
                  type="text"
                  placeholder="Arma (ex: Rapier)"
                  value={newMastery.weapon}
                  onChange={(e) =>
                    setNewMastery({ ...newMastery, weapon: e.target.value })
                  }
                  className="px-2.5 py-1.5 rounded bg-[#101014] border border-[#33312e] text-white"
                />
              </div>
              <input
                type="text"
                placeholder="Efeito da Maestria..."
                value={newMastery.effect}
                onChange={(e) =>
                  setNewMastery({ ...newMastery, effect: e.target.value })
                }
                className="w-full px-2.5 py-1.5 rounded bg-[#101014] border border-[#33312e] text-white"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setAddingMastery(false)}
                  className="px-2.5 py-1 rounded text-[#9e9a91]"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (!newMastery.weapon.trim()) return;
                    onUpdateSheet((prev) => ({
                      ...prev,
                      weaponMasteries: [
                        ...prev.weaponMasteries,
                        { ...newMastery, id: `wm-${Date.now()}` },
                      ],
                    }));
                    setAddingMastery(false);
                  }}
                  className="px-3 py-1 rounded bg-[#8a6f3b] text-white font-semibold cursor-pointer"
                >
                  Save
                </button>
              </div>
            </div>
          )}

          {sheet.weaponMasteries.length === 0 ? (
            <p className="py-2 text-xs text-[#6e6a63]">No Masteries</p>
          ) : (
            <div className="divide-y divide-[#201f25]">
              {sheet.weaponMasteries.map((wm) => (
                <div
                  key={wm.id}
                  className="py-2.5 flex items-center justify-between text-xs"
                >
                  <div>
                    <span className="font-semibold text-[#e5c172]">
                      {wm.property}
                    </span>
                    <span className="text-[#8c877e] mx-2">—</span>
                    <span className="text-white font-medium">{wm.weapon}</span>
                    {wm.effect && (
                      <p className="text-[11px] text-[#9e9a91] mt-0.5">
                        {wm.effect}
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      onUpdateSheet((prev) => ({
                        ...prev,
                        weaponMasteries: prev.weaponMasteries.filter(
                          (x) => x.id !== wm.id
                        ),
                      }))
                    }
                    className="text-[#78746d] hover:text-[#f87171] p-1 cursor-pointer"
                  >
                    <MinusCircle className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 6.3 EFFECTS SECTION matching Screenshot 6 */}
      {(filterView === 'All' || filterView === 'Effects') && (
        <div>
          <div className="grid grid-cols-12 items-center pb-2 border-b border-[#2c2a27] text-xs">
            <div className="col-span-5 flex items-center gap-1.5 font-display font-bold tracking-wider text-[#d8b467] uppercase">
              <Lock className="w-3 h-3 text-[#8c877e]" />
              <span>EFFECT</span>
            </div>
            <div className="col-span-2 text-center text-[#9e9a91] text-[11px]">
              Mod
            </div>
            <div className="col-span-3 text-left text-[#9e9a91] text-[11px]">
              Affects
            </div>
            <div className="col-span-2 flex justify-end">
              <button
                type="button"
                onClick={() => setAddingEffect((p) => !p)}
                className="p-1 text-[#a39e93] hover:text-[#e5c172] cursor-pointer"
                title="Adicionar Efeito Ativável (ex: Ascendant Mode)"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {addingEffect && (
            <div className="my-2 p-3 rounded border border-[#4a3f28] bg-[#18181e] space-y-2.5 text-xs">
              <div className="font-semibold text-[#d8b467]">
                Novo Efeito de Combate (ON/OFF)
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <input
                  type="text"
                  placeholder="Nome (ex: Ascendant Mode)"
                  value={effectDraft.name}
                  onChange={(e) =>
                    setEffectDraft({ ...effectDraft, name: e.target.value })
                  }
                  className="px-2.5 py-1.5 rounded bg-[#101014] border border-[#33312e] text-white"
                />
                <select
                  value={effectDraft.target}
                  onChange={(e) =>
                    setEffectDraft({
                      ...effectDraft,
                      target: e.target.value as ModifierTarget,
                    })
                  }
                  className="px-2.5 py-1.5 rounded bg-[#101014] border border-[#33312e] text-white"
                >
                  <option value="Damage">Afeta: Damage</option>
                  <option value="Attack">Afeta: Attack</option>
                  <option value="AC">Afeta: AC</option>
                  <option value="Initiative">Afeta: Initiative</option>
                  <option value="SavingThrow">Afeta: Saving Throw</option>
                  <option value="Speed">Afeta: Speed</option>
                </select>
                <input
                  type="number"
                  placeholder="Modificador (ex: 2)"
                  value={effectDraft.value}
                  onChange={(e) =>
                    setEffectDraft({
                      ...effectDraft,
                      value: parseInt(e.target.value, 10) || 0,
                    })
                  }
                  className="px-2.5 py-1.5 rounded bg-[#101014] border border-[#33312e] text-white font-mono-num"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setAddingEffect(false)}
                  className="px-2.5 py-1 text-[#9e9a91]"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveNewEffect}
                  className="px-3 py-1 rounded bg-[#8a6f3b] text-white font-semibold cursor-pointer"
                >
                  Adicionar Efeito
                </button>
              </div>
            </div>
          )}

          <div className="divide-y divide-[#201f25]">
            {sheet.combatEffects.map((eff) => {
              const isExpanded = editingEffectId === eff.id;
              return (
                <div key={eff.id} className="py-2.5 text-xs">
                  <div className="grid grid-cols-12 items-center gap-1">
                    {/* Toggle + Name */}
                    <div className="col-span-5 flex items-center gap-2.5">
                      <button
                        type="button"
                        role="switch"
                        aria-checked={eff.active}
                        onClick={() => handleToggleEffect(eff.id)}
                        className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors cursor-pointer ${
                          eff.active ? 'bg-[#a12a2a]' : 'bg-[#2e2d35]'
                        }`}
                      >
                        <span
                          className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                            eff.active ? 'translate-x-4' : 'translate-x-1'
                          }`}
                        />
                      </button>
                      <span className="font-semibold text-white">
                        {eff.name}
                      </span>
                    </div>

                    {/* Mod */}
                    <div className="col-span-2 text-center font-mono-num text-[#b8b4ac]">
                      {eff.modDisplay}
                    </div>

                    {/* Affects */}
                    <div className="col-span-3 text-[#b8b4ac]">
                      {eff.affects}
                    </div>

                    {/* Edit / Expand */}
                    <div className="col-span-2 flex items-center justify-end gap-1">
                      <button
                        type="button"
                        onClick={() =>
                          setEditingEffectId(isExpanded ? null : eff.id)
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
                    <div className="mt-2 p-2.5 rounded bg-[#18181e] border border-[#28272e] flex items-center justify-between text-xs text-[#9e9a91]">
                      <span>
                        {eff.description || 'Modificador temporário de combate.'}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          onUpdateSheet((prev) => ({
                            ...prev,
                            combatEffects: prev.combatEffects.filter(
                              (x) => x.id !== eff.id
                            ),
                          }))
                        }
                        className="text-[#f87171] hover:underline ml-3 shrink-0 cursor-pointer"
                      >
                        Remover
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* MAGIAS ATIVAS (cantrips + magias marcadas como ativas) */}
      {(filterView === 'All' || filterView === 'Attacks') && (
        <div>
          <div className="grid grid-cols-12 items-center pb-2 border-b border-[#2c2a27] text-xs">
            <div className="col-span-6 flex items-center gap-1.5 font-display font-bold tracking-wider text-[#d8b467] uppercase">
              <Zap className="w-3 h-3 text-[#d8b467]" />
              <span>MAGIAS ATIVAS</span>
              <span className="text-[#9e9a91] font-normal normal-case">
                ({activeSpells.length})
              </span>
            </div>
            <div className="col-span-2 text-center text-[#9e9a91] text-[11px]">
              Mana
            </div>
            <div className="col-span-2 text-center text-[#9e9a91] text-[11px]">
              Calor
            </div>
            <div className="col-span-2 flex justify-end" />
          </div>

          {activeSpells.length === 0 ? (
            <p className="py-3 text-xs text-[#6e6a63]">
              Nenhuma magia ativa. Marque uma magia como "Ativa" ou use um
              truque (cantrip) para vê-la aqui.
            </p>
          ) : (
            <div className="divide-y divide-[#201f25]">
              {activeSpells.map((sp) => {
                const stats = calculateSpellStats(sp, sheet, abilities);
                const manaLvlCost = (sp.level || 0) * 5;
                const manaCost =
                  sp.manaCost !== undefined && sp.manaCost >= 5
                    ? sp.manaCost
                    : manaLvlCost;
                const heatCost = sp.heatGenerated ?? sp.level;
                const isCantrip = (sp.level || 0) === 0;
                const blocked = sp.gmApproved === false;
                const outOfMana = isCantrip
                  ? false
                  : sheet.manaCurrent < manaCost;
                const overHeat =
                  isCantrip
                    ? false
                    : sheet.heatMax > 0 &&
                      sheet.heatCurrent + heatCost > sheet.heatMax;

                return (
                  <div
                    key={sp.id}
                    className="py-3 grid grid-cols-12 items-center gap-1 text-xs"
                  >
                    <div className="col-span-6 pr-2">
                      <div className="font-semibold text-white flex items-center gap-2">
                        <span>{sp.name}</span>
                        {sp.level === 0 && (
                          <span className="px-1.5 py-0.5 rounded bg-[#18181e] border border-[#5c4b2b] text-[10px] text-[#e5c172]">
                            Truque
                          </span>
                        )}
                        {blocked && (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-[#2a1414] border border-[#7c2d2d] text-[10px] text-[#f87171]">
                            <Lock className="w-3 h-3" />
                            Aguardando Aprovação
                          </span>
                        )}
                      </div>
                      {sp.school && (
                        <div className="text-[10px] text-[#78746d] mt-0.5">
                          {sp.school}
                          {stats.dmg1Formula && (
                            <span className="text-[#f87171] font-mono-num">
                              {' '}
                              · Dano: {stats.dmg1Formula}
                              {stats.dmg2Formula
                                ? ` + ${stats.dmg2Formula}`
                                : ''}
                            </span>
                          )}
                          {!isCantrip && !stats.dmg1Formula && (
                            <span className="text-[#b8b4ac]">
                              {' '}
                              · Save DC {stats.spellSaveDC}
                            </span>
                          )}
                        </div>
                      )}
                      {sp.description && (
                        <p className="text-[11px] text-[#9e9a91] mt-0.5 line-clamp-2">
                          {sp.description}
                        </p>
                      )}
                    </div>

                    <div className="col-span-2 text-center font-mono-num text-[#b8b4ac]">
                      {isCantrip ? '—' : manaCost}
                    </div>

                    <div className="col-span-2 text-center font-mono-num text-[#b8b4ac]">
                      {isCantrip ? '—' : heatCost}
                    </div>

                    <div className="col-span-2 flex justify-end">
                      {(stats.dmg1Formula ||
                        stats.dmg2Formula ||
                        stats.healFormula) && (
                        <button
                          type="button"
                          disabled={blocked || outOfMana || overHeat}
                          onClick={() => handleCastSpell(sp.id)}
                          title={
                            blocked
                              ? 'Aguardando aprovação do GM'
                              : outOfMana
                                ? 'Mana insuficiente'
                                : overHeat
                                  ? 'Excederia o limite de Calor'
                                  : 'Conjurar e rolar'
                          }
                          className="px-2.5 py-1 rounded bg-[#8a6f3b] hover:bg-[#a38447] disabled:opacity-40 disabled:cursor-not-allowed text-white text-[11px] font-semibold cursor-pointer"
                        >
                          Conjurar
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 6.4 - 6.7 ACTIONS, BONUS ACTIONS, REACTIONS, FREE ACTIONS matching Screenshot 6 */}
      {(filterView === 'All' || filterView === 'Actions') && (
        <div className="space-y-5">
          {(
            [
              'Actions',
              'Bonus Actions',
              'Reactions',
              'Free Actions',
            ] as CombatActionItem['category'][]
          ).map((cat) => {
            const catItems = sheet.combatActions.filter(
              (ca) => ca.category === cat
            );

            return (
              <div key={cat}>
                <div className="grid grid-cols-12 items-center pb-2 border-b border-[#2c2a27] text-xs">
                  <div className="col-span-5 flex items-center gap-1.5 font-display font-bold tracking-wider text-[#d8b467] uppercase">
                    <Lock className="w-3 h-3 text-[#8c877e]" />
                    <span>{cat.toUpperCase()}</span>
                  </div>
                  <div className="col-span-5 text-[#9e9a91] text-[11px]">
                    Details
                  </div>
                  <div className="col-span-2 flex justify-end">
                    <button
                      type="button"
                      onClick={() =>
                        setAddingActionCat(addingActionCat === cat ? null : cat)
                      }
                      className="p-1 text-[#a39e93] hover:text-[#e5c172] cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Inline Creator for this Action Category */}
                {addingActionCat === cat && (
                  <div className="my-2 p-3 rounded border border-[#4a3f28] bg-[#18181e] space-y-2 text-xs">
                    <div className="font-semibold text-[#d8b467]">
                      Adicionar em {cat}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <input
                        type="text"
                        placeholder="Nome da Ação / Reação..."
                        value={actionDraft.name}
                        onChange={(e) =>
                          setActionDraft({
                            ...actionDraft,
                            name: e.target.value,
                          })
                        }
                        className="px-2.5 py-1.5 rounded bg-[#101014] border border-[#33312e] text-white"
                      />
                      <input
                        type="number"
                        min={0}
                        placeholder="Usos por descanso (0 = ilimitado)"
                        value={actionDraft.usesMax || ''}
                        onChange={(e) =>
                          setActionDraft({
                            ...actionDraft,
                            usesMax: parseInt(e.target.value, 10) || 0,
                          })
                        }
                        className="px-2.5 py-1.5 rounded bg-[#101014] border border-[#33312e] text-white font-mono-num"
                      />
                    </div>
                    {cat === 'Reactions' && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <input
                          type="text"
                          placeholder="Trigger (Gatilho da reação)"
                          value={actionDraft.trigger}
                          onChange={(e) =>
                            setActionDraft({
                              ...actionDraft,
                              trigger: e.target.value,
                            })
                          }
                          className="px-2.5 py-1.5 rounded bg-[#101014] border border-[#33312e] text-white"
                        />
                        <input
                          type="text"
                          placeholder="Requirements (Requisitos)"
                          value={actionDraft.requirements}
                          onChange={(e) =>
                            setActionDraft({
                              ...actionDraft,
                              requirements: e.target.value,
                            })
                          }
                          className="px-2.5 py-1.5 rounded bg-[#101014] border border-[#33312e] text-white"
                        />
                      </div>
                    )}
                    <textarea
                      rows={2}
                      placeholder="Descrição / Efeito..."
                      value={actionDraft.details}
                      onChange={(e) =>
                        setActionDraft({
                          ...actionDraft,
                          details: e.target.value,
                        })
                      }
                      className="w-full px-2.5 py-1.5 rounded bg-[#101014] border border-[#33312e] text-white"
                    />
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setAddingActionCat(null)}
                        className="px-2.5 py-1 text-[#9e9a91]"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleSaveNewAction}
                        className="px-3 py-1 rounded bg-[#8a6f3b] text-white font-semibold cursor-pointer"
                      >
                        Salvar
                      </button>
                    </div>
                  </div>
                )}

                <div className="divide-y divide-[#201f25]">
                  {/* Standard Actions in Combat row for 'Actions' category matching Screenshot 6 */}
                  {cat === 'Actions' && (
                    <div className="py-3 text-xs">
                      <div className="grid grid-cols-12 items-start gap-2">
                        <div className="col-span-4 font-semibold text-white">
                          Actions in Combat
                        </div>
                        <div className="col-span-7 text-[#9e9a91] leading-relaxed">
                          Attack, Dash, Disengage, Dodge, Help, Influence, Magic,
                          Ready, Search, Study, Utilize
                        </div>
                        <div className="col-span-1 flex justify-end">
                          <button
                            type="button"
                            onClick={() =>
                              setExpandedBaseActions((prev) => !prev)
                            }
                            className="p-1 text-[#8c877e] hover:text-white cursor-pointer"
                          >
                            {expandedBaseActions ? (
                              <ChevronUp className="w-3.5 h-3.5" />
                            ) : (
                              <ChevronDown className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </div>

                      {expandedBaseActions && (
                        <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 p-2.5 rounded bg-[#18181e] border border-[#28272e]">
                          {BASE_COMBAT_ACTIONS.map((ba) => (
                            <div
                              key={ba.name}
                              className="p-2 rounded bg-[#121216] border border-[#222126]"
                            >
                              <div className="font-semibold text-[#e5c172]">
                                {ba.name}
                              </div>
                              <div className="text-[11px] text-[#9e9a91] mt-0.5">
                                {ba.details}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {catItems.map((item) => {
                    const isExp = expandedActionIds.includes(item.id);
                    return (
                      <div key={item.id} className="py-3 text-xs">
                        <div className="grid grid-cols-12 items-start gap-2">
                          <div className="col-span-4 pr-1">
                            <div className="font-semibold text-white">
                              {item.name}
                            </div>
                            {item.subtitle && (
                              <div className="text-[10px] text-[#8c877e] mt-0.5">
                                {item.subtitle}
                              </div>
                            )}
                            {/* Usage Checkboxes matching Screenshot 6 (Second Wind & Action Surge red checkboxes!) */}
                            {item.usesMax && item.usesMax > 0 && (
                              <div className="flex items-center gap-1.5 mt-1.5">
                                {Array.from({ length: item.usesMax }).map(
                                  (_, idx) => {
                                    const checked =
                                      idx < (item.usesCurrent ?? 0);
                                    return (
                                      <button
                                        key={idx}
                                        type="button"
                                        onClick={() =>
                                          onUpdateSheet((prev) => ({
                                            ...prev,
                                            combatActions:
                                              prev.combatActions.map((ca) => {
                                                if (ca.id !== item.id)
                                                  return ca;
                                                const cur =
                                                  ca.usesCurrent ?? 0;
                                                const nextCur =
                                                  idx < cur ? idx : idx + 1;
                                                return {
                                                  ...ca,
                                                  usesCurrent: nextCur,
                                                };
                                              }),
                                          }))
                                        }
                                        className={`w-4 h-4 rounded flex items-center justify-center border text-[10px] font-bold transition-colors cursor-pointer ${
                                          checked
                                            ? 'bg-[#a12a2a] border-[#ef4444] text-white'
                                            : 'bg-[#18181e] border-[#3a3835] text-transparent'
                                        }`}
                                      >
                                        ✓
                                      </button>
                                    );
                                  }
                                )}
                              </div>
                            )}
                          </div>

                          <div className="col-span-6 text-[#9e9a91] leading-relaxed">
                            <p className={isExp ? '' : 'line-clamp-2'}>
                              {item.details}
                            </p>
                            {isExp && (
                              <div className="mt-2 space-y-1 text-[11px] text-[#c7bfa8]">
                                {item.trigger && (
                                  <div>
                                    <strong className="text-[#e5c172]">
                                      Trigger:
                                    </strong>{' '}
                                    {item.trigger}
                                  </div>
                                )}
                                {item.requirements && (
                                  <div>
                                    <strong className="text-[#e5c172]">
                                      Requirements:
                                    </strong>{' '}
                                    {item.requirements}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>

                          <div className="col-span-2 flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => toggleActionExpanded(item.id)}
                              className="p-1 text-[#8c877e] hover:text-white cursor-pointer"
                            >
                              {isExp ? (
                                <ChevronUp className="w-3.5 h-3.5" />
                              ) : (
                                <ChevronDown className="w-3.5 h-3.5" />
                              )}
                            </button>
                            {item.source?.type === 'Custom' && (
                              <button
                                type="button"
                                onClick={() =>
                                  onUpdateSheet((prev) => ({
                                    ...prev,
                                    combatActions: prev.combatActions.filter(
                                      (x) => x.id !== item.id
                                    ),
                                  }))
                                }
                                className="p-1 text-[#78746d] hover:text-[#f87171] cursor-pointer"
                              >
                                <MinusCircle className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
