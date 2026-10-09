import React, { useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  Copy,
  Lock,
  Minus,
  MinusCircle,
  Pencil,
  Plus,
  Search,
  Settings,
} from 'lucide-react';
import {
  AbilityKey,
  AbilitySelection,
  AttackItem,
  CharacterSheetState,
  CurrencyState,
  DamageType,
  EquipmentItem,
  EquipmentType,
  PossessionItem,
  ProficiencyLevel,
  WeaponCategory,
  WeaponRangeType,
} from '../types/rpg';
import {
  ABILITY_KEYS,
  DAMAGE_TYPE_META,
  DAMAGE_TYPES,
  EQUIPMENT_TYPES,
  MARTIAL_WEAPONS,
  PROFICIENCY_LEVELS,
  SIMPLE_WEAPONS,
} from '../data/constants';
import {
  calculateAttackStats,
  calculateInventoryWeights,
  ComputedAbility,
  formatSigned,
  getProficiencyBonusValue,
} from '../utils/calculations';

interface InventorySectionProps {
  sheet: CharacterSheetState;
  abilities: Record<AbilityKey, ComputedAbility>;
  onUpdateSheet: (updater: (prev: CharacterSheetState) => CharacterSheetState) => void;
}

const CURRENCY_ORDER: { key: keyof CurrencyState; label: string }[] = [
  { key: 'copper', label: 'Copper:' },
  { key: 'silver', label: 'Silver:' },
  { key: 'electrum', label: 'Electrum:' },
  { key: 'gold', label: 'Gold:' },
  { key: 'platinum', label: 'Platinum:' },
];

