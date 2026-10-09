import React, { useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  Info,
  Lock,
  MessageSquare,
  MinusCircle,
  Pencil,
  Plus,
  Search,
  Settings,
} from 'lucide-react';
import {
  ActionType,
  CharacterSheetState,
  FeatureCategory,
  FeatureTraitItem,
  ModifierTarget,
  StatModifier,
} from '../types/rpg';
import { ACTION_TYPES } from '../data/constants';
import { COMPENDIUM_CLASSES, COMPENDIUM_REALMS } from '../data/compendium';
import { resolveArchetypeBase } from '../data/archetypes';

interface FeaturesSectionProps {
  sheet: CharacterSheetState;
  onUpdateSheet: (updater: (prev: CharacterSheetState) => CharacterSheetState) => void;
  onSendFeatureToLog: (title: string, description: string, rollFormula?: string) => void;
  onOpenCompendiumItem: (tab: 'species' | 'realms' | 'classes', id: string) => void;
}

const FEATURE_CATEGORIES: { key: FeatureCategory; label: string }[] = [
  { key: 'Classes', label: 'CLASSES' },
  { key: 'Class Features', label: 'CLASS FEATURES' },
  { key: 'Realm Talents', label: 'REALM TALENTS' },
  { key: 'Species Traits', label: 'SPECIES TRAITS' },
  { key: 'Feats', label: 'FEATS' },
  { key: 'Others', label: 'OTHER' },
];

