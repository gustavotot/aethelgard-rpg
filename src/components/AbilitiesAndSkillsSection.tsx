import React, { useState } from 'react';
import { Info, Plus, Settings, Trash2 } from 'lucide-react';
import {
  AbilityKey,
  CharacterSheetState,
  ProficiencyLevel,
} from '../types/rpg';
import { ABILITY_KEYS, ABILITY_LABELS, SKILLS_LIST } from '../data/constants';
import {
  ComputedAbility,
  ComputedSkill,
  formatSigned,
} from '../utils/calculations';
import { ProficiencySelector } from './ProficiencySelector';

interface AbilitiesSectionProps {
  sheet: CharacterSheetState;
  abilities: Record<AbilityKey, ComputedAbility>;
  onUpdateSheet: (updater: (prev: CharacterSheetState) => CharacterSheetState) => void;
  onRollD20: (title: string, subtitle: string, modifier: number) => void;
  onOpenCompendiumItem: (tab: 'species' | 'realms' | 'classes', id: string) => void;
}

export const AbilitiesSection: React.FC<AbilitiesSectionProps> = ({
  abilities,
  onUpdateSheet,
  onRollD20,
  onOpenCompendiumItem,
}) => {
  const [showOriginsDetail, setShowOriginsDetail] = useState(false);

  const handleBaseScoreChange = (key: AbilityKey, newTotalStr: string) => {
    const parsed = parseInt(newTotalStr, 10);
    if (isNaN(parsed)) return;
    const bonusFromSources = abilities[key].bonusScore;
    const newBase = Math.max(1, Math.min(30, parsed - bonusFromSources));
    onUpdateSheet((prev) => ({
      ...prev,
      abilities: {
        ...prev.abilities,
        [key]: {
          ...prev.abilities[key],
          baseScore: newBase,
        },
      },
    }));
  };

  const handleSaveProfChange = (key: AbilityKey, level: ProficiencyLevel) => {
    onUpdateSheet((prev) => ({
      ...prev,
      abilities: {
        ...prev.abilities,
        [key]: {
          ...prev.abilities[key],
          saveProficiency: level,
          saveSource: { type: 'Custom', name: 'Manual' },
        },
      },
    }));
  };

  return (
    <div className="rounded-lg border border-[#786137] bg-gradient-to-b from-[#131317] to-[#0c0c10] p-4 shadow-[0_8px_30px_rgba(0,0,0,0.75)]">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display font-bold text-sm tracking-wider text-[#d8b467] uppercase">
          ABILITIES
        </h2>
        <button
          type="button"
          onClick={() => setShowOriginsDetail((prev) => !prev)}
          className={`inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs transition-colors cursor-pointer ${
            showOriginsDetail
              ? 'bg-[#2a2315] text-[#f0cd7e] border border-[#8a6f3b]'
              : 'text-[#8c877e] hover:text-[#d8b467]'
          }`}
          title="Ver origem dos modificadores de atributo"
        >
          <Settings className="w-4 h-4" />
          <span className="hidden sm:inline">Origens</span>
        </button>
      </div>

      {/* 2-Column Grid matching Screenshot 1 & 2 */}
      <div className="grid grid-cols-2 gap-x-3 sm:gap-x-5 gap-y-5">
        {ABILITY_KEYS.map((key) => {
          const comp = abilities[key];
          const hasSourceBonus = comp.bonusScore !== 0;

          return (
            <div
              key={key}
              className="flex flex-col rounded-md bg-[#0b0b0e]/70 border border-[#1d1c22] p-2.5"
            >
              <div className="flex items-start justify-between gap-1.5 sm:gap-2">
                {/* Left: Ability Label + Score Box */}
                <div className="flex items-center gap-1.5 sm:gap-2 pt-2">
                  <span
                    className="font-bold text-xs sm:text-sm tracking-wide text-white w-8 sm:w-9"
                    title={ABILITY_LABELS[key].full}
                  >
                    {key}
                  </span>
                  <div className="relative">
                    <input
                      type="number"
                      value={comp.totalScore}
                      onChange={(e) => handleBaseScoreChange(key, e.target.value)}
                      aria-label={`${key} Score`}
                      className={`w-9 sm:w-11 h-9 rounded border bg-[#070709] shadow-inner text-center font-mono-num text-xs sm:text-sm font-bold text-white focus:outline-none focus:border-[#c8a357] ${
                        hasSourceBonus
                          ? 'border-[#9e7f43]'
                          : 'border-[#3a3835]'
                      }`}
                    />
                    {hasSourceBonus && (
                      <span
                        title={`Base ${comp.baseScore} ${formatSigned(
                          comp.bonusScore
                        )} (${comp.sources
                          .map((s) => s.source.name)
                          .join(', ')})`}
                        className="absolute -top-1.5 -right-1.5 px-1 rounded bg-[#2d2516] border border-[#c8a357] text-[9px] font-mono-num text-[#f5d98e]"
                      >
                        {formatSigned(comp.bonusScore)}
                      </span>
                    )}
                  </div>
                </div>

                {/* Right: Mod Box & Save Box */}
                <div className="flex items-start gap-1.5 sm:gap-2.5">
                  {/* Mod Column (Elevated matte slate like Screenshot 2) */}
                  <div className="flex flex-col items-center">
                    <button
                      type="button"
                      onClick={() =>
                        onRollD20(
                          `${ABILITY_LABELS[key].full} Check`,
                          `Atributo ${key}`,
                          comp.modifier
                        )
                      }
                      title={`Rolar teste de ${ABILITY_LABELS[key].full}`}
                      className="w-10 sm:w-11 h-11 rounded-md border border-[#3a3942] bg-[#2a2a32] hover:bg-[#353540] hover:border-[#786137] shadow-sm flex items-center justify-center font-mono-num text-sm sm:text-base font-bold text-white transition-colors cursor-pointer"
                    >
                      {formatSigned(comp.modifier)}
                    </button>
                    <span className="text-[10px] sm:text-[11px] text-[#a39e93] mt-1.5">
                      Mod
                    </span>
                  </div>

                  {/* Save Column (Deep recessed obsidian like Screenshot 2) */}
                  <div className="flex flex-col items-center">
                    <button
                      type="button"
                      onClick={() =>
                        onRollD20(
                          `${ABILITY_LABELS[key].full} Save`,
                          `Saving Throw (${key})`,
                          comp.saveBonus
                        )
                      }
                      title={`Rolar salvaguarda de ${ABILITY_LABELS[key].full}`}
                      className={`w-10 sm:w-11 h-11 rounded-md border shadow-inner flex items-center justify-center font-mono-num text-sm sm:text-base font-bold text-white transition-colors cursor-pointer ${
                        comp.saveProficiency !== 'None'
                          ? 'border-[#a12a2a] bg-[#210d0f] hover:bg-[#331417]'
                          : 'border-[#25242b] bg-[#070709] hover:bg-[#121217]'
                      }`}
                    >
                      {formatSigned(comp.saveBonus)}
                    </button>
                    <div className="-mt-1">
                      <ProficiencySelector
                        value={comp.saveProficiency}
                        onChange={(lvl) => handleSaveProfChange(key, lvl)}
                        size="sm"
                      />
                    </div>
                    <span className="text-[10px] sm:text-[11px] text-[#a39e93] -mt-0.5">
                      Save
                    </span>
                  </div>
                </div>
              </div>

              {/* Source Explanation Row when toggled or when ability has an origin modifier (Section 1 & 32) */}
              {(showOriginsDetail || hasSourceBonus) && comp.sources.length > 0 && (
                <div className="mt-2 px-2 py-1 rounded bg-[#1b1915] border border-[#3d3423] flex items-center justify-between text-[11px] text-[#c7bfa8]">
                  <span>
                    Base {comp.baseScore}{' '}
                    {comp.sources.map((s) => (
                      <span key={s.id} className="text-[#e5c172] font-medium">
                        {formatSigned(s.value)} ({s.source.type}: {s.source.name})
                      </span>
                    ))}
                  </span>
                  {comp.sources[0]?.source.id && (
                    <button
                      type="button"
                      onClick={() => {
                        const src = comp.sources[0].source;
                        if (src.type === 'Species' && src.id) {
                          onOpenCompendiumItem('species', src.id);
                        } else if (src.type === 'Realm' && src.id) {
                          onOpenCompendiumItem('realms', src.id);
                        }
                      }}
                      className="inline-flex items-center gap-0.5 text-[#d8b467] hover:underline cursor-pointer"
                    >
                      <Info className="w-3 h-3" />
                      <span>Regra</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

interface SkillsSectionProps {
  sheet: CharacterSheetState;
  skills: Record<string, ComputedSkill>;
  onUpdateSheet: (updater: (prev: CharacterSheetState) => CharacterSheetState) => void;
  onRollD20: (title: string, subtitle: string, modifier: number) => void;
}

export const SkillsAndToolsSection: React.FC<SkillsSectionProps> = ({
  sheet,
  skills,
  onUpdateSheet,
  onRollD20,
}) => {
  const [addingTool, setAddingTool] = useState(false);
  const [newToolName, setNewToolName] = useState('');

  const handleSkillProfChange = (skillId: string, newLevel: ProficiencyLevel) => {
    onUpdateSheet((prev) => ({
      ...prev,
      skills: {
        ...prev.skills,
        [skillId]: {
          ...prev.skills[skillId],
          proficiency: newLevel,
          source: { type: 'Custom', name: 'Manual' },
        },
      },
    }));
  };

  const toolProfs = sheet.proficiencies.filter((p) => p.category === 'Tools');

  const handleAddTool = () => {
    if (!newToolName.trim()) return;
    onUpdateSheet((prev) => ({
      ...prev,
      proficiencies: [
        ...prev.proficiencies,
        {
          id: `prof-tool-${Date.now()}`,
          category: 'Tools',
          name: newToolName.trim(),
          source: { type: 'Custom', name: 'Manual' },
        },
      ],
    }));
    setNewToolName('');
    setAddingTool(false);
  };

  return (
    <div className="rounded-lg border border-[#786137] bg-[#141418] p-4 shadow-lg space-y-6">
      {/* SKILLS TABLE matching Screenshot 5 */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-display font-bold text-sm tracking-wider text-[#d8b467] uppercase">
            SKILLS
          </h2>
        </div>

        {/* Column Headers */}
        <div className="grid grid-cols-12 items-center pb-2 border-b border-[#252429] text-[11px] font-semibold tracking-wider text-[#9e9a91] uppercase">
          <div className="col-span-6">TYPE</div>
          <div className="col-span-2 text-center">MOD</div>
          <div className="col-span-2 text-center">BONUS</div>
          <div className="col-span-2 text-right pr-1">PROF</div>
        </div>

        {/* Skill Rows */}
        <div className="divide-y divide-[#1f1e24]">
          {SKILLS_LIST.map((def) => {
            const sk = skills[def.id];
            const isTrained = sk.proficiency !== 'None';

            return (
              <div
                key={def.id}
                className="grid grid-cols-12 items-center py-2.5 hover:bg-white/[0.02] transition-colors"
              >
                <div className="col-span-6 pr-2">
                  <div className="text-sm font-medium text-[#e6e4e0] leading-snug">
                    {def.name}
                  </div>
                  {sk.sourceName !== 'Base' && isTrained && (
                    <div className="text-[10px] text-[#9e8756]">
                      {sk.sourceName}
                    </div>
                  )}
                </div>

                <div className="col-span-2 text-center text-[11px] font-semibold text-[#8c877e] uppercase">
                  {def.ability}
                </div>

                <div className="col-span-2 flex justify-center">
                  <button
                    type="button"
                    onClick={() =>
                      onRollD20(
                        def.name,
                        `Skill Check (${def.ability})`,
                        sk.totalBonus
                      )
                    }
                    title={`Rolar perícia ${def.name}`}
                    className={`w-11 h-9 rounded border flex items-center justify-center font-mono-num text-sm font-bold text-white transition-colors cursor-pointer ${
                      isTrained
                        ? 'border-[#a12a2a] bg-[#241315] hover:bg-[#361b1e]'
                        : 'border-[#2c2b30] bg-[#18181d] hover:bg-[#23232b]'
                    }`}
                  >
                    {formatSigned(sk.totalBonus)}
                  </button>
                </div>

                <div className="col-span-2 flex justify-end">
                  <ProficiencySelector
                    value={sk.proficiency}
                    onChange={(lvl) => handleSkillProfChange(def.id, lvl)}
                    sourceLabel={sk.sourceName}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* TOOLS SECTION matching bottom of Screenshot 5 */}
      <div className="pt-4 border-t border-[#2c2a27]">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-display font-bold text-sm tracking-wider text-[#d8b467] uppercase">
            TOOLS
          </h3>
          <button
            type="button"
            onClick={() => setAddingTool((prev) => !prev)}
            className="p-1.5 rounded text-[#a39e93] hover:text-[#e5c172] hover:bg-white/5 cursor-pointer"
            title="Adicionar Ferramenta"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {addingTool && (
          <div className="flex items-center gap-2 mb-3">
            <input
              type="text"
              value={newToolName}
              onChange={(e) => setNewToolName(e.target.value)}
              placeholder="Ex: Thieves' Tools, Herbalism Kit..."
              className="flex-1 px-3 py-1.5 rounded border border-[#3a3835] bg-[#101014] text-xs text-white focus:border-[#c8a357] focus:outline-none"
            />
            <button
              type="button"
              onClick={handleAddTool}
              className="px-3 py-1.5 rounded bg-[#8a6f3b] hover:bg-[#a38447] text-xs font-semibold text-white cursor-pointer"
            >
              Add
            </button>
          </div>
        )}

        {toolProfs.length === 0 ? (
          <p className="text-xs text-[#6e6a63] italic">No tools... yet</p>
        ) : (
          <div className="space-y-1.5">
            {toolProfs.map((tool) => (
              <div
                key={tool.id}
                className="flex items-center justify-between px-3 py-2 rounded bg-[#18181e] border border-[#26252b] text-xs"
              >
                <div>
                  <span className="text-white font-medium">{tool.name}</span>
                  <span className="text-[#8c877e] ml-2">
                    ({tool.source.name})
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    onUpdateSheet((prev) => ({
                      ...prev,
                      proficiencies: prev.proficiencies.filter(
                        (p) => p.id !== tool.id
                      ),
                    }))
                  }
                  className="text-[#78746d] hover:text-[#f87171] p-1 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