export const InventorySection: React.FC<InventorySectionProps> = ({
  sheet,
  abilities,
  onUpdateSheet,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterView, setFilterView] = useState<
    'All' | 'Equipment' | 'Attunement' | 'Possessions'
  >('All');
  const [editingEqId, setEditingEqId] = useState<string | null>(null);
  const [expandedEqId, setExpandedEqId] = useState<string | null>(null);
  const [advancedEqMode, setAdvancedEqMode] = useState(false);
  // Track which embedded attacks are expanded inside the Equipment Editor
  const [collapsedSubAttackIds, setCollapsedSubAttackIds] = useState<string[]>([
    'atk-rapier-2',
  ]);

  // Other Possessions state
  const [addingPossession, setAddingPossession] = useState(false);
  const [newPossession, setNewPossession] = useState<Omit<PossessionItem, 'id'>>({
    name: '',
    quantity: 1,
    unitWeight: 0,
    description: '',
  });

  const weights = calculateInventoryWeights(sheet);

  const handleCurrencyChange = (key: keyof CurrencyState, val: number) => {
    onUpdateSheet((prev) => ({
      ...prev,
      currency: {
        ...prev.currency,
        [key]: Math.max(0, val),
      },
    }));
  };

  const handleUpdateEquipment = (updated: EquipmentItem) => {
    onUpdateSheet((prev) => ({
      ...prev,
      equipment: prev.equipment.map((eq) =>
        eq.id === updated.id ? updated : eq
      ),
    }));
  };

  const handleAddEquipment = () => {
    const newId = `eq-custom-${Date.now()}`;
    const newAtkId = `atk-eq-${Date.now()}`;
    const newEq: EquipmentItem = {
      id: newId,
      name: 'Novo Equipamento',
      type: 'Weapon',
      equipped: true,
      quantity: 1,
      unitWeight: 2,
      rangeType: 'Melee',
      weaponCategory: 'Martial',
      weaponType: 'Rapier',
      requiresAttunement: false,
      attuned: false,
      description: '',
      source: { type: 'Custom', name: 'Inventário' },
      attacks: [
        {
          id: newAtkId,
          name: 'Novo Ataque',
          type: 'Melee',
          range: '5 ft.',
          ability: 'DEX',
          bonus: 0,
          proficiency: 'Proficient',
          damage1: { dice: '1d8', ability: 'DEX', type: 'Piercing' },
          description: '',
          sourceEquipmentId: newId,
        },
      ],
    };
    onUpdateSheet((prev) => ({
      ...prev,
      equipment: [...prev.equipment, newEq],
    }));
    setEditingEqId(newId);
  };

  const handleAddAttackToEquipment = (eq: EquipmentItem) => {
    const newAtk: AttackItem = {
      id: `atk-eq-${Date.now()}`,
      name: `${eq.name} (Attack ${eq.attacks.length + 1})`,
      type: eq.rangeType === 'Ranged' ? 'Ranged' : 'Melee',
      range: eq.rangeType === 'Ranged' ? '80/320 ft.' : '5 ft.',
      ability: eq.rangeType === 'Ranged' ? 'DEX' : 'STR',
      bonus: 0,
      proficiency: 'Proficient',
      damage1: { dice: '1d8', ability: 'STR', type: 'Slashing' },
      description: '',
      sourceEquipmentId: eq.id,
    };
    handleUpdateEquipment({
      ...eq,
      attacks: [...eq.attacks, newAtk],
    });
  };

  const handleDuplicateAttackInEquipment = (
    eq: EquipmentItem,
    atk: AttackItem
  ) => {
    const copy: AttackItem = {
      ...atk,
      id: `atk-eq-${Date.now()}`,
      name: `${atk.name} (Copy)`,
    };
    handleUpdateEquipment({
      ...eq,
      attacks: [...eq.attacks, copy],
    });
  };

  const toggleSubAttackCollapse = (atkId: string) => {
    setCollapsedSubAttackIds((prev) =>
      prev.includes(atkId)
        ? prev.filter((id) => id !== atkId)
        : [...prev, atkId]
    );
  };

  const filteredEquipment = sheet.equipment.filter((eq) =>
    eq.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const attunableItems = sheet.equipment.filter((eq) => eq.requiresAttunement);

  return (
    <div className="rounded-lg border border-[#786137] bg-[#141418] p-4 shadow-lg space-y-5">
      {/* 11.1 CURRENCY TOP CARD matching Screenshot 11 (Copper -> Silver -> Electrum -> Gold -> Platinum) */}
      <div className="rounded-lg border border-[#3a3835] bg-[#18181d] p-3">
        <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-5">
          {CURRENCY_ORDER.map((c) => {
            const val = sheet.currency[c.key];
            return (
              <div key={c.key} className="flex items-center gap-1.5 text-xs">
                <span className="text-[#b8b4ac] font-medium">{c.label}</span>
                <div className="inline-flex items-center rounded border border-[#3a3835] bg-[#121216] px-2 py-1">
                  <input
                    type="number"
                    min={0}
                    value={val}
                    onChange={(e) =>
                      handleCurrencyChange(
                        c.key,
                        parseInt(e.target.value, 10) || 0
                      )
                    }
                    aria-label={c.label}
                    className="w-10 text-center bg-transparent font-mono-num font-bold text-white focus:outline-none"
                  />
                  <div className="flex flex-col ml-1 text-[#8c877e]">
                    <button
                      type="button"
                      onClick={() => handleCurrencyChange(c.key, val + 1)}
                      className="hover:text-white leading-none cursor-pointer"
                    >
                      <ChevronUp className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleCurrencyChange(c.key, val - 1)}
                      className="hover:text-white leading-none cursor-pointer"
                    >
                      <ChevronDown className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Search & Filter Row matching Screenshot 11 */}
      <div className="flex items-center gap-2">
        <div className="flex-1 flex items-center rounded border border-[#3a3835] bg-[#101014] px-3 py-1.5">
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
            aria-label="Filtrar inventário"
            className="bg-transparent text-xs text-[#b8b4ac] border-l border-[#2c2a27] pl-2 ml-2 focus:outline-none cursor-pointer"
          >
            <option value="All" className="bg-[#16161b]">
              Show: All
            </option>
            <option value="Equipment" className="bg-[#16161b]">
              Show: Equipment
            </option>
            <option value="Attunement" className="bg-[#16161b]">
              Show: Attunement
            </option>
            <option value="Possessions" className="bg-[#16161b]">
              Show: Possessions
            </option>
          </select>
        </div>
      </div>

      {/* Total Weight Display matching Screenshot 11 */}
      <div className="text-xs text-[#b8b4ac]">
        <strong className="text-white">
          Total Weight: {weights.totalWeight} lbs
        </strong>{' '}
        ({weights.encumberedStatus})
      </div>

      {/* 12–19 EQUIPMENT SECTION matching Screenshots 11, 12, 13 */}
      {(filterView === 'All' || filterView === 'Equipment') && (
        <div>
          <div className="flex items-center justify-between pb-1 border-b border-[#2c2a27] text-xs">
            <div className="flex items-center gap-2">
              <Lock className="w-3 h-3 text-[#8c877e]" />
              <span className="font-display font-bold tracking-wider text-[#d8b467] uppercase">
                EQUIPMENT
              </span>
              <span className="text-[#9e9a91] font-mono-num">
                {weights.equipmentWeight} lbs
              </span>
            </div>
            <button
              type="button"
              onClick={handleAddEquipment}
              className="p-1 text-[#a39e93] hover:text-[#e5c172] cursor-pointer"
              title="Adicionar Equipamento"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-12 items-center py-1.5 text-[11px] text-[#9e9a91] border-b border-[#201f25]">
            <div className="col-span-6">Name</div>
            <div className="col-span-4 text-center">Qty</div>
            <div className="col-span-2" />
          </div>

          <div className="divide-y divide-[#201f25]">
            {filteredEquipment.map((eq) => {
              const isEditing = editingEqId === eq.id;
              const isExpanded = expandedEqId === eq.id;
              const itemTotalWeight = Number(
                ((eq.quantity || 0) * (eq.unitWeight || 0)).toFixed(2)
              );

              if (isEditing) {
                // FULL EQUIPMENT EDITOR matching Screenshots 12 & 13!
                const weaponOptions =
                  eq.weaponCategory === 'Simple'
                    ? SIMPLE_WEAPONS
                    : MARTIAL_WEAPONS;

                return (
                  <div
                    key={eq.id}
                    className="py-4 px-3 my-2 rounded border border-[#5c4b2b] bg-[#18181e] space-y-4 text-xs"
                  >
                    {/* Header Bar */}
                    <div className="flex items-center justify-between pb-2.5 border-b border-[#2a2825]">
                      <span className="font-display font-bold text-xs tracking-wider text-white uppercase">
                        EDIT: {eq.name}
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setAdvancedEqMode((p) => !p)}
                          className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors cursor-pointer ${
                            advancedEqMode
                              ? 'bg-[#2d2516] text-[#f0cd7e] border border-[#c8a357]'
                              : 'text-[#b8b4ac] hover:text-white'
                          }`}
                        >
                          <Settings className="w-3.5 h-3.5 text-[#c8a357]" />
                          <span>Advanced</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingEqId(null)}
                          className="px-3 py-1 rounded bg-[#2e2d35] hover:bg-[#3e3d47] text-white font-bold text-xs uppercase tracking-wider cursor-pointer"
                        >
                          DONE
                        </button>
                      </div>
                    </div>

                    {/* Row 1: Name & Type */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="flex items-center border-b border-[#3a3835] pb-1">
                        <span className="text-[#9e9a91] uppercase text-[10px] mr-2 shrink-0">
                          NAME:
                        </span>
                        <input
                          type="text"
                          value={eq.name}
                          onChange={(e) =>
                            handleUpdateEquipment({
                              ...eq,
                              name: e.target.value,
                            })
                          }
                          className="w-full bg-transparent text-white font-medium focus:outline-none"
                        />
                      </div>

                      <div className="flex items-center border-b border-[#3a3835] pb-1">
                        <span className="text-[#9e9a91] uppercase text-[10px] mr-2 shrink-0">
                          TYPE:
                        </span>
                        <select
                          value={eq.type}
                          onChange={(e) =>
                            handleUpdateEquipment({
                              ...eq,
                              type: e.target.value as EquipmentType,
                            })
                          }
                          className="w-full bg-transparent text-white font-medium focus:outline-none cursor-pointer"
                        >
                          {EQUIPMENT_TYPES.map((t) => (
                            <option key={t} value={t} className="bg-[#18181e]">
                              {t}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* 14. WEAPON PROPERTIES when Type === 'Weapon' matching Screenshot 12 */}
                    {eq.type === 'Weapon' && (
                      <div className="space-y-3 pt-1">
                        <div className="flex flex-wrap items-center justify-between gap-4">
                          {/* Melee / Ranged Radios */}
                          <div className="flex items-center gap-4">
                            {(['Melee', 'Ranged'] as WeaponRangeType[]).map(
                              (rt) => {
                                const selected = (eq.rangeType || 'Melee') === rt;
                                return (
                                  <button
                                    key={rt}
                                    type="button"
                                    onClick={() =>
                                      handleUpdateEquipment({
                                        ...eq,
                                        rangeType: rt,
                                      })
                                    }
                                    className="inline-flex items-center gap-1.5 cursor-pointer"
                                  >
                                    <span
                                      className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                                        selected
                                          ? 'border-[#ef4444] bg-[#991b1b]'
                                          : 'border-[#524e46] bg-transparent'
                                      }`}
                                    >
                                      {selected && (
                                        <span className="w-1.5 h-1.5 rounded-full bg-white" />
                                      )}
                                    </span>
                                    <span className="text-white">{rt}</span>
                                  </button>
                                );
                              }
                            )}
                          </div>

                          {/* Simple / Martial Radios */}
                          <div className="flex items-center gap-4">
                            {(['Simple', 'Martial'] as WeaponCategory[]).map(
                              (wc) => {
                                const selected =
                                  (eq.weaponCategory || 'Martial') === wc;
                                return (
                                  <button
                                    key={wc}
                                    type="button"
                                    onClick={() =>
                                      handleUpdateEquipment({
                                        ...eq,
                                        weaponCategory: wc,
                                        weaponType:
                                          wc === 'Simple'
                                            ? SIMPLE_WEAPONS[0]
                                            : MARTIAL_WEAPONS[0],
                                      })
                                    }
                                    className="inline-flex items-center gap-1.5 cursor-pointer"
                                  >
                                    <span
                                      className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                                        selected
                                          ? 'border-[#ef4444] bg-[#991b1b]'
                                          : 'border-[#524e46] bg-transparent'
                                      }`}
                                    >
                                      {selected && (
                                        <span className="w-1.5 h-1.5 rounded-full bg-white" />
                                      )}
                                    </span>
                                    <span className="text-white">{wc}</span>
                                  </button>
                                );
                              }
                            )}
                          </div>
                        </div>

                        {/* Weapon Type Dropdown */}
                        <div className="w-full sm:w-1/2 flex items-center border-b border-[#3a3835] pb-1">
                          <span className="text-[#9e9a91] uppercase text-[10px] mr-2 shrink-0">
                            WEAPON TYPE:
                          </span>
                          <select
                            value={eq.weaponType || 'Rapier'}
                            onChange={(e) =>
                              handleUpdateEquipment({
                                ...eq,
                                weaponType: e.target.value,
                              })
                            }
                            className="w-full bg-transparent text-white font-medium focus:outline-none cursor-pointer"
                          >
                            {weaponOptions.map((w) => (
                              <option
                                key={w}
                                value={w}
                                className="bg-[#18181e]"
                              >
                                {w}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    )}

                    {/* 15 & 16. EMBEDDED ATTACKS IN EQUIPMENT (Auto-synced to Combat!) */}
                    <div className="space-y-3 pt-2 border-t border-[#26252b]">
                      {eq.attacks.map((atk) => {
                        const isSubCollapsed = collapsedSubAttackIds.includes(
                          atk.id
                        );
                        const atkStats = calculateAttackStats(
                          atk,
                          sheet,
                          abilities
                        );
                        const dmgMeta = atk.damage1.type
                          ? DAMAGE_TYPE_META[atk.damage1.type]
                          : null;

                        const updateThisSubAttack = (updatedAtk: AttackItem) => {
                          handleUpdateEquipment({
                            ...eq,
                            attacks: eq.attacks.map((a) =>
                              a.id === updatedAtk.id ? updatedAtk : a
                            ),
                          });
                        };

                        if (isSubCollapsed) {
                          // Collapsed Attack Bar matching Screenshot 12 ("RAPIER (ATTACK 2) v")
                          return (
                            <div
                              key={atk.id}
                              onClick={() => toggleSubAttackCollapse(atk.id)}
                              className="flex items-center justify-between py-2 px-2.5 rounded bg-[#141418] border border-[#2a2825] hover:border-[#5c4b2b] cursor-pointer"
                            >
                              <span className="font-display text-xs text-[#b8b4ac] uppercase tracking-wider">
                                {atk.name}
                              </span>
                              <ChevronDown className="w-4 h-4 text-[#9e9a91]" />
                            </div>
                          );
                        }

                        return (
                          <div
                            key={atk.id}
                            className="p-3 rounded bg-[#141418] border border-[#2d2b28] space-y-3"
                          >
                            {/* Sub-attack Top Row: Attack Name + Melee/Ranged + Copy/Remove/Collapse */}
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <div className="flex-1 min-w-[160px] flex items-center border-b border-[#3a3835] pb-1">
                                <span className="text-[#9e9a91] uppercase text-[10px] mr-2 shrink-0">
                                  ATTACK NAME:
                                </span>
                                <input
                                  type="text"
                                  value={atk.name}
                                  onChange={(e) =>
                                    updateThisSubAttack({
                                      ...atk,
                                      name: e.target.value,
                                    })
                                  }
                                  className="w-full bg-transparent text-white font-medium focus:outline-none"
                                />
                              </div>

                              <div className="flex items-center gap-3">
                                <div className="flex flex-col gap-1">
                                  {(['Melee', 'Ranged'] as const).map((mType) => {
                                    const sel = atk.type === mType;
                                    return (
                                      <button
                                        key={mType}
                                        type="button"
                                        onClick={() =>
                                          updateThisSubAttack({
                                            ...atk,
                                            type: mType,
                                          })
                                        }
                                        className="inline-flex items-center gap-1.5 text-[11px] cursor-pointer"
                                      >
                                        <span
                                          className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                                            sel
                                              ? 'border-[#ef4444] bg-[#991b1b]'
                                              : 'border-[#524e46]'
                                          }`}
                                        />
                                        <span className="text-white">
                                          {mType}
                                        </span>
                                      </button>
                                    );
                                  })}
                                </div>

                                <button
                                  type="button"
                                  onClick={() =>
                                    handleDuplicateAttackInEquipment(eq, atk)
                                  }
                                  title="Duplicar ataque nesta arma"
                                  className="p-1 text-[#9e9a91] hover:text-white cursor-pointer"
                                >
                                  <Copy className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleUpdateEquipment({
                                      ...eq,
                                      attacks: eq.attacks.filter(
                                        (a) => a.id !== atk.id
                                      ),
                                    })
                                  }
                                  title="Remover este ataque da arma"
                                  className="p-1 text-[#e07a7a] hover:text-[#f87171] cursor-pointer"
                                >
                                  <MinusCircle className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => toggleSubAttackCollapse(atk.id)}
                                  className="p-1 text-[#9e9a91] hover:text-white cursor-pointer"
                                >
                                  <ChevronUp className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>

                            {/* Attack Formula Row */}
                            <div className="grid grid-cols-12 gap-2 items-center">
                              <div className="col-span-2 text-[#9e9a91] uppercase text-[10px]">
                                ATTACK:
                              </div>
                              <div className="col-span-5 flex items-center border-b border-[#3a3835] pb-1">
                                <span className="text-[#9e9a91] uppercase text-[10px] mr-1">
                                  ABILITY:
                                </span>
                                <select
                                  value={atk.ability}
                                  onChange={(e) =>
                                    updateThisSubAttack({
                                      ...atk,
                                      ability: e.target
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
                              <div className="col-span-5 flex items-center border-b border-[#3a3835] pb-1">
                                <span className="text-[#9e9a91] uppercase text-[10px] mr-1">
                                  BONUS:
                                </span>
                                <input
                                  type="number"
                                  value={atk.bonus}
                                  onChange={(e) =>
                                    updateThisSubAttack({
                                      ...atk,
                                      bonus: parseInt(e.target.value, 10) || 0,
                                    })
                                  }
                                  className="w-full bg-transparent font-mono-num text-white focus:outline-none"
                                />
                              </div>
                            </div>

                            <div className="grid grid-cols-12 gap-2 items-center">
                              <div className="col-span-2" />
                              <div className="col-span-5 flex items-center border-b border-[#3a3835] pb-1">
                                <span className="text-[#9e9a91] uppercase text-[10px] mr-1">
                                  PROFICIENCY:
                                </span>
                                <select
                                  value={atk.proficiency}
                                  onChange={(e) =>
                                    updateThisSubAttack({
                                      ...atk,
                                      proficiency: e.target
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
                              <div className="col-span-5 font-mono-num font-bold text-white">
                                = {formatSigned(atkStats.hitBonus)}
                              </div>
                            </div>

                            {/* DMG 1 */}
                            <div className="grid grid-cols-12 gap-2 items-center">
                              <div className="col-span-2 text-[#9e9a91] uppercase text-[10px]">
                                DMG 1:
                              </div>
                              <div className="col-span-5 flex items-center border-b border-[#3a3835] pb-1">
                                <span className="text-[#9e9a91] uppercase text-[10px] mr-1">
                                  DICE:
                                </span>
                                <input
                                  type="text"
                                  value={atk.damage1.dice}
                                  onChange={(e) =>
                                    updateThisSubAttack({
                                      ...atk,
                                      damage1: {
                                        ...atk.damage1,
                                        dice: e.target.value,
                                      },
                                    })
                                  }
                                  className="w-full bg-transparent font-mono-num text-white focus:outline-none"
                                />
                              </div>
                              <div className="col-span-5 flex items-center border-b border-[#3a3835] pb-1">
                                <span className="text-[#9e9a91] uppercase text-[10px] mr-1">
                                  ABILITY:
                                </span>
                                <select
                                  value={atk.damage1.ability}
                                  onChange={(e) =>
                                    updateThisSubAttack({
                                      ...atk,
                                      damage1: {
                                        ...atk.damage1,
                                        ability: e.target
                                          .value as AbilitySelection,
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

                            <div className="grid grid-cols-12 gap-2 items-center">
                              <div className="col-span-2" />
                              <div className="col-span-5 flex items-center border-b border-[#3a3835] pb-1">
                                <span className="text-[#9e9a91] uppercase text-[10px] mr-1">
                                  TYPE:
                                </span>
                                <select
                                  value={atk.damage1.type}
                                  onChange={(e) =>
                                    updateThisSubAttack({
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
                              <div className="col-span-5 font-mono-num font-bold text-[#ef4444]">
                                = {atkStats.dmg1Formula}{' '}
                                {dmgMeta ? dmgMeta.symbol : ''}
                              </div>
                            </div>
                          </div>
                        );
                      })}

                      {/* + Add Attack Button matching Screenshot 12 */}
                      <div className="flex justify-center pt-1">
                        <button
                          type="button"
                          onClick={() => handleAddAttackToEquipment(eq)}
                          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#c4aa78] hover:text-[#f0cd7e] cursor-pointer"
                        >
                          <Plus className="w-4 h-4" />
                          <span>Add Attack</span>
                        </button>
                      </div>
                    </div>

                    {/* 17. QUANTITY & UNIT WEIGHT matching Screenshot 12 */}
                    <div className="grid grid-cols-12 gap-3 items-center pt-2 border-t border-[#26252b]">
                      <div className="col-span-4 flex items-center border-b border-[#3a3835] pb-1">
                        <span className="text-[#9e9a91] uppercase text-[10px] mr-2">
                          QUANTITY:
                        </span>
                        <input
                          type="number"
                          min={0}
                          value={eq.quantity}
                          onChange={(e) =>
                            handleUpdateEquipment({
                              ...eq,
                              quantity: Math.max(
                                0,
                                parseInt(e.target.value, 10) || 0
                              ),
                            })
                          }
                          className="w-full bg-transparent font-mono-num text-white focus:outline-none"
                        />
                      </div>

                      <div className="col-span-5 flex items-center border-b border-[#3a3835] pb-1">
                        <span className="text-[#9e9a91] uppercase text-[10px] mr-2">
                          UNIT WEIGHT:
                        </span>
                        <input
                          type="number"
                          step="0.5"
                          min={0}
                          value={eq.unitWeight}
                          onChange={(e) =>
                            handleUpdateEquipment({
                              ...eq,
                              unitWeight: Math.max(
                                0,
                                parseFloat(e.target.value) || 0
                              ),
                            })
                          }
                          className="w-full bg-transparent font-mono-num text-white focus:outline-none"
                        />
                        <span className="text-[#9e9a91] ml-1">lb</span>
                      </div>

                      <div className="col-span-3 text-right font-mono-num text-[#9e9a91]">
                        = {itemTotalWeight} lbs
                      </div>
                    </div>

                    {/* Advanced Equipment Options (Attunement & Armor AC) */}
                    {advancedEqMode && (
                      <div className="p-3 rounded bg-[#121216] border border-[#3a3426] flex flex-wrap items-center justify-between gap-3">
                        <label className="inline-flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={Boolean(eq.requiresAttunement)}
                            onChange={(e) =>
                              handleUpdateEquipment({
                                ...eq,
                                requiresAttunement: e.target.checked,
                              })
                            }
                            className="accent-[#a12a2a]"
                          />
                          <span className="text-white">Requires Attunement</span>
                        </label>

                        {eq.requiresAttunement && (
                          <label className="inline-flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={Boolean(eq.attuned)}
                              onChange={(e) =>
                                handleUpdateEquipment({
                                  ...eq,
                                  attuned: e.target.checked,
                                })
                              }
                              className="accent-[#c8a357]"
                            />
                            <span className="text-[#e5c172]">Attuned</span>
                          </label>
                        )}

                        {(eq.type === 'Armor' || eq.type === 'Shield') && (
                          <div className="flex items-center gap-2">
                            <span className="text-[#9e9a91]">Bônus de AC:</span>
                            <input
                              type="number"
                              value={eq.armorAcBonus || 0}
                              onChange={(e) =>
                                handleUpdateEquipment({
                                  ...eq,
                                  armorAcBonus:
                                    parseInt(e.target.value, 10) || 0,
                                })
                              }
                              className="w-14 px-2 py-1 rounded bg-[#18181e] border border-[#33312e] font-mono-num text-white"
                            />
                          </div>
                        )}
                      </div>
                    )}

                    {/* 18. DESCRIPTION */}
                    <div>
                      <label className="block text-[#9e9a91] uppercase text-[10px] mb-1">
                        DESCRIPTION
                      </label>
                      <textarea
                        rows={3}
                        value={eq.description}
                        onChange={(e) =>
                          handleUpdateEquipment({
                            ...eq,
                            description: e.target.value,
                          })
                        }
                        className="w-full rounded border border-[#3a3835] bg-[#121216] p-2.5 text-white focus:border-[#c8a357] focus:outline-none"
                      />
                    </div>

                    {/* Remove Equipment */}
                    <button
                      type="button"
                      onClick={() => {
                        onUpdateSheet((prev) => ({
                          ...prev,
                          equipment: prev.equipment.filter(
                            (x) => x.id !== eq.id
                          ),
                        }));
                        setEditingEqId(null);
                      }}
                      className="inline-flex items-center gap-1.5 text-xs text-[#e07a7a] hover:text-[#f87171] cursor-pointer"
                    >
                      <MinusCircle className="w-4 h-4 fill-[#e07a7a]/20" />
                      <span>Remove</span>
                    </button>
                  </div>
                );
              }

              // COMPACT EQUIPMENT ROW matching Screenshot 11
              return (
                <div key={eq.id} className="py-3 text-xs">
                  <div className="grid grid-cols-12 items-center gap-2">
                    {/* Equipped Toggle + Name */}
                    <div className="col-span-6 flex items-center gap-2.5">
                      <button
                        type="button"
                        role="switch"
                        aria-checked={eq.equipped}
                        onClick={() =>
                          handleUpdateEquipment({
                            ...eq,
                            equipped: !eq.equipped,
                          })
                        }
                        title={
                          eq.equipped
                            ? 'Equipado (ataques ativos em Combat)'
                            : 'Desequipado'
                        }
                        className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors cursor-pointer ${
                          eq.equipped ? 'bg-[#a12a2a]' : 'bg-[#2e2d35]'
                        }`}
                      >
                        <span
                          className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                            eq.equipped ? 'translate-x-4' : 'translate-x-1'
                          }`}
                        />
                      </button>

                      <div>
                        <span className="font-semibold text-white">
                          {eq.name}
                        </span>
                        <div className="text-[10px] text-[#8c877e]">
                          {eq.type} · {itemTotalWeight} lbs
                          {eq.attacks.length > 0 &&
                            ` · ${eq.attacks.length} atk`}
                        </div>
                      </div>
                    </div>

                    {/* Quantity Stepper `[ - ] 1 [ + ]` matching Screenshot 11 */}
                    <div className="col-span-4 flex justify-center">
                      <div className="inline-flex items-center rounded border border-[#323038] bg-[#222228] px-2 py-1 gap-3">
                        <button
                          type="button"
                          onClick={() =>
                            handleUpdateEquipment({
                              ...eq,
                              quantity: Math.max(0, eq.quantity - 1),
                            })
                          }
                          className="text-[#b8b4ac] hover:text-white cursor-pointer"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="font-mono-num font-bold text-white min-w-[16px] text-center">
                          {eq.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            handleUpdateEquipment({
                              ...eq,
                              quantity: eq.quantity + 1,
                            })
                          }
                          className="text-[#b8b4ac] hover:text-white cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Edit & Expand */}
                    <div className="col-span-2 flex items-center justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => setEditingEqId(eq.id)}
                        className="p-1 text-[#8c877e] hover:text-white cursor-pointer"
                        aria-label={`Editar ${eq.name}`}
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedEqId(isExpanded ? null : eq.id)
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
                    <div className="mt-2 p-2.5 rounded bg-[#18181e] border border-[#28272e] text-xs text-[#b8b4ac] space-y-1">
                      {eq.description ? (
                        <p>{eq.description}</p>
                      ) : (
                        <p className="italic text-[#6e6a63]">Sem descrição.</p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 20. ATTUNEMENT SECTION matching Screenshot 11 */}
      {(filterView === 'All' || filterView === 'Attunement') && (
        <div className="pt-2 border-t border-[#2c2a27]">
          <h3 className="font-display font-bold text-xs tracking-wider text-[#d8b467] uppercase mb-2">
            ATTUNEMENT
          </h3>
          {attunableItems.length === 0 ? (
            <p className="text-xs text-[#6e6a63]">No Attunable Items</p>
          ) : (
            <div className="space-y-2">
              {attunableItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between px-3 py-2 rounded bg-[#18181e] border border-[#28272e] text-xs"
                >
                  <span className="text-white font-medium">{item.name}</span>
                  <label className="inline-flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={Boolean(item.attuned)}
                      onChange={(e) =>
                        handleUpdateEquipment({
                          ...item,
                          attuned: e.target.checked,
                        })
                      }
                      className="accent-[#c8a357]"
                    />
                    <span className="text-[#e5c172]">Attuned</span>
                  </label>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 21. OTHER POSSESSIONS SECTION matching Screenshot 11 */}
      {(filterView === 'All' || filterView === 'Possessions') && (
        <div className="pt-2 border-t border-[#2c2a27]">
          <div className="flex items-center justify-between pb-1 border-b border-[#2c2a27] text-xs">
            <div className="flex items-center gap-2">
              <Lock className="w-3 h-3 text-[#8c877e]" />
              <span className="font-display font-bold tracking-wider text-[#d8b467] uppercase">
                OTHER POSSESSIONS
              </span>
              <span className="text-[#9e9a91] font-mono-num">
                {weights.possessionsWeight} lbs
              </span>
            </div>
            <button
              type="button"
              onClick={() => setAddingPossession((p) => !p)}
              className="p-1 text-[#a39e93] hover:text-[#e5c172] cursor-pointer"
              title="Adicionar pertence narrativo / item de missão"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-12 items-center py-1.5 text-[11px] text-[#9e9a91]">
            <div className="col-span-7">Name</div>
            <div className="col-span-3 text-center">Qty</div>
            <div className="col-span-2" />
          </div>

          {addingPossession && (
            <div className="my-2 p-3 rounded border border-[#4a3f28] bg-[#18181e] space-y-2 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <input
                  type="text"
                  placeholder="Nome (ex: Chave Antiga, Carta Real)"
                  value={newPossession.name}
                  onChange={(e) =>
                    setNewPossession({ ...newPossession, name: e.target.value })
                  }
                  className="px-2.5 py-1.5 rounded bg-[#101014] border border-[#33312e] text-white"
                />
                <input
                  type="number"
                  min={1}
                  placeholder="Qtd"
                  value={newPossession.quantity}
                  onChange={(e) =>
                    setNewPossession({
                      ...newPossession,
                      quantity: parseInt(e.target.value, 10) || 1,
                    })
                  }
                  className="px-2.5 py-1.5 rounded bg-[#101014] border border-[#33312e] text-white font-mono-num"
                />
                <input
                  type="number"
                  step="0.5"
                  min={0}
                  placeholder="Peso unit. (lb)"
                  value={newPossession.unitWeight}
                  onChange={(e) =>
                    setNewPossession({
                      ...newPossession,
                      unitWeight: parseFloat(e.target.value) || 0,
                    })
                  }
                  className="px-2.5 py-1.5 rounded bg-[#101014] border border-[#33312e] text-white font-mono-num"
                />
              </div>
              <input
                type="text"
                placeholder="Descrição / notas sobre o objeto..."
                value={newPossession.description}
                onChange={(e) =>
                  setNewPossession({
                    ...newPossession,
                    description: e.target.value,
                  })
                }
                className="w-full px-2.5 py-1.5 rounded bg-[#101014] border border-[#33312e] text-white"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setAddingPossession(false)}
                  className="px-2.5 py-1 text-[#9e9a91]"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (!newPossession.name.trim()) return;
                    onUpdateSheet((prev) => ({
                      ...prev,
                      otherPossessions: [
                        ...prev.otherPossessions,
                        { ...newPossession, id: `pos-${Date.now()}` },
                      ],
                    }));
                    setNewPossession({
                      name: '',
                      quantity: 1,
                      unitWeight: 0,
                      description: '',
                    });
                    setAddingPossession(false);
                  }}
                  className="px-3 py-1 rounded bg-[#8a6f3b] text-white font-semibold cursor-pointer"
                >
                  Add
                </button>
              </div>
            </div>
          )}

          {sheet.otherPossessions.length === 0 ? (
            <p className="py-2 text-xs text-[#6e6a63]">No Other Possessions</p>
          ) : (
            <div className="divide-y divide-[#201f25]">
              {sheet.otherPossessions.map((pos) => (
                <div
                  key={pos.id}
                  className="py-2.5 grid grid-cols-12 items-center text-xs"
                >
                  <div className="col-span-7">
                    <div className="text-white font-medium">{pos.name}</div>
                    {pos.description && (
                      <div className="text-[11px] text-[#8c877e]">
                        {pos.description}
                      </div>
                    )}
                  </div>
                  <div className="col-span-3 text-center font-mono-num text-white">
                    {pos.quantity}
                  </div>
                  <div className="col-span-2 flex justify-end">
                    <button
                      type="button"
                      onClick={() =>
                        onUpdateSheet((prev) => ({
                          ...prev,
                          otherPossessions: prev.otherPossessions.filter(
                            (p) => p.id !== pos.id
                          ),
                        }))
                      }
                      className="text-[#78746d] hover:text-[#f87171] p-1 cursor-pointer"
                    >
                      <MinusCircle className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