export const FeaturesSection: React.FC<FeaturesSectionProps> = ({
  sheet,
  onUpdateSheet,
  onSendFeatureToLog,
  onOpenCompendiumItem,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCat, setFilterCat] = useState<FeatureCategory | 'All'>('All');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [expandedIds, setExpandedIds] = useState<string[]>([]);
  const [advancedOpen, setAdvancedOpen] = useState(false);

  // New modifier draft inside Advanced Feature Editor
  const [modDraft, setModDraft] = useState<{
    target: ModifierTarget;
    subTarget: string;
    value: number;
  }>({
    target: 'Damage',
    subTarget: '',
    value: 2,
  });

  const charClass = COMPENDIUM_CLASSES.find((c) => c.id === sheet.classId);

  const baseArchetype = resolveArchetypeBase(sheet.classId);
  const realmInfo = COMPENDIUM_REALMS.find((r) => r.id === sheet.realmId);
  const realmArchetype = realmInfo?.arquetipos?.find(
    (a) => a.classe === baseArchetype
  );

  const handleUpdateFeature = (updated: FeatureTraitItem) => {
    onUpdateSheet((prev) => ({
      ...prev,
      features: prev.features.map((f) => (f.id === updated.id ? updated : f)),
    }));
  };

  const handleAddFeature = (category: FeatureCategory) => {
    const newId = `feat-custom-${Date.now()}`;
    const newFeat: FeatureTraitItem = {
      id: newId,
      name: 'New Feature',
      category,
      actionType: 'Passive',
      description: 'Descreva o efeito desta característica ou habilidade.',
      source: { type: 'Custom', name: 'Custom' },
      advanced: {
        modifiers: [],
        usesMax: 0,
        usesCurrent: 0,
        rechargeOn: 'None',
      },
    };
    onUpdateSheet((prev) => ({
      ...prev,
      features: [...prev.features, newFeat],
    }));
    setEditingId(newId);
  };

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  return (
    <div className="rounded-lg border border-[#786137] bg-[#141418] p-4 shadow-lg space-y-5">
      {/* Search & Filter Row matching Screenshot 14 */}
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
            value={filterCat}
            onChange={(e) =>
              setFilterCat(e.target.value as FeatureCategory | 'All')
            }
            aria-label="Filtrar categoria de Features"
            className="bg-transparent text-xs text-[#b8b4ac] border-l border-[#2c2a27] pl-2 ml-2 focus:outline-none cursor-pointer"
          >
            <option value="All" className="bg-[#16161b]">
              Show: All
            </option>
            {FEATURE_CATEGORIES.map((c) => (
              <option key={c.key} value={c.key} className="bg-[#16161b]">
                {c.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Category Groups matching Screenshot 14 */}
      <div className="space-y-6">
        {FEATURE_CATEGORIES.filter(
          (c) => filterCat === 'All' || filterCat === c.key
        ).map((cat) => {
          const items = sheet.features.filter(
            (f) =>
              f.category === cat.key &&
              (f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                f.description.toLowerCase().includes(searchQuery.toLowerCase()))
          );

          return (
            <div key={cat.key}>
              <div className="flex items-center justify-between pb-2 border-b border-[#2c2a27] text-xs">
                <div className="flex items-center gap-1.5 font-display font-bold tracking-wider text-[#d8b467] uppercase">
                  <Lock className="w-3 h-3 text-[#8c877e]" />
                  <span>{cat.label}</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleAddFeature(cat.key)}
                  className="p-1 text-[#a39e93] hover:text-[#e5c172] cursor-pointer"
                  title={`Adicionar em ${cat.label}`}
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {/* Class progression roadmap (milestones com níveis futuros apagados) */}
              {cat.key === 'Classes' && charClass && (
                <div className="pt-3 pb-1.5 space-y-1">
                  <div className="text-[10px] uppercase tracking-wide text-[#8c877e]">
                    Progressão de Classe — Nv atual {sheet.level}
                  </div>
                  {charClass.featuresByLevel.map((lb) => {
                    const unlocked = lb.level <= sheet.level;
                    return (
                      <div
                        key={lb.level}
                        className={`flex items-start gap-2.5 rounded border px-2.5 py-1.5 ${
                          unlocked
                            ? 'border-[#3a3835] bg-[#101014]'
                            : 'border-[#26252b] bg-[#0d0d11] opacity-40'
                        }`}
                      >
                        <span
                          className={`w-10 shrink-0 text-[10px] font-bold mt-0.5 ${
                            unlocked ? 'text-[#e5c172]' : 'text-[#6e6a63]'
                          }`}
                        >
                          Nv {lb.level}
                        </span>
                        <div className="min-w-0 flex-1">
                          {lb.features.map((f) => (
                            <div
                              key={f.name}
                              className={`text-[11px] leading-snug ${
                                unlocked ? 'text-white' : 'text-[#8c877e]'
                              }`}
                            >
                              {f.name}
                            </div>
                          ))}
                        </div>
                        {unlocked ? (
                          <span className="text-[9px] uppercase tracking-wide text-[#4ade80] whitespace-nowrap mt-0.5">
                            ✓ desbloqueado
                          </span>
                        ) : (
                          <Lock
                            className="w-3 h-3 text-[#6e6a63] mt-0.5 shrink-0" aria-label={`Desbloqueia no Nv ${lb.level}`}
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Realm talents progression roadmap (passiva sempre + níveis apagados) */}
              {cat.key === 'Realm Talents' && realmInfo && (
                <div className="pt-3 pb-1.5 space-y-1">
                  <div
                    className="text-[10px] uppercase tracking-wide"
                    style={{ color: realmInfo.cor }}
                  >
                    Talentos de {realmInfo.name}
                  </div>
                  {realmInfo.passiva && (
                    <div className="flex items-start gap-2.5 rounded border border-[#3a3835] bg-[#101014] px-2.5 py-1.5">
                      <span className="w-10 shrink-0 text-[10px] font-bold mt-0.5 text-[#e5c172]">
                        Nv 1
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="text-[11px] leading-snug text-white">
                          {realmInfo.passiva.nome}
                        </div>
                        <div className="text-[10px] text-[#8c877e] leading-snug line-clamp-2">
                          {realmInfo.passiva.desc}
                        </div>
                      </div>
                      <span className="text-[9px] uppercase tracking-wide text-[#4ade80] whitespace-nowrap mt-0.5">
                        ✓ passiva
                      </span>
                    </div>
                  )}
                  {(realmArchetype?.talentos ?? []).map((t) => {
                    const unlocked = t.nivel <= sheet.level;
                    return (
                      <div
                        key={`${t.nivel}-${t.nome}`}
                        className={`flex items-start gap-2.5 rounded border px-2.5 py-1.5 ${
                          unlocked
                            ? 'border-[#3a3835] bg-[#101014]'
                            : 'border-[#26252b] bg-[#0d0d11] opacity-40'
                        }`}
                      >
                        <span
                          className={`w-10 shrink-0 text-[10px] font-bold mt-0.5 ${
                            unlocked ? 'text-[#e5c172]' : 'text-[#6e6a63]'
                          }`}
                        >
                          Nv {t.nivel}
                        </span>
                        <div className="min-w-0 flex-1">
                          <div
                            className={`text-[11px] leading-snug ${
                              unlocked ? 'text-white' : 'text-[#8c877e]'
                            }`}
                          >
                            {t.nome}
                          </div>
                          <div className="text-[10px] text-[#8c877e] leading-snug line-clamp-1">
                            {t.desc}
                          </div>
                        </div>
                        {unlocked ? (
                          <span className="text-[9px] uppercase tracking-wide text-[#4ade80] whitespace-nowrap mt-0.5">
                            ✓ desbloqueado
                          </span>
                        ) : (
                          <Lock
                            className="w-3 h-3 text-[#6e6a63] mt-0.5 shrink-0" aria-label={`Desbloqueia no Nv ${t.nivel}`}
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* 22.1 Special Class Summary row under CLASSES */}
              {cat.key === 'Classes' && charClass && items.length === 0 && (
                <div className="py-3 flex items-center justify-between text-xs border-b border-[#201f25]">
                  <div>
                    <div className="font-semibold text-white">
                      {charClass.name} — Nível {sheet.level}
                    </div>
                    <div className="text-[11px] text-[#9e9a91] mt-0.5">
                      Hit Die: d{charClass.hitDie} · Atributos principais:{' '}
                      {charClass.primaryAbilities.join(' / ')}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => onOpenCompendiumItem('classes', charClass.id)}
                    className="inline-flex items-center gap-1 text-[#d8b467] hover:underline cursor-pointer"
                  >
                    <Info className="w-3.5 h-3.5" />
                    <span>Saiba mais</span>
                  </button>
                </div>
              )}

              {items.length === 0 && cat.key !== 'Classes' ? (
                <p className="py-2.5 text-xs text-[#6e6a63]">
                  No {cat.key}
                </p>
              ) : (
                <div className="divide-y divide-[#201f25]">
                  {items.map((feat) => {
                    const isEditing = editingId === feat.id;
                    const isExpanded = expandedIds.includes(feat.id);

                    if (isEditing) {
                      // 23 & 24. BASIC + ADVANCED FEATURE EDITOR
                      return (
                        <div
                          key={feat.id}
                          className="py-4 px-3 my-2 rounded border border-[#5c4b2b] bg-[#18181e] space-y-4 text-xs"
                        >
                          <div className="flex items-center justify-between pb-2.5 border-b border-[#2a2825]">
                            <span className="font-display font-bold text-xs tracking-wider text-white uppercase">
                              EDIT FEATURE: {feat.name}
                            </span>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => setAdvancedOpen((p) => !p)}
                                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs transition-colors cursor-pointer ${
                                  advancedOpen
                                    ? 'bg-[#2d2516] text-[#f0cd7e] border border-[#c8a357]'
                                    : 'text-[#b8b4ac] hover:text-white'
                                }`}
                              >
                                <Settings className="w-3.5 h-3.5 text-[#c8a357]" />
                                <span>Advanced</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditingId(null)}
                                className="px-3 py-1 rounded bg-[#2e2d35] hover:bg-[#3e3d47] text-white font-bold uppercase tracking-wider cursor-pointer"
                              >
                                DONE
                              </button>
                            </div>
                          </div>

                          {/* Basic Fields: Name, Category, Action Type */}
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div className="flex items-center border-b border-[#3a3835] pb-1">
                              <span className="text-[#9e9a91] uppercase text-[10px] mr-2">
                                NAME:
                              </span>
                              <input
                                type="text"
                                value={feat.name}
                                onChange={(e) =>
                                  handleUpdateFeature({
                                    ...feat,
                                    name: e.target.value,
                                  })
                                }
                                className="w-full bg-transparent text-white font-medium focus:outline-none"
                              />
                            </div>

                            <div className="flex items-center border-b border-[#3a3835] pb-1">
                              <span className="text-[#9e9a91] uppercase text-[10px] mr-2">
                                CATEGORY:
                              </span>
                              <select
                                value={feat.category}
                                onChange={(e) =>
                                  handleUpdateFeature({
                                    ...feat,
                                    category: e.target.value as FeatureCategory,
                                  })
                                }
                                className="w-full bg-transparent text-white focus:outline-none cursor-pointer"
                              >
                                {FEATURE_CATEGORIES.map((c) => (
                                  <option
                                    key={c.key}
                                    value={c.key}
                                    className="bg-[#18181e]"
                                  >
                                    {c.label}
                                  </option>
                                ))}
                              </select>
                            </div>

                            <div className="flex items-center border-b border-[#3a3835] pb-1">
                              <span className="text-[#9e9a91] uppercase text-[10px] mr-2">
                                ACTION:
                              </span>
                              <select
                                value={feat.actionType}
                                onChange={(e) =>
                                  handleUpdateFeature({
                                    ...feat,
                                    actionType: e.target.value as ActionType,
                                  })
                                }
                                className="w-full bg-transparent text-white focus:outline-none cursor-pointer"
                              >
                                {ACTION_TYPES.map((at) => (
                                  <option
                                    key={at}
                                    value={at}
                                    className="bg-[#18181e]"
                                  >
                                    {at}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>

                          {/* 24. ADVANCED FEATURE EDITOR (Checkboxes, Uses, Active Stat Modifiers) */}
                          {advancedOpen && (
                            <div className="p-3 rounded bg-[#121216] border border-[#4a3f28] space-y-3">
                              <div className="font-semibold text-[#e5c172]">
                                Advanced Feature Builder (Checkboxes, Usos & Modificadores Ativos)
                              </div>

                              {/* Uses & Recharge */}
                              <div className="grid grid-cols-2 gap-3">
                                <div>
                                  <label className="block text-[#9e9a91] text-[11px] mb-1">
                                    Checkboxes de Uso (Max Usos)
                                  </label>
                                  <input
                                    type="number"
                                    min={0}
                                    max={10}
                                    value={feat.advanced?.usesMax || 0}
                                    onChange={(e) => {
                                      const max = Math.max(
                                        0,
                                        parseInt(e.target.value, 10) || 0
                                      );
                                      handleUpdateFeature({
                                        ...feat,
                                        advanced: {
                                          modifiers:
                                            feat.advanced?.modifiers || [],
                                          usesMax: max,
                                          usesCurrent: max,
                                          rechargeOn:
                                            feat.advanced?.rechargeOn ||
                                            'Short Rest',
                                          customButtons:
                                            feat.advanced?.customButtons,
                                        },
                                      });
                                    }}
                                    className="w-full px-2 py-1 rounded bg-[#18181e] border border-[#33312e] font-mono-num text-white"
                                  />
                                </div>
                                <div>
                                  <label className="block text-[#9e9a91] text-[11px] mb-1">
                                    Recarrega em
                                  </label>
                                  <select
                                    value={
                                      feat.advanced?.rechargeOn || 'Short Rest'
                                    }
                                    onChange={(e) =>
                                      handleUpdateFeature({
                                        ...feat,
                                        advanced: {
                                          modifiers:
                                            feat.advanced?.modifiers || [],
                                          usesMax: feat.advanced?.usesMax || 0,
                                          usesCurrent:
                                            feat.advanced?.usesCurrent || 0,
                                          rechargeOn: e.target.value as any,
                                        },
                                      })
                                    }
                                    className="w-full px-2 py-1 rounded bg-[#18181e] border border-[#33312e] text-white"
                                  >
                                    <option value="None">Manual</option>
                                    <option value="Turn">1x por Turno</option>
                                    <option value="Combat">
                                      1x por Combate
                                    </option>
                                    <option value="Short Rest">
                                      Short Rest
                                    </option>
                                    <option value="Long Rest">Long Rest</option>
                                  </select>
                                </div>
                              </div>

                              {/* Active Sheet Modifiers */}
                              <div className="pt-2 border-t border-[#26252b] space-y-2">
                                <div className="text-[11px] text-[#b8b4ac]">
                                  Modificadores automáticos na ficha:
                                </div>
                                {(feat.advanced?.modifiers || []).map((m) => (
                                  <div
                                    key={m.id}
                                    className="flex items-center justify-between px-2.5 py-1 rounded bg-[#18181e] border border-[#2c2a27]"
                                  >
                                    <span className="text-[#e5c172]">
                                      {m.target}{' '}
                                      {m.subTarget ? `(${m.subTarget})` : ''}:{' '}
                                      {m.value >= 0 ? `+${m.value}` : m.value}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleUpdateFeature({
                                          ...feat,
                                          advanced: {
                                            ...feat.advanced!,
                                            modifiers:
                                              feat.advanced!.modifiers.filter(
                                                (x) => x.id !== m.id
                                              ),
                                          },
                                        })
                                      }
                                      className="text-[#f87171] hover:underline"
                                    >
                                      Remover
                                    </button>
                                  </div>
                                ))}

                                <div className="flex flex-wrap items-center gap-2">
                                  <select
                                    value={modDraft.target}
                                    onChange={(e) =>
                                      setModDraft({
                                        ...modDraft,
                                        target: e.target
                                          .value as ModifierTarget,
                                      })
                                    }
                                    className="px-2 py-1 rounded bg-[#18181e] border border-[#33312e] text-white"
                                  >
                                    <option value="Damage">Damage</option>
                                    <option value="Attack">Attack</option>
                                    <option value="AC">AC</option>
                                    <option value="Initiative">
                                      Initiative
                                    </option>
                                    <option value="Speed">Speed</option>
                                    <option value="MaxHP">MaxHP</option>
                                    <option value="AbilityScore">
                                      AbilityScore
                                    </option>
                                  </select>
                                  {modDraft.target === 'AbilityScore' && (
                                    <select
                                      value={modDraft.subTarget || 'INT'}
                                      onChange={(e) =>
                                        setModDraft({
                                          ...modDraft,
                                          subTarget: e.target.value,
                                        })
                                      }
                                      className="px-2 py-1 rounded bg-[#18181e] border border-[#33312e] text-white"
                                    >
                                      <option value="STR">STR</option>
                                      <option value="DEX">DEX</option>
                                      <option value="CON">CON</option>
                                      <option value="INT">INT</option>
                                      <option value="WIS">WIS</option>
                                      <option value="CHA">CHA</option>
                                    </select>
                                  )}
                                  <input
                                    type="number"
                                    value={modDraft.value}
                                    onChange={(e) =>
                                      setModDraft({
                                        ...modDraft,
                                        value:
                                          parseInt(e.target.value, 10) || 0,
                                      })
                                    }
                                    className="w-16 px-2 py-1 rounded bg-[#18181e] border border-[#33312e] font-mono-num text-white"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const newMod: StatModifier = {
                                        id: `mod-f-${Date.now()}`,
                                        target: modDraft.target,
                                        subTarget:
                                          modDraft.target === 'AbilityScore'
                                            ? modDraft.subTarget || 'INT'
                                            : undefined,
                                        value: modDraft.value,
                                        source: {
                                          type: 'Feature',
                                          name: feat.name,
                                        },
                                      };
                                      handleUpdateFeature({
                                        ...feat,
                                        advanced: {
                                          usesMax: feat.advanced?.usesMax || 0,
                                          usesCurrent:
                                            feat.advanced?.usesCurrent || 0,
                                          rechargeOn:
                                            feat.advanced?.rechargeOn || 'None',
                                          modifiers: [
                                            ...(feat.advanced?.modifiers || []),
                                            newMod,
                                          ],
                                        },
                                      });
                                    }}
                                    className="px-2.5 py-1 rounded bg-[#8a6f3b] text-white font-semibold cursor-pointer"
                                  >
                                    + Add Modifier
                                  </button>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Description */}
                          <div>
                            <label className="block text-[#9e9a91] uppercase text-[10px] mb-1">
                              DESCRIPTION
                            </label>
                            <textarea
                              rows={3}
                              value={feat.description}
                              onChange={(e) =>
                                handleUpdateFeature({
                                  ...feat,
                                  description: e.target.value,
                                })
                              }
                              className="w-full rounded border border-[#3a3835] bg-[#121216] p-2.5 text-white focus:border-[#c8a357] focus:outline-none"
                            />
                          </div>

                          <button
                            type="button"
                            onClick={() => {
                              onUpdateSheet((prev) => ({
                                ...prev,
                                features: prev.features.filter(
                                  (f) => f.id !== feat.id
                                ),
                              }));
                              setEditingId(null);
                            }}
                            className="inline-flex items-center gap-1.5 text-xs text-[#e07a7a] hover:text-[#f87171] cursor-pointer"
                          >
                            <MinusCircle className="w-4 h-4 fill-[#e07a7a]/20" />
                            <span>Remove</span>
                          </button>
                        </div>
                      );
                    }

                    // COMPACT FEATURE ROW matching Screenshot 14
                    return (
                      <div key={feat.id} className="py-3.5 text-xs">
                        <div className="grid grid-cols-12 items-start gap-2">
                          {/* Left Column: Title, Action Type Tag, Origin, Usage Checkboxes */}
                          <div className="col-span-5 pr-1 space-y-1">
                            <div className="font-semibold text-white leading-snug">
                              {feat.name}
                            </div>

                            {feat.actionType &&
                              feat.actionType !== 'Passive' &&
                              feat.actionType !== 'None' && (
                                <span className="inline-block px-2 py-0.5 rounded bg-[#232229] text-[10px] font-medium text-[#d4d0c8]">
                                  {feat.actionType}
                                </span>
                              )}

                            <div className="text-[11px] text-[#8c877e] flex items-center gap-1.5 flex-wrap">
                              <span>
                                {feat.source.type === 'Realm'
                                  ? `Realm: ${feat.source.name}`
                                  : feat.source.name}
                              </span>
                              {feat.source.id &&
                                (feat.source.type === 'Species' ||
                                  feat.source.type === 'Realm' ||
                                  feat.source.type === 'Class') && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      onOpenCompendiumItem(
                                        feat.source.type === 'Species'
                                          ? 'species'
                                          : feat.source.type === 'Realm'
                                          ? 'realms'
                                          : 'classes',
                                        feat.source.id!
                                      )
                                    }
                                    className="text-[#d8b467] hover:underline inline-flex items-center gap-0.5 cursor-pointer"
                                  >
                                    <Info className="w-3 h-3" />
                                    <span>Saiba mais</span>
                                  </button>
                                )}
                            </div>

                            {/* Red Checkboxes for Uses (Matching Screenshot 14 Second Wind & Action Surge!) */}
                            {feat.advanced && feat.advanced.usesMax > 0 && (
                              <div className="flex items-center gap-1.5 pt-1">
                                {Array.from({
                                  length: feat.advanced.usesMax,
                                }).map((_, idx) => {
                                  const checked =
                                    idx < (feat.advanced?.usesCurrent ?? 0);
                                  return (
                                    <button
                                      key={idx}
                                      type="button"
                                      onClick={() =>
                                        handleUpdateFeature({
                                          ...feat,
                                          advanced: {
                                            ...feat.advanced!,
                                            usesCurrent:
                                              idx < feat.advanced!.usesCurrent
                                                ? idx
                                                : idx + 1,
                                          },
                                        })
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
                                })}
                              </div>
                            )}
                          </div>

                          {/* Middle Column: Description */}
                          <div className="col-span-5 text-[#9e9a91] leading-relaxed">
                            <p className={isExpanded ? '' : 'line-clamp-3'}>
                              {feat.description}
                            </p>

                            {/* Interactive Custom Buttons inside Feature */}
                            {feat.advanced?.customButtons?.map((btn) => (
                              <button
                                key={btn.id}
                                type="button"
                                onClick={() =>
                                  onSendFeatureToLog(
                                    feat.name,
                                    feat.description,
                                    btn.rollFormula
                                  )
                                }
                                className="mt-2 inline-flex items-center gap-1 px-2.5 py-1 rounded bg-[#2a2315] hover:bg-[#3a301c] border border-[#8a6f3b] text-[#f0cd7e] text-[11px] font-semibold cursor-pointer"
                              >
                                {btn.label}
                              </button>
                            ))}
                          </div>

                          {/* Right Column: Expand, Edit, Send to Log */}
                          <div className="col-span-2 flex flex-col items-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => toggleExpand(feat.id)}
                              className="p-1 text-[#8c877e] hover:text-white cursor-pointer"
                            >
                              {isExpanded ? (
                                <ChevronUp className="w-3.5 h-3.5" />
                              ) : (
                                <ChevronDown className="w-3.5 h-3.5" />
                              )}
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingId(feat.id)}
                              className="p-1 text-[#8c877e] hover:text-white cursor-pointer"
                              aria-label={`Editar ${feat.name}`}
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                onSendFeatureToLog(feat.name, feat.description)
                              }
                              title="Enviar para o Combat Log"
                              className="p-1 text-[#8c877e] hover:text-[#e5c172] cursor-pointer"
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
