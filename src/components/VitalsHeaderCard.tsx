import React, { useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  Flame,
  Info,
  Settings,
  Shield,
  Sparkles,
  Dices,
  HeartPulse,
  Droplets,
  Skull,
  Clock,
  ShieldPlus,
  X,
} from 'lucide-react';
import {
  AbilityKey,
  CharacterSheetState,
  RollMode,
} from '../types/rpg';
import {
  ComputedAbility,
  ComputedSkill,
  formatSigned,
  getProficiencyBonus,
} from '../utils/calculations';
import {
  COMPENDIUM_CLASSES,
  COMPENDIUM_REALMS,
  COMPENDIUM_SPECIES,
} from '../data/compendium';
import { getArchetypeById, resolveArchetypeBase } from '../data/archetypes';
import { CONDITIONS_LIST, conditionLabel } from '../data/constants';

function FormulaTip({ text }: { text: string }) {
  return (
    <span className="relative inline-flex items-center group cursor-help align-middle">
      <Info className="w-3 h-3" />
      <span className="pointer-events-none absolute z-30 bottom-full left-1/2 -translate-x-1/2 mb-1.5 hidden group-hover:block min-w-[230px] max-w-[260px] rounded border border-[#3a3835] bg-[#0c0c10] px-2.5 py-2 text-[10px] leading-relaxed text-[#d4d0c8] shadow-lg">
        {text}
      </span>
    </span>
  );
}

interface VitalsHeaderCardProps {
  sheet: CharacterSheetState;
  abilities: Record<AbilityKey, ComputedAbility>;
  skills: Record<string, ComputedSkill>;
  vitals: {
    effectiveAC: number;
    baseMaxHP: number;
    tempMaxBonus: number;
    necroticMaxPenalty: number;
    effectiveMaxHP: number;
    effectiveInitiative: number;
    effectiveSpeed: number;
  };
  rollMode: RollMode;
  onChangeRollMode: (mode: RollMode) => void;
  onUpdateSheet: (updater: (prev: CharacterSheetState) => CharacterSheetState) => void;
  onRollD20: (title: string, subtitle: string, modifier: number) => void;
  onOpenOriginBuilder: () => void;
  onOpenCompendiumItem: (tab: 'species' | 'realms' | 'classes', id: string) => void;
}

export const VitalsHeaderCard: React.FC<VitalsHeaderCardProps> = ({
  sheet,
  abilities,
  skills,
  vitals,
  rollMode,
  onChangeRollMode,
  onUpdateSheet,
  onRollD20,
  onOpenOriginBuilder,
  onOpenCompendiumItem,
}) => {
  const [defensesOpen, setDefensesOpen] = useState(true);
  const [sensesOpen, setSensesOpen] = useState(true);
  const [conditionsOpen, setConditionsOpen] = useState(false);
  const [cardCollapsed, setCardCollapsed] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [hpDeltaInput, setHpDeltaInput] = useState<string>('5');

  const species = COMPENDIUM_SPECIES.find((s) => s.id === sheet.speciesId);
  const realm = COMPENDIUM_REALMS.find((r) => r.id === sheet.realmId);
  const charClass = COMPENDIUM_CLASSES.find((c) => c.id === sheet.classId);
  const profBonus = getProficiencyBonus(sheet.level);

  const baseArchetype = getArchetypeById(resolveArchetypeBase(sheet.classId));
  const intMod = abilities.INT?.modifier ?? 0;
  const manaBase = charClass?.manaBase ?? 0;
  const manaBaseRoll = Math.max(1, sheet.level + intMod);
  const heatMult = baseArchetype?.calorMultiplier ?? 2;
  const bestPrimaryMod = Math.max(
    0,
    ...(charClass?.primaryAbilities || ['STR', 'CON']).map(
      (k) => abilities[k as AbilityKey]?.modifier ?? 0
    )
  );

  const hpPercent = Math.max(
    0,
    Math.min(
      100,
      Math.round((sheet.hpCurrent / Math.max(1, vitals.effectiveMaxHP)) * 100)
    )
  );

  // Percentage of bar corroded by Necrotic Max HP penalty
  const totalVisualPool = Math.max(
    1,
    vitals.baseMaxHP + vitals.tempMaxBonus
  );
  const necroticCorrodedPercent = Math.min(
    75,
    Math.round((vitals.necroticMaxPenalty / totalVisualPool) * 100)
  );

  const manaPercent = Math.max(
    0,
    Math.min(
      100,
      Math.round((sheet.manaCurrent / Math.max(1, sheet.manaMax)) * 100)
    )
  );

  const heatPercent = Math.max(
    0,
    Math.min(
      100,
      Math.round((sheet.heatCurrent / Math.max(1, sheet.heatMax)) * 100)
    )
  );

  // Normal Damage
  const handleApplyDamage = () => {
    const amount = Math.max(0, parseInt(hpDeltaInput, 10) || 0);
    if (amount <= 0) return;
    onUpdateSheet((prev) => {
      let remainingDmg = amount;
      let nextTemp = prev.hpTemp;
      if (nextTemp > 0) {
        const absorbed = Math.min(nextTemp, remainingDmg);
        nextTemp -= absorbed;
        remainingDmg -= absorbed;
      }
      const nextHp = Math.max(0, prev.hpCurrent - remainingDmg);
      return {
        ...prev,
        hpTemp: nextTemp,
        hpCurrent: nextHp,
      };
    });
  };

  // Necrotic Damage (Reduces BOTH Current HP and Max HP!)
  const handleApplyNecroticDamage = () => {
    const amount = Math.max(0, parseInt(hpDeltaInput, 10) || 0);
    if (amount <= 0) return;
    onUpdateSheet((prev) => {
      const nextPenalty = (prev.hpMaxPenaltyNecrotic || 0) + amount;
      const newEffectiveMax = Math.max(
        1,
        vitals.baseMaxHP + (prev.hpMaxBonusTemp || 0) - nextPenalty
      );
      const nextHp = Math.min(
        newEffectiveMax,
        Math.max(0, prev.hpCurrent - amount)
      );
      return {
        ...prev,
        hpMaxPenaltyNecrotic: nextPenalty,
        hpCurrent: nextHp,
      };
    });
  };

  // Heal
  const handleApplyHeal = () => {
    const amount = Math.max(0, parseInt(hpDeltaInput, 10) || 0);
    if (amount <= 0) return;
    onUpdateSheet((prev) => ({
      ...prev,
      hpCurrent: Math.min(vitals.effectiveMaxHP, prev.hpCurrent + amount),
    }));
  };

  // Change Temporary Max HP Bonus (+HP Máx Temporário)
  const handleTempMaxBonusChange = (newBonus: number) => {
    const clamped = Math.max(0, newBonus);
    onUpdateSheet((prev) => {
      const oldBonus = prev.hpMaxBonusTemp || 0;
      const diff = clamped - oldBonus;
      const newEffectiveMax = Math.max(
        1,
        vitals.baseMaxHP + clamped - (prev.hpMaxPenaltyNecrotic || 0)
      );
      // If adding temporary Max HP, also increase current HP by the gained bonus; if removing, clamp current HP
      const nextHp =
        diff > 0
          ? Math.min(newEffectiveMax, prev.hpCurrent + diff)
          : Math.min(newEffectiveMax, prev.hpCurrent);
      return {
        ...prev,
        hpMaxBonusTemp: clamped,
        hpMaxBonusTurns:
          clamped > 0 && !(prev.hpMaxBonusTurns && prev.hpMaxBonusTurns > 0)
            ? 3
            : clamped === 0
            ? 0
            : prev.hpMaxBonusTurns,
        hpCurrent: nextHp,
      };
    });
  };

  // Tick down 1 Turn on Temporary Max HP Bonus
  const handleTickTempMaxTurn = () => {
    onUpdateSheet((prev) => {
      const curTurns = prev.hpMaxBonusTurns || 0;
      if (curTurns <= 1) {
        // Bonus expires!
        const newEffectiveMax = Math.max(
          1,
          vitals.baseMaxHP - (prev.hpMaxPenaltyNecrotic || 0)
        );
        return {
          ...prev,
          hpMaxBonusTemp: 0,
          hpMaxBonusTurns: 0,
          hpCurrent: Math.min(newEffectiveMax, prev.hpCurrent),
        };
      }
      return {
        ...prev,
        hpMaxBonusTurns: curTurns - 1,
      };
    });
  };

  // Change Necrotic Max HP Penalty (-HP Máx Necrótico)
  const handleNecroticPenaltyChange = (newPenalty: number) => {
    const clamped = Math.max(0, newPenalty);
    onUpdateSheet((prev) => {
      const newEffectiveMax = Math.max(
        1,
        vitals.baseMaxHP + (prev.hpMaxBonusTemp || 0) - clamped
      );
      return {
        ...prev,
        hpMaxPenaltyNecrotic: clamped,
        hpCurrent: Math.min(newEffectiveMax, prev.hpCurrent),
      };
    });
  };

  const handleRest = (type: 'Short Rest' | 'Long Rest') => {
    onUpdateSheet((prev) => {
      const clearedMaxHP = vitals.baseMaxHP;
      return {
        ...prev,
        hpMaxBonusTemp: type === 'Long Rest' ? 0 : prev.hpMaxBonusTemp,
        hpMaxBonusTurns: type === 'Long Rest' ? 0 : prev.hpMaxBonusTurns,
        hpMaxPenaltyNecrotic:
          type === 'Long Rest' ? 0 : prev.hpMaxPenaltyNecrotic,
        hpCurrent: type === 'Long Rest' ? clearedMaxHP : prev.hpCurrent,
        manaCurrent:
          type === 'Long Rest'
            ? prev.manaMax
            : Math.min(prev.manaMax, prev.manaCurrent + Math.floor(prev.manaMax * 0.25)),
        heatCurrent: 0,
        features: prev.features.map((f) => {
          if (!f.advanced) return f;
          if (
            type === 'Long Rest' ||
            f.advanced.rechargeOn === 'Short Rest' ||
            f.advanced.rechargeOn === 'Combat'
          ) {
            return {
              ...f,
              advanced: {
                ...f.advanced,
                usesCurrent: f.advanced.usesMax,
              },
            };
          }
          return f;
        }),
        combatActions: prev.combatActions.map((ca) =>
          ca.usesMax ? { ...ca, usesCurrent: ca.usesMax } : ca
        ),
      };
    });
  };

  const toggleCondition = (cond: string) => {
    onUpdateSheet((prev) => {
      const exists = prev.activeConditions.includes(cond);
      if (exists) {
        const nextTurns = { ...(prev.conditionTurns ?? {}) };
        delete nextTurns[cond];
        return {
          ...prev,
          activeConditions: prev.activeConditions.filter((c) => c !== cond),
          conditionTurns: nextTurns,
        };
      }
      return {
        ...prev,
        activeConditions: [...prev.activeConditions, cond],
      };
    });
  };

  const setConditionTurns = (cond: string, value: number) => {
    onUpdateSheet((prev) => ({
      ...prev,
      conditionTurns: {
        ...(prev.conditionTurns ?? {}),
        [cond]: Math.max(0, value),
      },
    }));
  };

  const tickCondition = (cond: string) => {
    onUpdateSheet((prev) => {
      const current = (prev.conditionTurns ?? {})[cond] ?? 0;
      if (current > 1) {
        return {
          ...prev,
          conditionTurns: { ...(prev.conditionTurns ?? {}), [cond]: current - 1 },
        };
      }
      const nextTurns = { ...(prev.conditionTurns ?? {}) };
      delete nextTurns[cond];
      return {
        ...prev,
        activeConditions: prev.activeConditions.filter((c) => c !== cond),
        conditionTurns: nextTurns,
      };
    });
  };

  const hasAnyDefense =
    sheet.resistances.trim() ||
    sheet.vulnerabilities.trim() ||
    sheet.immunities.trim() ||
    sheet.conditionImmunities.trim();

  const hasMaxHpModification =
    vitals.tempMaxBonus > 0 || vitals.necroticMaxPenalty > 0;

  return (
    <div className="w-full">
      {/* Top Crimson Roll Mode Banner */}
      <div className="flex items-center justify-between gap-2 mb-2.5 px-1">
        <div className="flex items-center gap-1.5">
          <div className="inline-flex items-center rounded border border-[#6e1c1c] bg-gradient-to-r from-[#4a1212] to-[#330d0d] p-0.5">
            {(['normal', 'advantage', 'disadvantage'] as RollMode[]).map(
              (mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => onChangeRollMode(mode)}
                  className={`px-2 sm:px-2.5 py-1 text-[10px] sm:text-[11px] font-bold uppercase tracking-wider rounded transition-colors cursor-pointer ${
                    rollMode === mode
                      ? 'bg-[#9e2525] text-white shadow-sm'
                      : 'text-[#d4a5a5] hover:text-white'
                  }`}
                >
                  {mode === 'normal'
                    ? 'Normal'
                    : mode === 'advantage'
                    ? 'Advantage'
                    : 'Disadv.'}
                </button>
              )
            )}
          </div>
          <span className="hidden sm:inline-block text-[11px] text-[#9a9488] ml-1">
            Prof.:{' '}
            <strong className="text-[#e5c172] font-mono-num">
              {formatSigned(profBonus)}
            </strong>
          </span>
        </div>

        <button
          type="button"
          onClick={onOpenOriginBuilder}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded border border-[#8a6f3b] bg-[#1c1914] hover:bg-[#292319] text-[#e5c172] text-xs font-semibold tracking-wide transition-colors cursor-pointer"
        >
          <Sparkles className="w-3.5 h-3.5 text-[#c8a357]" />
          <span>Origens & Level Up</span>
        </button>
      </div>

      {/* Main Gold-Bordered Vitals Card */}
      <div className="relative rounded-lg border border-[#786137] bg-gradient-to-b from-[#141418] to-[#0e0e12] p-3.5 shadow-[0_8px_32px_rgba(0,0,0,0.75)]">
        {/* Header Row: Name, Level Diamond, Rest Button, Settings */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2.5 flex-wrap">
            <input
              type="text"
              value={sheet.name}
              onChange={(e) =>
                onUpdateSheet((prev) => ({ ...prev, name: e.target.value }))
              }
              aria-label="Nome do Personagem"
              className="font-display font-bold text-lg sm:text-xl tracking-wider text-[#d8b467] bg-transparent border-b border-transparent hover:border-[#5c4b2b] focus:border-[#c8a357] focus:outline-none w-32 sm:w-48 uppercase"
            />

            {/* Red Diamond Level Badge */}
            <button
              type="button"
              onClick={onOpenOriginBuilder}
              title="Clique para evoluir o nível ou editar classe/origem"
              className="relative w-6 h-6 rotate-45 bg-[#b92b2b] hover:bg-[#d43535] border border-[#f87171]/60 flex items-center justify-center shadow-[0_0_8px_rgba(185,43,43,0.6)] transition-transform active:scale-95 cursor-pointer"
            >
              <span className="-rotate-45 font-mono-num text-xs font-bold text-white">
                {sheet.level}
              </span>
            </button>

            {/* Campfire / Long Rest button */}
            <button
              type="button"
              onClick={() => handleRest('Long Rest')}
              title="Descanso Longo (Recupera HP, limpa redução Necrótica, recupera Mana e zera Calor)"
              className="w-7 h-7 rounded border border-[#8c703c] bg-[#1d1a14] hover:bg-[#2b251b] flex items-center justify-center text-[#d8b467] transition-colors cursor-pointer"
            >
              <Flame className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => handleRest('Short Rest')}
              className="px-2 py-1 rounded border border-[#32302c] bg-[#16161b] hover:border-[#6e5931] text-[11px] text-[#b8b2a6] hover:text-[#e5c172] transition-colors cursor-pointer"
              title="Recarrega habilidades de Short Rest"
            >
              Short Rest
            </button>
            <button
              type="button"
              onClick={() => setSettingsOpen((prev) => !prev)}
              className="p-1.5 rounded text-[#8c877e] hover:text-[#d8b467] hover:bg-white/5 transition-colors cursor-pointer"
              aria-label="Configurações da Ficha"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Origin Strip with "Saiba mais" Links */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 pb-3 mb-3 border-b border-[#252429] text-xs text-[#b5b0a6]">
          <div className="inline-flex items-center gap-1">
            <span className="text-[#858078]">Species:</span>
            <span className="text-[#e6e4e0] font-medium">
              {species?.name || 'Custom'}
            </span>
            {species && (
              <button
                type="button"
                onClick={() => onOpenCompendiumItem('species', species.id)}
                className="inline-flex items-center gap-0.5 text-[11px] text-[#d8b467] hover:underline ml-0.5 cursor-pointer"
              >
                <Info className="w-3 h-3" />
                <span>Saiba mais</span>
              </button>
            )}
          </div>

          <span aria-hidden="true" className="text-[#45423d]">
            ·
          </span>

          <div className="inline-flex items-center gap-1">
            <span className="text-[#858078]">Realm:</span>
            <span className="text-[#f0cd7e] font-semibold">
              {realm?.name || 'Custom'}
            </span>
            {realm && (
              <button
                type="button"
                onClick={() => onOpenCompendiumItem('realms', realm.id)}
                className="inline-flex items-center gap-0.5 text-[11px] text-[#d8b467] hover:underline ml-0.5 cursor-pointer"
              >
                <Info className="w-3 h-3" />
                <span>Saiba mais</span>
              </button>
            )}
          </div>

          <span aria-hidden="true" className="text-[#45423d]">
            ·
          </span>

          <div className="inline-flex items-center gap-1">
            <span className="text-[#858078]">Class:</span>
            <span className="text-[#e6e4e0] font-medium">
              {charClass?.name || 'Custom'}
            </span>
            {charClass && (
              <button
                type="button"
                onClick={() => onOpenCompendiumItem('classes', charClass.id)}
                className="inline-flex items-center gap-0.5 text-[11px] text-[#d8b467] hover:underline ml-0.5 cursor-pointer"
              >
                <Info className="w-3 h-3" />
                <span>Saiba mais</span>
              </button>
            )}
          </div>
        </div>

        {/* Settings Drawer if open */}
        {settingsOpen && (
          <div className="mb-3 p-3 rounded border border-[#4a3f28] bg-[#0b0b0e] grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div>
              <label className="block text-[#9e9a91] mb-1">Base AC</label>
              <input
                type="number"
                value={sheet.acBase}
                onChange={(e) =>
                  onUpdateSheet((p) => ({
                    ...p,
                    acBase: parseInt(e.target.value, 10) || 10,
                  }))
                }
                className="w-full px-2 py-1 rounded bg-[#141418] border border-[#33312e] font-mono-num text-white"
              />
            </div>
            <div>
              <label className="block text-[#9e9a91] mb-1">
                HP Máximo Normal (Base)
              </label>
              <input
                type="number"
                value={sheet.hpMaxBase}
                onChange={(e) =>
                  onUpdateSheet((p) => ({
                    ...p,
                    hpMaxBase: Math.max(1, parseInt(e.target.value, 10) || 1),
                  }))
                }
                className="w-full px-2 py-1 rounded bg-[#141418] border border-[#33312e] font-mono-num text-white"
              />
            </div>
            <div>
              <label className="block text-[#9e9a91] mb-1">
                Spell Save DC Base
              </label>
              <input
                type="number"
                value={sheet.spellSaveDcBase}
                onChange={(e) =>
                  onUpdateSheet((p) => ({
                    ...p,
                    spellSaveDcBase: parseInt(e.target.value, 10) || 8,
                  }))
                }
                className="w-full px-2 py-1 rounded bg-[#141418] border border-[#33312e] font-mono-num text-white"
              />
            </div>
            <div>
              <label className="block text-[#9e9a91] mb-1">
                Bônus Manual Init
              </label>
              <input
                type="number"
                value={sheet.initiativeBonusManual}
                onChange={(e) =>
                  onUpdateSheet((p) => ({
                    ...p,
                    initiativeBonusManual: parseInt(e.target.value, 10) || 0,
                  }))
                }
                className="w-full px-2 py-1 rounded bg-[#141418] border border-[#33312e] font-mono-num text-white"
              />
            </div>
          </div>
        )}

        {/* Active Conditions Badge Strip (only when there is at least one) */}
        {sheet.activeConditions.length > 0 && (
          <div className="mb-2.5 flex flex-wrap items-center gap-1.5 rounded border border-[#5c1d1d] bg-[#1a0a0a] px-2.5 py-1.5">
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#fca5a5]">
              <Skull className="w-3.5 h-3.5" />
              Status:
            </span>
            {sheet.activeConditions.map((cond) => {
              const remaining = (sheet.conditionTurns ?? {})[cond] ?? 0;
              return (
                <button
                  key={cond}
                  type="button"
                  onClick={() => toggleCondition(cond)}
                  title={`Remover ${conditionLabel(cond)}`}
                  className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded border border-[#ef4444] bg-[#7c1d1d] text-white text-[11px] font-medium hover:bg-[#9f1f1f] transition-colors cursor-pointer"
                >
                  <span>{conditionLabel(cond)}</span>
                  {remaining > 0 && (
                    <span className="inline-flex items-center gap-0.5 text-[10px] text-[#fde047] font-mono-num font-bold">
                      <Clock className="w-2.5 h-2.5" />
                      {remaining}t
                    </span>
                  )}
                  <X className="w-3 h-3 opacity-70" />
                </button>
              );
            })}
          </div>
        )}

        {/* Primary Vitals Row: INSP/INIT | Current / Effective Max HP | Temp Shield | AC | Speed */}
        <div className="grid grid-cols-12 gap-2 items-center">
          {/* Left: INSP & INIT */}
          <div className="col-span-3 sm:col-span-2 flex flex-col gap-1.5">
            <button
              type="button"
              onClick={() =>
                onUpdateSheet((prev) => ({
                  ...prev,
                  inspiration: !prev.inspiration,
                }))
              }
              className={`flex items-center justify-between px-2 py-1.5 rounded border text-xs font-semibold tracking-wide transition-colors cursor-pointer ${
                sheet.inspiration
                  ? 'border-[#d8b467] bg-[#2e2616] text-[#f5d98e]'
                  : 'border-[#3a3835] bg-[#0c0c10] text-[#b8b4ac] hover:border-[#635843]'
              }`}
            >
              <span>INSP</span>
              <Dices
                className={`w-3.5 h-3.5 ${
                  sheet.inspiration ? 'text-[#f5d98e]' : 'text-[#75716a]'
                }`}
              />
            </button>

            <button
              type="button"
              onClick={() =>
                onRollD20(
                  'Initiative',
                  'Teste de Iniciativa (DEX)',
                  vitals.effectiveInitiative
                )
              }
              className="px-2 py-1.5 rounded bg-[#a12323] hover:bg-[#ba2929] border border-[#d14343]/50 text-white font-bold text-xs tracking-wide text-center shadow-sm transition-colors cursor-pointer font-mono-num"
              title="Clique para rolar Iniciativa"
            >
              INIT {formatSigned(vitals.effectiveInitiative)}
            </button>
          </div>

          {/* Center: Current / Effective Max HP with Distinct Temporary Boost & Necrotic Reduction Visuals */}
          <div className="col-span-5 sm:col-span-5 flex flex-col">
            <div
              className={`rounded-t border px-2 py-2 flex items-center justify-around shadow-inner transition-colors ${
                vitals.tempMaxBonus > 0 && vitals.necroticMaxPenalty === 0
                  ? 'border-[#22c55e]/70 bg-[#081710]'
                  : vitals.necroticMaxPenalty > 0 && vitals.tempMaxBonus === 0
                  ? 'border-[#9333ea]/70 bg-[#150921]'
                  : vitals.tempMaxBonus > 0 && vitals.necroticMaxPenalty > 0
                  ? 'border-[#c8a357] bg-[#12101b]'
                  : 'border-[#3a3835] bg-[#0b0b0e]'
              }`}
            >
              <input
                type="number"
                value={sheet.hpCurrent}
                onChange={(e) =>
                  onUpdateSheet((p) => ({
                    ...p,
                    hpCurrent: Math.max(0, parseInt(e.target.value, 10) || 0),
                  }))
                }
                aria-label="HP Atual"
                className="w-12 text-center bg-transparent font-mono-num text-lg sm:text-xl font-bold text-white focus:outline-none focus:text-[#f5d98e]"
              />
              <span className="text-[#78746d] font-bold text-lg">/</span>

              {/* Effective Max HP Display + Base HP Input when unmodified */}
              {hasMaxHpModification ? (
                <div
                  className="flex flex-col items-center"
                  title={`HP Máx Normal: ${vitals.baseMaxHP} | +Máx Temp: +${vitals.tempMaxBonus} | -Máx Necrótico: -${vitals.necroticMaxPenalty}`}
                >
                  <span
                    className={`font-mono-num text-lg sm:text-xl font-bold leading-none ${
                      vitals.effectiveMaxHP > vitals.baseMaxHP
                        ? 'text-[#4ade80]'
                        : vitals.effectiveMaxHP < vitals.baseMaxHP
                        ? 'text-[#c084fc]'
                        : 'text-[#f5d98e]'
                    }`}
                  >
                    {vitals.effectiveMaxHP}
                  </span>
                  <span className="text-[9px] font-mono-num text-[#9e9a91] mt-0.5">
                    (Base {vitals.baseMaxHP})
                  </span>
                </div>
              ) : (
                <input
                  type="number"
                  value={sheet.hpMaxBase}
                  onChange={(e) =>
                    onUpdateSheet((p) => ({
                      ...p,
                      hpMaxBase: Math.max(
                        1,
                        parseInt(e.target.value, 10) || 1
                      ),
                    }))
                  }
                  aria-label="HP Máximo Base"
                  title="Digite para alterar o HP Máximo Base"
                  className="w-12 text-center bg-transparent font-mono-num text-lg sm:text-xl font-bold text-white focus:outline-none focus:text-[#f5d98e]"
                />
              )}
            </div>

            {/* Segmented Health Bar (Normal + Emerald Boost + Purple Necrotic Corrosion) */}
            <div className="w-full h-2 bg-[#222228] rounded-b overflow-hidden flex">
              <div
                className="h-full flex transition-all duration-200"
                style={{ width: `${100 - necroticCorrodedPercent}%` }}
              >
                <div
                  className={`h-full transition-all duration-200 ${
                    vitals.tempMaxBonus > 0
                      ? 'bg-gradient-to-r from-[#22c55e] to-[#34d399]'
                      : hpPercent > 50
                      ? 'bg-[#22c55e]'
                      : hpPercent > 25
                      ? 'bg-[#eab308]'
                      : 'bg-[#ef4444]'
                  }`}
                  style={{ width: `${hpPercent}%` }}
                />
              </div>
              {necroticCorrodedPercent > 0 && (
                <div
                  title={`-${vitals.necroticMaxPenalty} HP Máx reduzido por Dano Necrótico`}
                  className="h-full bg-[#6b21a8] border-l border-[#c084fc]"
                  style={{ width: `${necroticCorrodedPercent}%` }}
                />
              )}
            </div>

            {/* Labels + Active Max HP Badges */}
            <div className="flex items-center justify-between px-1 text-[10px] sm:text-[11px] text-[#a39e93] mt-1">
              <span>Current</span>
              <div className="flex items-center gap-1.5">
                {vitals.tempMaxBonus > 0 && (
                  <span className="text-[#4ade80] font-mono-num font-bold">
                    +{vitals.tempMaxBonus} Máx
                    {sheet.hpMaxBonusTurns ? ` (${sheet.hpMaxBonusTurns}t)` : ''}
                  </span>
                )}
                {vitals.necroticMaxPenalty > 0 && (
                  <span className="text-[#c084fc] font-mono-num font-bold">
                    -{vitals.necroticMaxPenalty} 💀
                  </span>
                )}
                {!hasMaxHpModification && <span>Max</span>}
              </div>
            </div>
          </div>

          {/* Temp HP (Escudo Temporário) */}
          <div className="col-span-2 sm:col-span-2 flex flex-col items-center">
            <div className="w-full rounded border border-[#3a3835] bg-[#0b0b0e] py-2 flex items-center justify-center shadow-inner">
              <input
                type="number"
                value={sheet.hpTemp}
                onChange={(e) =>
                  onUpdateSheet((p) => ({
                    ...p,
                    hpTemp: Math.max(0, parseInt(e.target.value, 10) || 0),
                  }))
                }
                aria-label="HP Temporário"
                className="w-full text-center bg-transparent font-mono-num text-base sm:text-lg font-semibold text-[#e6e4e0] focus:outline-none"
              />
            </div>
            <span className="text-[11px] text-[#a39e93] mt-1">Temp</span>
          </div>

          {/* AC & Speed */}
          <div className="col-span-2 sm:col-span-3 flex items-center justify-around gap-1">
            {/* AC Shield */}
            <div className="flex flex-col items-center">
              <div
                className="relative w-11 h-12 rounded-b-2xl rounded-t-md border border-[#524e46] bg-[#0b0b0e] flex items-center justify-center shadow-inner"
                title={`Base AC: ${sheet.acBase} | Total AC: ${vitals.effectiveAC}`}
              >
                <Shield className="absolute inset-0 w-full h-full text-[#3a3731]/30 p-1 pointer-events-none" />
                <span className="relative font-mono-num text-base sm:text-lg font-bold text-white">
                  {vitals.effectiveAC}
                </span>
              </div>
              <span className="text-[11px] text-[#a39e93] mt-1">AC</span>
            </div>

            {/* Speed */}
            <div className="hidden sm:flex flex-col items-center">
              <div className="w-12 h-12 rounded-md border border-[#3a3835] bg-[#0b0b0e] flex items-center justify-center shadow-inner">
                <input
                  type="number"
                  value={vitals.effectiveSpeed}
                  onChange={(e) =>
                    onUpdateSheet((p) => ({
                      ...p,
                      speedBase: Math.max(0, parseInt(e.target.value, 10) || 0),
                    }))
                  }
                  aria-label="Speed"
                  className="w-full text-center bg-transparent font-mono-num text-base font-bold text-white focus:outline-none"
                />
              </div>
              <span className="text-[11px] text-[#a39e93] mt-1">Speed</span>
            </div>
          </div>
        </div>

        {/* NEW: DEDICATED SIDE-BY-SIDE MODIFIERS FOR TEMPORARY MAX HP (+TURNOS) & NECROTIC MAX HP REDUCTION (💀) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-3 pt-2.5 border-t border-[#232227]">
          {/* Left Box: +HP Máximo Temporário & Contador de Turnos */}
          <div className="rounded border border-[#1f5735] bg-[#09150e] px-2.5 py-2 flex items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-1.5">
              <ShieldPlus className="w-4 h-4 text-[#4ade80] shrink-0" />
              <div>
                <div className="text-[11px] font-bold text-[#86efac] leading-tight">
                  +HP Máx Temp
                </div>
                <div className="text-[10px] text-[#6ee7b7]/70">
                  Buff de Vida Máx
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              {/* +HP Max Input */}
              <div className="flex items-center rounded border border-[#22c55e]/40 bg-[#050d08] px-1.5 py-1">
                <span className="text-[#4ade80] font-mono-num font-bold text-xs">
                  +
                </span>
                <input
                  type="number"
                  min={0}
                  value={vitals.tempMaxBonus}
                  onChange={(e) =>
                    handleTempMaxBonusChange(parseInt(e.target.value, 10) || 0)
                  }
                  aria-label="Bônus de HP Máximo Temporário"
                  title="Digite o aumento temporário de HP Máximo"
                  className="w-10 text-center bg-transparent font-mono-num font-bold text-xs text-white focus:outline-none"
                />
              </div>

              {/* Turn Counter Input (`3t`) */}
              <div
                className="flex items-center rounded border border-[#22c55e]/40 bg-[#050d08] px-1.5 py-1"
                title="Duração em turnos do aumento de HP Máximo"
              >
                <Clock className="w-3 h-3 text-[#4ade80] mr-1 shrink-0" />
                <input
                  type="number"
                  min={0}
                  value={sheet.hpMaxBonusTurns || 0}
                  onChange={(e) =>
                    onUpdateSheet((p) => ({
                      ...p,
                      hpMaxBonusTurns: Math.max(
                        0,
                        parseInt(e.target.value, 10) || 0
                      ),
                    }))
                  }
                  aria-label="Turnos restantes do HP Máximo Temporário"
                  className="w-7 text-center bg-transparent font-mono-num font-bold text-xs text-[#fde047] focus:outline-none"
                />
                <span className="text-[10px] text-[#86efac]">t</span>
              </div>

              {/* -1 Turno Button */}
              {vitals.tempMaxBonus > 0 && (
                <button
                  type="button"
                  onClick={handleTickTempMaxTurn}
                  title="Passar 1 turno (quando chega a 0, o bônus temporário de HP Máx encerra)"
                  className="px-2 py-1 rounded bg-[#14532d] hover:bg-[#166534] text-white font-mono-num text-[11px] font-bold cursor-pointer"
                >
                  -1t
                </button>
              )}
            </div>
          </div>

          {/* Right Box: -HP Máximo Necrótico 💀 (Redução de Vida Máxima) */}
          <div className="rounded border border-[#581c87] bg-[#13091f] px-2.5 py-2 flex items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-1.5">
              <Skull className="w-4 h-4 text-[#c084fc] shrink-0" />
              <div>
                <div className="text-[11px] font-bold text-[#d8b4fe] leading-tight">
                  -HP Máx Necrótico
                </div>
                <div className="text-[10px] text-[#c084fc]/70">
                  Redução de Vida Máx
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <div className="flex items-center rounded border border-[#9333ea]/50 bg-[#09040f] px-2 py-1">
                <span className="text-[#c084fc] font-mono-num font-bold text-xs">
                  -
                </span>
                <input
                  type="number"
                  min={0}
                  value={vitals.necroticMaxPenalty}
                  onChange={(e) =>
                    handleNecroticPenaltyChange(
                      parseInt(e.target.value, 10) || 0
                    )
                  }
                  aria-label="Redução de HP Máximo por Dano Necrótico"
                  title="Digite quanto de HP Máximo foi reduzido por efeitos necróticos"
                  className="w-11 text-center bg-transparent font-mono-num font-bold text-xs text-[#f3e8ff] focus:outline-none"
                />
              </div>

              {vitals.necroticMaxPenalty > 0 && (
                <button
                  type="button"
                  onClick={() => handleNecroticPenaltyChange(0)}
                  title="Limpar redução de HP Máximo necrótico"
                  className="px-2 py-1 rounded bg-[#3b0764] hover:bg-[#581c87] text-[#e9d5ff] text-[11px] font-semibold cursor-pointer"
                >
                  Limpar
                </button>
              )}
            </div>
          </div>
        </div>

        {/* PROMINENT MANA & HEAT BARS */}
        <div className="grid grid-cols-12 gap-2.5 mt-2.5 pt-2.5 border-t border-[#232227] items-start">
          {/* MANA BAR BLOCK (7 cols) */}
          <div className="col-span-7 flex flex-col">
            <div className="rounded-t border border-[#284066] bg-[#0a101d] px-2 py-1.5 flex items-center justify-between shadow-inner">
              <button
                type="button"
                onClick={() =>
                  onUpdateSheet((p) => ({
                    ...p,
                    manaCurrent: Math.max(0, p.manaCurrent - 5),
                  }))
                }
                title="Gastar 5 de Mana (1 Ciclo)"
                className="px-1.5 py-0.5 rounded bg-[#15243d] hover:bg-[#1e3357] text-[#93c5fd] font-mono-num text-xs font-bold cursor-pointer"
              >
                -5
              </button>

              <div className="flex items-center justify-center gap-1 flex-1">
                <Droplets className="w-3.5 h-3.5 text-[#38bdf8] hidden sm:inline shrink-0" />
                <input
                  type="number"
                  value={sheet.manaCurrent}
                  onChange={(e) =>
                    onUpdateSheet((p) => ({
                      ...p,
                      manaCurrent: Math.max(
                        0,
                        parseInt(e.target.value, 10) || 0
                      ),
                    }))
                  }
                  aria-label="Mana Atual"
                  title="Digite a Mana Atual"
                  className="w-11 text-center bg-transparent font-mono-num text-base sm:text-lg font-bold text-[#e0f2fe] focus:outline-none focus:text-[#38bdf8]"
                />
                <span className="text-[#475569] font-bold text-sm">/</span>
                <input
                  type="number"
                  value={sheet.manaMax}
                  onChange={(e) =>
                    onUpdateSheet((p) => ({
                      ...p,
                      manaMax: Math.max(0, parseInt(e.target.value, 10) || 0),
                    }))
                  }
                  aria-label="Mana Máxima"
                  title="Digite a Mana Máxima"
                  className="w-11 text-center bg-transparent font-mono-num text-base sm:text-lg font-bold text-[#93c5fd] focus:outline-none focus:text-white"
                />
              </div>

              <button
                type="button"
                onClick={() =>
                  onUpdateSheet((p) => ({
                    ...p,
                    manaCurrent: Math.min(p.manaMax, p.manaCurrent + 5),
                  }))
                }
                title="Recuperar 5 de Mana"
                className="px-1.5 py-0.5 rounded bg-[#15243d] hover:bg-[#1e3357] text-[#93c5fd] font-mono-num text-xs font-bold cursor-pointer"
              >
                +5
              </button>
            </div>
            <div className="w-full h-1.5 bg-[#131b2e] rounded-b overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#2563eb] to-[#38bdf8] transition-all duration-200"
                style={{ width: `${manaPercent}%` }}
              />
            </div>
            <div className="flex justify-between px-1 text-[10px] sm:text-[11px] text-[#7dd3fc] mt-1 font-medium">
              <span>Mana Atual</span>
              <span className="inline-flex items-center gap-1 text-[#93c5fd]/80">
                Mana Máx
                <FormulaTip
                  text={`Mana Máx = máx(1, Nível + mod INT) × multiplicador. Aqui: máx(1, ${sheet.level} + ${intMod}) × ${manaBase} = ${sheet.manaMax}. O multiplicador vem do arquétipo (${baseArchetype?.nome ?? '—'}).`}
                />
              </span>
            </div>
          </div>

          {/* HEAT (CALOR) BAR BLOCK (5 cols) */}
          <div className="col-span-5 flex flex-col">
            <div className="rounded-t border border-[#6b2d1f] bg-[#1a0d0a] px-1.5 py-1.5 flex items-center justify-between shadow-inner">
              <button
                type="button"
                onClick={() =>
                  onUpdateSheet((p) => ({
                    ...p,
                    heatCurrent: Math.max(0, p.heatCurrent - 1),
                  }))
                }
                title="Reduzir 1 de Calor"
                className="px-1.5 py-0.5 rounded bg-[#2e1610] hover:bg-[#452017] text-[#fdba74] font-mono-num text-xs font-bold cursor-pointer"
              >
                -
              </button>

              <div className="flex items-center justify-center gap-0.5 flex-1">
                <input
                  type="number"
                  value={sheet.heatCurrent}
                  onChange={(e) =>
                    onUpdateSheet((p) => ({
                      ...p,
                      heatCurrent: Math.max(
                        0,
                        parseInt(e.target.value, 10) || 0
                      ),
                    }))
                  }
                  aria-label="Calor Atual"
                  title="Digite o Calor (Heat) Atual"
                  className="w-9 text-center bg-transparent font-mono-num text-sm sm:text-base font-bold text-[#ffedd5] focus:outline-none focus:text-[#fb923c]"
                />
                <span className="text-[#7c2d12] font-bold text-xs">/</span>
                <input
                  type="number"
                  value={sheet.heatMax}
                  onChange={(e) =>
                    onUpdateSheet((p) => ({
                      ...p,
                      heatMax: Math.max(1, parseInt(e.target.value, 10) || 1),
                    }))
                  }
                  aria-label="Calor Máximo"
                  title="Digite o Calor Máximo (Fórmula: mult × melhor mod. primário + nível)"
                  className="w-9 text-center bg-transparent font-mono-num text-sm sm:text-base font-bold text-[#fdba74] focus:outline-none focus:text-white"
                />
              </div>

              <button
                type="button"
                onClick={() =>
                  onUpdateSheet((p) => ({
                    ...p,
                    heatCurrent: Math.min(p.heatMax, p.heatCurrent + 1),
                  }))
                }
                title="Aumentar 1 de Calor"
                className="px-1.5 py-0.5 rounded bg-[#2e1610] hover:bg-[#452017] text-[#fdba74] font-mono-num text-xs font-bold cursor-pointer"
              >
                +
              </button>
            </div>
            <div className="w-full h-1.5 bg-[#29140e] rounded-b overflow-hidden">
              <div
                className={`h-full transition-all duration-200 ${
                  heatPercent >= 85
                    ? 'bg-[#ef4444]'
                    : 'bg-gradient-to-r from-[#f97316] to-[#ef4444]'
                }`}
                style={{ width: `${heatPercent}%` }}
              />
            </div>
            <div className="flex justify-between px-1 text-[10px] sm:text-[11px] text-[#fdba74] mt-1 font-medium">
              <span>Calor</span>
              <span className="inline-flex items-center gap-1 text-[#fb923c]/80">
                Máx
                <FormulaTip
                  text={`Calor Máx = multiplicador × melhor mod. primário + nível. Aqui: ${heatMult} × ${bestPrimaryMod} + ${sheet.level} = ${sheet.heatMax}. O multiplicador vem do arquétipo (${baseArchetype?.nome ?? '—'}).`}
                />
              </span>
            </div>
          </div>
        </div>

        {/* Quick [ Damage ] [ Necrótico 💀 ] [ NUMBER ] [ Heal ] Bar */}
        <div className="mt-2.5 pt-2 border-t border-[#232227] flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1.5">
            <HeartPulse className="w-3.5 h-3.5 text-[#a39e93] mr-0.5 hidden sm:inline" />
            <button
              type="button"
              onClick={handleApplyDamage}
              title="Aplica dano normal (absorvido por Temp HP primeiro)"
              className="px-2.5 py-1 rounded bg-[#7c1d1d] hover:bg-[#991b1b] text-white text-xs font-semibold transition-colors cursor-pointer"
            >
              Damage
            </button>
            <button
              type="button"
              onClick={handleApplyNecroticDamage}
              title="Aplica Dano Necrótico (reduz o HP Atual E também reduz o HP Máximo!)"
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-[#581c87] hover:bg-[#6b21a8] border border-[#a855f7]/40 text-[#f3e8ff] text-xs font-semibold transition-colors cursor-pointer"
            >
              <Skull className="w-3 h-3 text-[#d8b4fe]" />
              <span>Necrótico</span>
            </button>
            <input
              type="number"
              min={1}
              value={hpDeltaInput}
              onChange={(e) => setHpDeltaInput(e.target.value)}
              aria-label="Quantidade de Dano ou Cura"
              className="w-14 px-2 py-1 rounded border border-[#3a3835] bg-[#09090c] text-center font-mono-num text-xs font-bold text-white focus:border-[#c8a357] focus:outline-none"
            />
            <button
              type="button"
              onClick={handleApplyHeal}
              className="px-2.5 py-1 rounded bg-[#166534] hover:bg-[#15803d] text-white text-xs font-semibold transition-colors cursor-pointer"
            >
              Heal
            </button>
          </div>

          <div className="flex sm:hidden items-center gap-1.5 text-xs text-[#a39e93]">
            <span>Speed:</span>
            <input
              type="number"
              value={vitals.effectiveSpeed}
              onChange={(e) =>
                onUpdateSheet((p) => ({
                  ...p,
                  speedBase: Math.max(0, parseInt(e.target.value, 10) || 0),
                }))
              }
              className="w-10 px-1 py-0.5 rounded border border-[#3a3835] bg-[#09090c] text-center font-mono-num font-bold text-white"
            />
            <span>ft</span>
          </div>
        </div>

        {/* Collapsible Lower Area: Defenses, Conditions & Senses/Passives */}
        {!cardCollapsed && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 mt-3 pt-3 border-t border-[#252429]">
            {/* Left Column: Defenses & Conditions */}
            <div className="flex flex-col gap-2">
              <div className="rounded border border-[#2c2a27] bg-[#0d0d11] p-2.5">
                <button
                  type="button"
                  onClick={() => setDefensesOpen((prev) => !prev)}
                  className="w-full flex items-center justify-between text-xs font-semibold text-[#c4AA78] cursor-pointer"
                >
                  <span>
                    Defenses:{' '}
                    {!defensesOpen && (
                      <span className="text-[#8c877e] font-normal">
                        {hasAnyDefense ? 'Configured' : 'None'}
                      </span>
                    )}
                  </span>
                  {defensesOpen ? (
                    <ChevronUp className="w-4 h-4 text-[#a39e93]" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-[#a39e93]" />
                  )}
                </button>

                {defensesOpen && (
                  <div className="mt-2.5 space-y-2 text-xs">
                    <div>
                      <label className="block text-[#8c877e] mb-1">
                        Resistances
                      </label>
                      <input
                        type="text"
                        value={sheet.resistances}
                        onChange={(e) =>
                          onUpdateSheet((p) => ({
                            ...p,
                            resistances: e.target.value,
                          }))
                        }
                        placeholder="e.g. Radiant, Fire"
                        className="w-full px-2.5 py-1.5 rounded border border-[#2e2c29] bg-[#08080a] text-[#e6e4e0] focus:border-[#c8a357] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[#8c877e] mb-1">
                        Vulnerabilities
                      </label>
                      <input
                        type="text"
                        value={sheet.vulnerabilities}
                        onChange={(e) =>
                          onUpdateSheet((p) => ({
                            ...p,
                            vulnerabilities: e.target.value,
                          }))
                        }
                        className="w-full px-2.5 py-1.5 rounded border border-[#2e2c29] bg-[#08080a] text-[#e6e4e0] focus:border-[#c8a357] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[#8c877e] mb-1">
                        Immunities
                      </label>
                      <input
                        type="text"
                        value={sheet.immunities}
                        onChange={(e) =>
                          onUpdateSheet((p) => ({
                            ...p,
                            immunities: e.target.value,
                          }))
                        }
                        className="w-full px-2.5 py-1.5 rounded border border-[#2e2c29] bg-[#08080a] text-[#e6e4e0] focus:border-[#c8a357] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[#8c877e] mb-1">
                        Condition Immunities
                      </label>
                      <input
                        type="text"
                        value={sheet.conditionImmunities}
                        onChange={(e) =>
                          onUpdateSheet((p) => ({
                            ...p,
                            conditionImmunities: e.target.value,
                          }))
                        }
                        className="w-full px-2.5 py-1.5 rounded border border-[#2e2c29] bg-[#08080a] text-[#e6e4e0] focus:border-[#c8a357] focus:outline-none"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Conditions Box */}
              <div className="rounded border border-[#2c2a27] bg-[#0d0d11] p-2.5">
                <button
                  type="button"
                  onClick={() => setConditionsOpen((prev) => !prev)}
                  className="w-full flex items-center justify-between text-xs font-semibold text-[#c4AA78] cursor-pointer"
                >
                  <span>
                    Status:{' '}
                    {sheet.activeConditions.length > 0 ? (
                      <span className="text-[#f87171] font-medium">
                        {sheet.activeConditions
                          .map((c) => conditionLabel(c))
                          .join(', ')}
                      </span>
                    ) : (
                      <span className="text-[#8c877e] font-normal">Nenhum</span>
                    )}
                  </span>
                  {conditionsOpen ? (
                    <ChevronUp className="w-4 h-4 text-[#a39e93]" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-[#a39e93]" />
                  )}
                </button>

                {conditionsOpen && (
                  <div className="mt-2.5 flex flex-col gap-2.5">
                    {/* Active conditions with turn counters */}
                    {sheet.activeConditions.length > 0 && (
                      <div className="flex flex-col gap-1.5">
                        {sheet.activeConditions.map((cond) => {
                          const remaining = (sheet.conditionTurns ?? {})[cond] ?? 0;
                          return (
                            <div
                              key={cond}
                              className="flex items-center gap-1.5 rounded border border-[#5c1d1d] bg-[#180a0a] px-2 py-1"
                            >
                              <span className="text-[11px] font-semibold text-[#fca5a5] flex-1">
                                {conditionLabel(cond)}
                              </span>
                              <div
                                className="flex items-center rounded border border-[#ef4444]/40 bg-[#0f0606] px-1 py-0.5"
                                title="Duração em turnos (0 = indefinido)"
                              >
                                <Clock className="w-3 h-3 text-[#fca5a5] mr-1 shrink-0" />
                                <input
                                  type="number"
                                  min={0}
                                  value={remaining}
                                  onChange={(e) =>
                                    setConditionTurns(
                                      cond,
                                      parseInt(e.target.value, 10) || 0
                                    )
                                  }
                                  aria-label={`Turnos restantes de ${conditionLabel(cond)}`}
                                  className="w-7 text-center bg-transparent font-mono-num font-bold text-[11px] text-[#fde047] focus:outline-none"
                                />
                                <span className="text-[10px] text-[#fca5a5]">t</span>
                              </div>
                              {remaining > 0 && (
                                <button
                                  type="button"
                                  onClick={() => tickCondition(cond)}
                                  title="Passar 1 turno"
                                  className="px-1.5 py-0.5 rounded bg-[#7f1d1d] hover:bg-[#991b1b] text-white font-mono-num text-[10px] font-bold cursor-pointer"
                                >
                                  -1t
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => toggleCondition(cond)}
                                title="Remover"
                                className="p-0.5 text-[#fca5a5] hover:text-white cursor-pointer"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* All conditions toggle grid */}
                    <div className="flex flex-wrap gap-1.5">
                      {CONDITIONS_LIST.map((cond) => {
                        const active = sheet.activeConditions.includes(cond);
                        return (
                          <button
                            key={cond}
                            type="button"
                            onClick={() => toggleCondition(cond)}
                            title={cond}
                            className={`px-2 py-1 rounded text-[11px] font-medium border transition-colors cursor-pointer ${
                              active
                                ? 'bg-[#7c1d1d] border-[#ef4444] text-white'
                                : 'bg-[#08080a] border-[#2e2c29] text-[#9e9a91] hover:text-white'
                            }`}
                          >
                            {conditionLabel(cond)}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Senses / Passives */}
            <div className="rounded border border-[#2c2a27] bg-[#0d0d11] p-2.5 h-fit">
              <button
                type="button"
                onClick={() => setSensesOpen((prev) => !prev)}
                className="w-full flex items-center justify-between text-xs font-semibold text-[#c4AA78] cursor-pointer"
              >
                <span>Senses/Passives:</span>
                {sensesOpen ? (
                  <ChevronUp className="w-4 h-4 text-[#a39e93]" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-[#a39e93]" />
                )}
              </button>

              {sensesOpen && (
                <div className="mt-2.5 flex flex-wrap gap-1.5 text-xs">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded bg-[#08080a] border border-[#26252a] text-[#a39e93]">
                    <span>Darkvision</span>
                    <input
                      type="number"
                      value={sheet.darkvisionFt}
                      onChange={(e) =>
                        onUpdateSheet((p) => ({
                          ...p,
                          darkvisionFt: Math.max(
                            0,
                            parseInt(e.target.value, 10) || 0
                          ),
                        }))
                      }
                      aria-label="Darkvision ft"
                      className="w-8 bg-transparent font-mono-num font-bold text-white text-right focus:outline-none"
                    />
                    <span className="text-white font-semibold">ft</span>
                  </div>

                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded bg-[#08080a] border border-[#26252a] text-[#a39e93]">
                    <span>Investigation</span>
                    <span className="font-mono-num font-bold text-white">
                      {skills.investigation?.passiveScore ?? 10}
                    </span>
                  </div>

                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded bg-[#08080a] border border-[#26252a] text-[#a39e93]">
                    <span>Insight</span>
                    <span className="font-mono-num font-bold text-white">
                      {skills.insight?.passiveScore ?? 10}
                    </span>
                  </div>

                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded bg-[#08080a] border border-[#26252a] text-[#a39e93]">
                    <span>Perception</span>
                    <span className="font-mono-num font-bold text-white">
                      {skills.perception?.passiveScore ?? 10}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Bottom Center Collapse Handle */}
        <button
          type="button"
          onClick={() => setCardCollapsed((prev) => !prev)}
          title={
            cardCollapsed
              ? 'Expandir painel vital'
              : 'Recolher defesas e sentidos'
          }
          className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full border border-[#5c4b2b] bg-[#1c1b20] hover:bg-[#29272e] flex items-center justify-center text-[#c8a357] shadow cursor-pointer"
        >
          {cardCollapsed ? (
            <ChevronDown className="w-3.5 h-3.5" />
          ) : (
            <ChevronUp className="w-3.5 h-3.5" />
          )}
        </button>
      </div>
    </div>
  );
};
