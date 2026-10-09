import React, { useMemo, useState } from 'react';
import {
  ArrowLeft,
  BookOpen,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Compass,
  Crown,
  Lock,
  Package,
  Shield,
  Sparkles,
  Users,
  Wand2,
  Plus,
} from 'lucide-react';
import {
  COMPENDIUM_BACKGROUNDS,
  COMPENDIUM_CLASSES,
  COMPENDIUM_FEATS,
  COMPENDIUM_REALMS,
  COMPENDIUM_SPECIES,
} from '../data/compendium';
import { SPELL_SCHOOLS } from '../data/constants';
import {
  affinityLabel,
  schoolAffinityStatus,
  SPELL_SCHOOL_LABELS_PT,
} from '../data/affinities';
import {
  SPELLS_LIBRARY,
  librarySpellId,
  librarySpellToSpellItem,
  spellDamageBlurb,
} from '../data/spellLibrary';
import {
  LIBRARY_ARMOR,
  LIBRARY_SHIELD,
  LIBRARY_WEAPONS,
  armorLibraryBlurb,
  weaponLibraryBlurb,
} from '../data/equipmentLibrary';
import { libraryItemToEquipment } from '../utils/characterFactory';
import { COMPENDIUM_ARCHETYPES, resolveArchetypeBase } from '../data/archetypes';
import { CharacterSheetState } from '../types/rpg';
import { synchronizeOrigins } from '../utils/calculations';

interface CompendiumViewProps {
  sheet: CharacterSheetState;
  initialTab?: 'realms' | 'species' | 'classes' | 'backgrounds' | 'feats' | 'spells' | 'equipment';
  initialSelectedId?: string;
  onUpdateSheet: (updater: (prev: CharacterSheetState) => CharacterSheetState) => void;
  onBackToSheet: () => void;
}

export const CompendiumView: React.FC<CompendiumViewProps> = ({
  sheet,
  initialTab = 'realms',
  initialSelectedId,
  onUpdateSheet,
  onBackToSheet,
}) => {
  const [activeTab, setActiveTab] = useState<
    'realms' | 'species' | 'classes' | 'backgrounds' | 'feats' | 'spells' | 'equipment'
  >(initialTab);
  const [selectedId, setSelectedId] = useState<string | undefined>(
    initialSelectedId
  );
  const [spellQuery, setSpellQuery] = useState('');
  const [spellLevelFilter, setSpellLevelFilter] = useState<number | 'all'>('all');
  const [spellSchoolFilter, setSpellSchoolFilter] = useState<string>('all');
  const [realmOpen, setRealmOpen] = useState<Record<string, boolean>>(() => ({
    [sheet.realmId]: true,
  }));
  const [featRealmId, setFeatRealmId] = useState<string>(sheet.realmId);
  const [passivaExpanded, setPassivaExpanded] = useState(false);
  const [openArchetypeTalents, setOpenArchetypeTalents] = useState<
    Record<string, boolean>
  >({});

  const filteredSpells = useMemo(() => {
    const q = spellQuery.trim().toLowerCase();
    return SPELLS_LIBRARY.filter((s) => {
      if (spellLevelFilter !== 'all' && s.level !== spellLevelFilter) return false;
      if (
        spellSchoolFilter !== 'all' &&
        s.school.toLowerCase() !== spellSchoolFilter.toLowerCase()
      )
        return false;
      if (q && !s.name.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [spellQuery, spellLevelFilter, spellSchoolFilter]);

  const handleApplyOrigin = (
    updates: Parameters<typeof synchronizeOrigins>[1]
  ) => {
    onUpdateSheet((prev) => synchronizeOrigins(prev, updates));
  };

  return (
    <div className="space-y-5">
      {/* Top Compendium Banner */}
      <div className="rounded-lg border border-[#786137] bg-[#141418] p-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-[#e5c172] font-display font-bold text-base tracking-wider uppercase">
            <BookOpen className="w-5 h-5 text-[#c8a357]" />
            <span>Compêndio de Regras & Lore — Aethelgard RPG</span>
          </div>
          <p className="text-xs text-[#9e9a91] mt-1">
            A ficha mostra o estado jogável do personagem; o Compêndio guarda a lore completa e as regras de origem que alimentam automaticamente a ficha.
          </p>
        </div>

        <button
          type="button"
          onClick={onBackToSheet}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded border border-[#c8a357] bg-[#1f1b14] hover:bg-[#2d261b] text-[#f0cd7e] text-xs font-semibold transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar para a Ficha ({sheet.name})</span>
        </button>
      </div>

      {/* Category Tabs */}
      <div className="flex flex-wrap gap-2">
        {(
          [
            { id: 'spells', label: 'Magias (SRD)', icon: Wand2 },
            { id: 'equipment', label: 'Equipamentos', icon: Package },
            { id: 'realms', label: 'Realms (Reinos)', icon: Crown },
            { id: 'species', label: 'Species (Espécies)', icon: Users },
            { id: 'classes', label: 'Classes & Arquétipos', icon: Shield },
            { id: 'backgrounds', label: 'Backgrounds', icon: Compass },
            { id: 'feats', label: 'Feats (Talentos)', icon: Sparkles },
          ] as const
        ).map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                setActiveTab(tab.id);
                setSelectedId(undefined);
              }}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-md border text-xs font-semibold transition-colors cursor-pointer ${
                active
                  ? 'border-[#c8a357] bg-[#262015] text-[#f5d98e]'
                  : 'border-[#2c2a27] bg-[#141418] text-[#9e9a91] hover:text-white'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* REALMS TAB (Highlighting Revendor as specified in Sections 1, 34, 35) */}
      {activeTab === 'realms' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {COMPENDIUM_REALMS.map((realm) => {
            const isCurrent = sheet.realmId === realm.id;
            const isHighlighted = selectedId === realm.id;
            const open = realmOpen[realm.id] ?? false;

            return (
              <div
                key={realm.id}
                className={`rounded-lg border p-5 bg-[#141418] space-y-4 transition-all ${
                  isCurrent || isHighlighted
                    ? 'border-[#c8a357] shadow-[0_0_20px_rgba(200,163,87,0.12)]'
                    : 'border-[#33302c]'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <button
                    type="button"
                    onClick={() =>
                      setRealmOpen((prev) => ({
                        ...prev,
                        [realm.id]: !(prev[realm.id] ?? false),
                      }))
                    }
                    className="text-left flex-1 cursor-pointer group"
                  >
                    <div className="flex items-center gap-2">
                      {open ? (
                        <ChevronDown className="w-4 h-4 text-[#c8a357] shrink-0" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-[#c8a357] shrink-0" />
                      )}
                      <h3 className="font-display font-bold text-lg text-[#f0cd7e] tracking-wide group-hover:text-white">
                        {realm.name}
                      </h3>
                      <span className="text-xs text-[#9e9a91]">
                        · Afinidade: {realm.elementAffinity}
                      </span>
                    </div>
                    <p className="text-xs text-[#c7bfa8] mt-0.5 pl-6">
                      {realm.tagline}
                    </p>
                  </button>

                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() =>
                        setRealmOpen((prev) => ({
                          ...prev,
                          [realm.id]: true,
                        }))
                      }
                      className="text-[11px] text-[#9e9a91] hover:text-[#f0cd7e] underline underline-offset-2 cursor-pointer"
                    >
                      {open ? 'Recolher' : 'Expandir'}
                    </button>
                    {isCurrent ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-[#1b2e1e] border border-[#22c55e]/50 text-[#4ade80] text-xs font-semibold">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Ativo na Ficha</span>
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleApplyOrigin({ realmId: realm.id })}
                        className="px-3 py-1.5 rounded bg-[#8a6f3b] hover:bg-[#a38447] text-white text-xs font-semibold cursor-pointer"
                      >
                        Escolher Reino
                      </button>
                    )}
                  </div>
                </div>

                {open && (
                  <>
                    {/* Lore Box */}
                    <div className="p-3 rounded bg-[#101014] border border-[#252429] text-xs text-[#d4d0c8] leading-relaxed">
                      {realm.lore}
                    </div>

                    {/* Automatic Grants to Character Sheet */}
                    <div className="space-y-2.5 text-xs">
                      <div className="font-semibold text-[#d8b467] uppercase tracking-wider text-[11px]">
                        Concessões Automáticas para a Ficha:
                      </div>

                      {realm.traits.map((t, i) => (
                        <div
                          key={i}
                          className="p-2.5 rounded bg-[#18181e] border border-[#2b2930]"
                        >
                          <div className="font-semibold text-white">
                            Trait: {t.name}{' '}
                            <span className="text-[#e5c172] font-normal">
                              ({t.actionType})
                            </span>
                          </div>
                          <p className="text-[#9e9a91] mt-0.5">
                            {t.description}
                          </p>
                        </div>
                      ))}

                      {realm.combatEffects.map((ce, i) => (
                        <div
                          key={i}
                          className="p-2.5 rounded bg-[#18181e] border border-[#2b2930]"
                        >
                          <div className="font-semibold text-white">
                            Combat Effect (ON/OFF): {ce.name}{' '}
                            <span className="text-[#f87171]">
                              ({ce.modDisplay})
                            </span>
                          </div>
                          <p className="text-[#9e9a91] mt-0.5">
                            {ce.description}
                          </p>
                        </div>
                      ))}

                      {realm.unlockedSpells.map((sp, i) => (
                        <div
                          key={i}
                          className="p-2.5 rounded bg-[#1e1719] border border-[#5c2525]"
                        >
                          <div className="font-semibold text-[#f87171]">
                            Magia Exclusiva Desbloqueada: {sp.name} (Nível{' '}
                            {sp.level})
                          </div>
                          <p className="text-[#d4d0c8] mt-0.5">
                            {sp.description}
                          </p>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* SPECIES TAB */}
      {activeTab === 'species' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {COMPENDIUM_SPECIES.map((sp) => {
            const isCurrent = sheet.speciesId === sp.id;
            return (
              <div
                key={sp.id}
                className={`rounded-lg border p-5 bg-[#141418] space-y-4 ${
                  isCurrent ? 'border-[#c8a357]' : 'border-[#33302c]'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-display font-bold text-lg text-[#f0cd7e]">
                      {sp.name}
                    </h3>
                    <p className="text-xs text-[#c7bfa8] mt-0.5">
                      {sp.tagline}
                    </p>
                  </div>

                  {isCurrent ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-[#1b2e1e] border border-[#22c55e]/50 text-[#4ade80] text-xs font-semibold">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Ativa na Ficha</span>
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleApplyOrigin({ speciesId: sp.id })}
                      className="px-3 py-1.5 rounded bg-[#8a6f3b] hover:bg-[#a38447] text-white text-xs font-semibold cursor-pointer"
                    >
                      Escolher Espécie
                    </button>
                  )}
                </div>

                <div className="p-3 rounded bg-[#101014] border border-[#252429] text-xs text-[#d4d0c8] leading-relaxed">
                  {sp.lore}
                </div>

                <div className="space-y-2 text-xs">
                  <div className="font-semibold text-[#d8b467] uppercase tracking-wider text-[11px]">
                    Modificadores & Características Automáticas:
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <span className="px-2.5 py-1 rounded bg-[#18181e] border border-[#2c2a27] text-white">
                      Speed: {sp.speedFt} ft
                    </span>
                    <span className="px-2.5 py-1 rounded bg-[#18181e] border border-[#2c2a27] text-white">
                      Darkvision: {sp.darkvisionFt} ft
                    </span>
                    {sp.modifiers.map((m) => (
                      <span
                        key={m.id}
                        className="px-2.5 py-1 rounded bg-[#2a2315] border border-[#c8a357] text-[#f5d98e] font-semibold"
                      >
                        {m.label}
                      </span>
                    ))}
                  </div>
                  {sp.traits.map((t, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded bg-[#18181e] border border-[#2b2930]"
                    >
                      <div className="font-semibold text-white">{t.name}</div>
                      <p className="text-[#9e9a91] mt-0.5">{t.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CLASSES TAB */}
      {activeTab === 'classes' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {COMPENDIUM_CLASSES.map((cls) => {
            const isCurrent = sheet.classId === cls.id;
            return (
              <div
                key={cls.id}
                className={`rounded-lg border p-5 bg-[#141418] space-y-4 ${
                  isCurrent ? 'border-[#c8a357]' : 'border-[#33302c]'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-display font-bold text-lg text-[#f0cd7e]">
                      {cls.name}
                    </h3>
                    <p className="text-xs text-[#c7bfa8] mt-0.5">
                      {cls.tagline}
                    </p>
                  </div>
                  {isCurrent ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-[#1b2e1e] border border-[#22c55e]/50 text-[#4ade80] text-xs font-semibold">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Ativa na Ficha</span>
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleApplyOrigin({ classId: cls.id })}
                      className="px-3 py-1.5 rounded bg-[#8a6f3b] hover:bg-[#a38447] text-white text-xs font-semibold cursor-pointer"
                    >
                      Escolher Classe
                    </button>
                  )}
                </div>

                <div className="p-3 rounded bg-[#101014] border border-[#252429] text-xs text-[#d4d0c8] leading-relaxed">
                  {cls.lore}
                </div>

                <div className="space-y-2 text-xs">
                  <div className="font-semibold text-[#d8b467] uppercase tracking-wider text-[11px]">
                    Progressão de Nível:
                  </div>
                  {cls.featuresByLevel.map((fb) => (
                    <div
                      key={fb.level}
                      className="p-2.5 rounded bg-[#18181e] border border-[#2b2930] space-y-1"
                    >
                      <div className="font-bold text-[#e5c172]">
                        Nível {fb.level}
                      </div>
                      {fb.features.map((f, i) => (
                        <div key={i}>
                          <span className="font-semibold text-white">
                            {f.name}:{' '}
                          </span>
                          <span className="text-[#9e9a91]">{f.description}</span>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>

                {/* Talentos do Reino desta classe (reino ativo na ficha) */}
                {(() => {
                  const r = COMPENDIUM_REALMS.find(
                    (x) => x.id === sheet.realmId
                  );
                  if (!r) return null;
                  const arc = r.arquetipos?.find((a) => a.classe === cls.id);
                  if (!arc || !arc.talentos || arc.talentos.length === 0)
                    return null;
                  return (
                    <div className="space-y-2 text-xs">
                      <div
                        className="font-semibold uppercase tracking-wider text-[11px]"
                        style={{ color: r.cor }}
                      >
                        Talentos do Reino — {r.name}
                      </div>
                      {r.passiva && (
                        <div className="p-2.5 rounded bg-[#18181e] border border-[#2b2930]">
                          <span className="px-1.5 py-0.5 rounded bg-[#2a2315] border border-[#c8a357] text-[#f5d98e] text-[10px] font-semibold">
                            Nv 1
                          </span>{' '}
                          <span className="font-semibold text-white">
                            {r.passiva.nome}
                          </span>
                          <p className="text-[#9e9a91] mt-0.5">
                            {r.passiva.desc}
                          </p>
                        </div>
                      )}
                      {arc.talentos.map((t) => {
                        const unlocked = t.nivel <= sheet.level;
                        return (
                          <div
                            key={`${arc.classe}-${t.nivel}`}
                            className={`p-2.5 rounded bg-[#18181e] border ${
                              unlocked
                                ? 'border-[#2b2930]'
                                : 'border-[#26252b] opacity-50'
                            }`}
                          >
                            <span className="inline-flex items-center gap-1.5 flex-wrap">
                              <span className="px-1.5 py-0.5 rounded bg-[#2a2315] border border-[#c8a357] text-[#f5d98e] text-[10px] font-semibold">
                                Nv {t.nivel}
                              </span>
                              <span className="font-semibold text-white">
                                {t.nome}
                              </span>
                              {unlocked ? (
                                <span className="text-[9px] uppercase tracking-wide text-[#4ade80]">
                                  ✓ liberado
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-0.5 text-[9px] uppercase tracking-wide text-[#8c877e]">
                                  <Lock className="w-2.5 h-2.5" /> Nv {t.nivel}
                                </span>
                              )}
                            </span>
                            <p className="text-[#9e9a91] mt-1">{t.desc}</p>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>
            );
          })}
        </div>
      )}

      {/* BACKGROUNDS TAB */}
      {activeTab === 'backgrounds' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {COMPENDIUM_BACKGROUNDS.map((bg) => {
            const isCurrent = sheet.backgroundId === bg.id;
            return (
              <div
                key={bg.id}
                className={`rounded-lg border p-5 bg-[#141418] space-y-3 ${
                  isCurrent ? 'border-[#c8a357]' : 'border-[#33302c]'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-display font-bold text-base text-[#f0cd7e]">
                      {bg.name}
                    </h3>
                    <p className="text-xs text-[#9e9a91]">{bg.tagline}</p>
                  </div>
                  {isCurrent ? (
                    <span className="text-xs text-[#4ade80] font-semibold">
                      Ativo
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleApplyOrigin({ backgroundId: bg.id })}
                      className="px-3 py-1 rounded bg-[#8a6f3b] text-white text-xs font-semibold cursor-pointer"
                    >
                      Aplicar
                    </button>
                  )}
                </div>
                <p className="text-xs text-[#d4d0c8]">{bg.description}</p>
              </div>
            );
          })}
        </div>
      )}

      {/* FEATS TAB — Passivas & Talentos por Reino/Arquétipo */}
      {activeTab === 'feats' && (
        <div className="space-y-4">
          {/* Seletor de Reino */}
          <div className="rounded-lg border border-[#33302c] bg-[#141418] p-4 flex flex-wrap items-center gap-3">
            <Sparkles className="w-5 h-5 text-[#c8a357]" />
            <div className="min-w-0 flex-1">
              <div className="text-sm font-semibold text-[#f0cd7e]">
                Talentos de Reino (Passivas & Arquétipos)
              </div>
              <p className="text-xs text-[#9e9a91] mt-0.5">
                A passiva do reino (Nv 1) vale para todos os arquétipos; os
                talentos de Nv 3/6/9/12/16 dependem do arquétipo escolhido.
              </p>
            </div>
            <select
              value={featRealmId}
              onChange={(e) => {
                setFeatRealmId(e.target.value);
                setPassivaExpanded(false);
              }}
              className="px-3 py-2 rounded border border-[#3a3835] bg-[#101014] text-white text-xs cursor-pointer"
            >
              {COMPENDIUM_REALMS.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.icone || '✦'} {r.name} ({r.group === 'caos' ? 'Caos' : 'Fruto'})
                </option>
              ))}
            </select>
          </div>

          {(() => {
            const realm = COMPENDIUM_REALMS.find((r) => r.id === featRealmId);
            if (!realm) return null;
            const isSheetRealm = sheet.realmId === realm.id;
            return (
              <>
                {/* Passiva do Reino */}
                <div
                  className={`rounded-lg border p-5 bg-[#141418] space-y-3 ${
                    isSheetRealm ? 'border-[#c8a357]' : 'border-[#33302c]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span>{realm.icone || '✦'}</span>
                        <h3 className="font-display font-bold text-base text-[#f0cd7e]">
                          {realm.name}
                          {realm.virtude ? ` — ${realm.virtude}` : ''}
                        </h3>
                      </div>
                      <p className="text-xs text-[#9e9a91] mt-1">
                        {realm.tagline}
                      </p>
                    </div>
                    {isSheetRealm && (
                      <span className="px-2 py-0.5 rounded bg-[#262015] border border-[#c8a357] text-[#f5d98e] text-[10px] font-semibold whitespace-nowrap">
                        Ativo na Ficha
                      </span>
                    )}
                  </div>

                  {realm.passiva && (
                    <div className="p-3 rounded bg-[#101014] border border-[#252429]">
                      <div className="font-semibold text-[#e5c172]">
                        Passiva — {realm.passiva.nome}
                      </div>
                      <p className="text-xs text-[#d4d0c8] mt-1">
                        {realm.passiva.desc}
                      </p>
                      <button
                        type="button"
                        onClick={() => setPassivaExpanded((v) => !v)}
                        className="inline-flex items-center gap-1 mt-2 px-2.5 py-1 rounded border border-[#3a3835] bg-[#18181e] text-[#e5c172] text-[11px] font-semibold cursor-pointer hover:border-[#786137]"
                      >
                        {passivaExpanded ? (
                          <ChevronDown className="w-3.5 h-3.5" />
                        ) : (
                          <ChevronRight className="w-3.5 h-3.5" />
                        )}
                        Saiba mais
                      </button>
                      {passivaExpanded && (
                        <div className="mt-2 space-y-2 text-xs">
                          <p className="text-[#9e9a91]">{realm.lore}</p>
                          {realm.traits.map((t, i) => (
                            <div
                              key={i}
                              className="p-2 rounded bg-[#18181e] border border-[#2b2930]"
                            >
                              <span className="font-semibold text-white">
                                Trait: {t.name}
                              </span>{' '}
                              <span className="text-[#e5c172]">
                                ({t.actionType})
                              </span>
                              <p className="text-[#9e9a91] mt-0.5">
                                {t.description}
                              </p>
                            </div>
                          ))}
                          {realm.combatEffects.map((ce, i) => (
                            <div
                              key={i}
                              className="p-2 rounded bg-[#18181e] border border-[#2b2930]"
                            >
                              <span className="font-semibold text-white">
                                Combat Effect: {ce.name}
                              </span>{' '}
                              <span className="text-[#f87171]">
                                ({ce.modDisplay})
                              </span>
                              <p className="text-[#9e9a91] mt-0.5">
                                {ce.description}
                              </p>
                            </div>
                          ))}
                          {!isSheetRealm && (
                            <button
                              type="button"
                              onClick={() =>
                                handleApplyOrigin({ realmId: realm.id })
                              }
                              className="px-3 py-1.5 rounded bg-[#8a6f3b] hover:bg-[#a38447] text-white text-xs font-semibold cursor-pointer"
                            >
                              Escolher Reino
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Talentos por Arquétipo do Reino */}
                <div className="space-y-3">
                  <div className="text-xs uppercase tracking-wide text-[#8c877e] font-semibold">
                    Talentos de {realm.name} por Arquétipo
                  </div>
                  {(realm.arquetipos ?? []).map((arc) => {
                    const base = COMPENDIUM_ARCHETYPES.find(
                      (a) => a.id === arc.classe
                    );
                    const isSheetArchetype =
                      isSheetRealm &&
                      resolveArchetypeBase(sheet.classId) === arc.classe;
                    const open = openArchetypeTalents[arc.classe] ?? false;
                    const talentos = arc.talentos ?? [];
                    return (
                      <div
                        key={arc.classe}
                        className={`rounded-lg border p-5 bg-[#141418] space-y-3 ${
                          isSheetArchetype
                            ? 'border-[#c8a357]'
                            : 'border-[#33302c]'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span>{arc.icone || base?.icone || '✦'}</span>
                              <h4 className="font-display font-bold text-sm text-[#f0cd7e]">
                                {arc.nome}
                              </h4>
                              <span className="text-[10px] text-[#8c877e] uppercase tracking-wide">
                                {base?.nome ?? arc.classe}
                                {arc.revisao ? ' · em revisão' : ''}
                              </span>
                            </div>
                            <p className="text-xs text-[#9e9a91] mt-0.5">
                              {arc.desc || base?.tagline}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            {isSheetArchetype && (
                              <span className="px-2 py-0.5 rounded bg-[#262015] border border-[#c8a357] text-[#f5d98e] text-[10px] font-semibold">
                                Seu arquétipo
                              </span>
                            )}
                            {isSheetRealm && !isSheetArchetype && (
                              <button
                                type="button"
                                onClick={() =>
                                  handleApplyOrigin({
                                    classId: base?.id ?? arc.classe,
                                  })
                                }
                                className="px-2.5 py-1 rounded bg-[#8a6f3b] hover:bg-[#a38447] text-white text-[11px] font-semibold cursor-pointer"
                              >
                                Usar arquétipo
                              </button>
                            )}
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            setOpenArchetypeTalents((prev) => ({
                              ...prev,
                              [arc.classe]: !(prev[arc.classe] ?? false),
                            }))
                          }
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded border border-[#3a3835] bg-[#18181e] text-[#e5c172] text-[11px] font-semibold cursor-pointer hover:border-[#786137]"
                        >
                          {open ? (
                            <ChevronDown className="w-3.5 h-3.5" />
                          ) : (
                            <ChevronRight className="w-3.5 h-3.5" />
                          )}
                          Talentos
                          {talentos.length > 0 && (
                            <span className="text-[10px] text-[#8c877e]">
                              ({talentos.length})
                            </span>
                          )}
                        </button>

                        {open && (
                          <div className="space-y-2">
                            {talentos.length === 0 ? (
                              <p className="text-xs text-[#8c877e] italic">
                                Tabela de talentos por reino para este arquétipo
                                em revisão.
                              </p>
                            ) : (
                              [...talentos]
                                .sort((a, b) => a.nivel - b.nivel)
                                .map((t) => {
                                  const isOwn =
                                    isSheetRealm && isSheetArchetype;
                                  const unlocked =
                                    isOwn && t.nivel <= sheet.level;
                                  return (
                                    <div
                                      key={`${arc.classe}-${t.nivel}`}
                                      className={`p-2.5 rounded bg-[#101014] border text-xs ${
                                        isOwn && !unlocked
                                          ? 'border-[#26252b] opacity-50'
                                          : 'border-[#252429]'
                                      }`}
                                    >
                                      <span className="inline-flex items-center gap-1.5">
                                        <span className="px-1.5 py-0.5 rounded bg-[#2a2315] border border-[#c8a357] text-[#f5d98e] text-[10px] font-semibold">
                                          Nv {t.nivel}
                                        </span>
                                        <span className="font-semibold text-white">
                                          {t.nome}
                                        </span>
                                        {isOwn &&
                                          (unlocked ? (
                                            <span className="px-1.5 py-0.5 rounded bg-[#1a2b1a] border border-[#4ade80]/40 text-[#4ade80] text-[9px] font-semibold uppercase tracking-wide">
                                              ✓ liberado
                                            </span>
                                          ) : (
                                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-[#18181e] border border-[#3a3835] text-[#8c877e] text-[9px] font-semibold uppercase tracking-wide">
                                              <Lock className="w-2.5 h-2.5" />
                                              Nv {t.nivel}
                                            </span>
                                          ))}
                                      </span>
                                      <p className="text-[#9e9a91] mt-1">
                                        {t.desc}
                                      </p>
                                    </div>
                                  );
                                })
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Feats genéricos — recolhido */}
                <details className="rounded-lg border border-[#33302c] bg-[#141418] p-4">
                  <summary className="cursor-pointer text-xs font-semibold text-[#c8a357]">
                    Feats genéricos (opcional)
                  </summary>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-3">
                    {COMPENDIUM_FEATS.map((feat) => {
                      const hasFeat = sheet.featIds.includes(feat.id);
                      return (
                        <div
                          key={feat.id}
                          className={`rounded-lg border p-4 bg-[#15151b] space-y-2 ${
                            hasFeat ? 'border-[#c8a357]' : 'border-[#2b2930]'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <h5 className="font-display font-bold text-sm text-[#f0cd7e]">
                                {feat.name}
                              </h5>
                              <p className="text-[11px] text-[#9e9a91]">
                                {feat.tagline}
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                const nextIds = hasFeat
                                  ? sheet.featIds.filter(
                                      (id) => id !== feat.id
                                    )
                                  : [...sheet.featIds, feat.id];
                                handleApplyOrigin({ featIds: nextIds });
                              }}
                              className={`px-2.5 py-1 rounded text-[11px] font-semibold cursor-pointer ${
                                hasFeat
                                  ? 'bg-[#7c1d1d] text-white'
                                  : 'bg-[#8a6f3b] text-white'
                              }`}
                            >
                              {hasFeat ? 'Remover' : 'Adicionar'}
                            </button>
                          </div>
                          <p className="text-xs text-[#d4d0c8]">
                            {feat.description}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </details>
              </>
            );
          })()}
        </div>
      )}

      {/* SPELLS TAB (Biblioteca SRD) */}
      {activeTab === 'spells' && (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2 items-center">
            <input
              type="text"
              value={spellQuery}
              onChange={(e) => setSpellQuery(e.target.value)}
              placeholder="Buscar magia... (nomes em EN)"
              className="flex-1 min-w-[220px] px-3 py-2 rounded border border-[#3a3835] bg-[#101014] text-white text-xs focus:border-[#c8a357] focus:outline-none"
            />
            <select
              value={spellLevelFilter}
              onChange={(e) =>
                setSpellLevelFilter(
                  e.target.value === 'all' ? 'all' : parseInt(e.target.value, 10)
                )
              }
              className="px-3 py-2 rounded border border-[#3a3835] bg-[#101014] text-white text-xs cursor-pointer"
            >
              <option value="all">Todos os níveis</option>
              {Array.from({ length: 10 }).map((_, i) => (
                <option key={i} value={i}>
                  {i === 0 ? 'Truques (0º)' : `${i}º Círculo`}
                </option>
              ))}
            </select>
            <select
              value={spellSchoolFilter}
              onChange={(e) => setSpellSchoolFilter(e.target.value)}
              className="px-3 py-2 rounded border border-[#3a3835] bg-[#101014] text-white text-xs cursor-pointer"
            >
              <option value="all">Todas as escolas</option>
              {SPELL_SCHOOLS.map((s) => (
                <option key={s} value={s}>
                  {SPELL_SCHOOL_LABELS_PT[s]} ({s})
                </option>
              ))}
            </select>
          </div>

          <p className="text-xs text-[#9e9a91]">
            {filteredSpells.length} magias encontradas (de {SPELLS_LIBRARY.length}).
            Clique em “Adicionar à Ficha” para copiar uma magia para o grimório do personagem.
            A aprovação do Mestre é exigida apenas para magias fora das afinidades do reino.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {filteredSpells.map((entry) => {
              const id = librarySpellId(entry);
              const inSheet = sheet.spells.some((s) => s.id === id);
              const affinity = affinityLabel(sheet.realmId, entry.school);
              return (
                <div
                  key={id}
                  className="rounded-lg border border-[#2b2930] bg-[#15151b] p-4 space-y-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h4 className="font-display font-bold text-sm text-white leading-tight">
                        {entry.name}
                      </h4>
                      <div className="flex flex-wrap gap-1.5 mt-1">
                        <span className="px-2 py-0.5 rounded bg-[#2a2315] border border-[#c8a357] text-[#f5d98e] text-[10px] font-semibold">
                          {entry.level === 0 ? 'Truque' : `${entry.level}º`}
                        </span>
                        <span className="px-2 py-0.5 rounded bg-[#18181e] border border-[#2c2a27] text-[#c7bfa8] text-[10px]">
                          {entry.school}
                        </span>
                        {affinity.status !== 'none' && (
                          affinity.status === 'affinity' ? (
                            <span
                              title={`Afinidade de ${affinity.label}: ${affinity.primary} + ${affinity.secondary}`}
                              className="px-2 py-0.5 rounded bg-[#2a2315] border border-[#c8a357] text-[10px] font-semibold text-[#f5d98e]"
                            >
                              ✓ Afinidade de {affinity.label}
                            </span>
                          ) : (
                            <span
                              title={`Fora das afinidades de ${affinity.label} (${affinity.primary} + ${affinity.secondary}). Ao adicionar, exige a aprovação explícita do Mestre.`}
                              className="px-2 py-0.5 rounded bg-[#2b1a1a] border border-[#f87171]/50 text-[10px] font-semibold text-[#fca5a5]"
                            >
                              Fora das afinidades de {affinity.label} · aprovação do Mestre
                            </span>
                          )
                        )}
                        <span className="px-2 py-0.5 rounded bg-[#18181e] border border-[#2c2a27] text-[#c7bfa8] text-[10px]">
                          {entry.range}
                        </span>
                        {entry.concentration && (
                          <span className="px-2 py-0.5 rounded bg-[#1d2a1b] border border-[#22c55e]/40 text-[#4ade80] text-[10px]">
                            Concentração
                          </span>
                        )}
                        {entry.ritual && (
                          <span className="px-2 py-0.5 rounded bg-[#20263a] border border-[#60a5fa]/40 text-[#93c5fd] text-[10px]">
                            Ritual
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      type="button"
                      disabled={inSheet}
                      onClick={() => {
                        const item = librarySpellToSpellItem(entry);
                        item.gmApproved =
                          schoolAffinityStatus(entry.school, sheet.realmId) !==
                          'outside';
                        onUpdateSheet((p) =>
                          p.spells.some((s) => s.id === item.id)
                            ? p
                            : { ...p, spells: [...p.spells, item] }
                        );
                      }}
                      className={`inline-flex items-center gap-1 px-3 py-1.5 rounded text-[11px] font-semibold shrink-0 transition-colors cursor-pointer ${
                        inSheet
                          ? 'bg-[#1b2e1e] border border-[#22c55e]/50 text-[#4ade80]'
                          : 'bg-[#8a6f3b] hover:bg-[#a38447] text-white'
                      }`}
                    >
                      {inSheet ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5" /> Na Ficha
                        </>
                      ) : (
                        <>
                          <Plus className="w-3.5 h-3.5" /> Adicionar à Ficha
                        </>
                      )}
                    </button>
                  </div>

                  <p className="text-[11px] text-[#9e9a91] leading-relaxed max-h-20 overflow-y-auto">
                    {entry.description}
                  </p>

                  {entry.stats ? (
                    <p className="text-[10px] text-[#e5c172] font-semibold">
                      {spellDamageBlurb(entry)}
                    </p>
                  ) : (
                    <p className="text-[10px] text-[#f87171]/80">
                      Sem dados de combate estruturados — revisar antes de usar.
                    </p>
                  )}

                  {/* Already-added hint */}
                  {inSheet && (
                    <p className="text-[10px] text-[#4ade80]/80">
                      Já está no grimório deste personagem.
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* EQUIPMENT TAB (biblioteca SRD) */}
      {activeTab === 'equipment' && (
        <div className="space-y-5">
          <div className="rounded-lg border border-[#33302c] bg-[#141418] p-4">
            <div className="flex items-center gap-2">
              <Package className="w-5 h-5 text-[#c8a357]" />
              <h3 className="font-display text-base text-[#e5c172] tracking-wide">
                Equipamentos (SRD)
              </h3>
            </div>
            <p className="text-[11px] text-[#9e9a91] mt-1">
              Armas, armaduras e escudos do conjunto básico. Adicione itens
              direto à ficha de {sheet.name}.
            </p>
          </div>

          <div>
            <h4 className="text-[11px] uppercase tracking-widest text-[#e5c172] mb-2">
              Armas ({LIBRARY_WEAPONS.length})
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {LIBRARY_WEAPONS.map((w) => {
                const owned = sheet.equipment.some(
                  (eq) =>
                    eq.type === 'Weapon' &&
                    eq.weaponType === w.name &&
                    eq.source?.name === 'Biblioteca SRD'
                );
                return (
                  <div
                    key={w.id}
                    className="flex items-center justify-between gap-2 rounded border border-[#33302c] bg-[#101014] px-3 py-2"
                  >
                    <div>
                      <div className="text-xs font-semibold text-white">
                        {w.name}
                      </div>
                      <div className="text-[11px] text-[#9e9a91] mt-0.5">
                        {weaponLibraryBlurb(w)}
                      </div>
                    </div>
                    <button
                      type="button"
                      disabled={owned}
                      onClick={() =>
                        onUpdateSheet((prev) => ({
                          ...prev,
                          equipment: [
                            ...prev.equipment,
                            libraryItemToEquipment(w.id)!,
                          ],
                        }))
                      }
                      className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1.5 rounded border border-[#786137] bg-[#1a1814] text-[#e5c172] text-[11px] font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#241e12] cursor-pointer"
                    >
                      {owned ? (
                        <>
                          <Check className="w-3 h-3" />
                          Na ficha
                        </>
                      ) : (
                        <>Adicionar</>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          <div>
            <h4 className="text-[11px] uppercase tracking-widest text-[#e5c172] mb-2">
              Armaduras ({LIBRARY_ARMOR.length})
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {LIBRARY_ARMOR.map((a) => {
                const owned = sheet.equipment.some(
                  (eq) =>
                    eq.type === 'Armor' &&
                    eq.name === a.name &&
                    eq.source?.name === 'Biblioteca SRD'
                );
                return (
                  <div
                    key={a.id}
                    className="flex items-center justify-between gap-2 rounded border border-[#33302c] bg-[#101014] px-3 py-2"
                  >
                    <div>
                      <div className="text-xs font-semibold text-white">
                        {a.name}
                      </div>
                      <div className="text-[11px] text-[#9e9a91] mt-0.5">
                        {armorLibraryBlurb(a)}
                      </div>
                    </div>
                    <button
                      type="button"
                      disabled={owned}
                      onClick={() =>
                        onUpdateSheet((prev) => ({
                          ...prev,
                          equipment: [
                            ...prev.equipment,
                            libraryItemToEquipment(a.id)!,
                          ],
                        }))
                      }
                      className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1.5 rounded border border-[#786137] bg-[#1a1814] text-[#e5c172] text-[11px] font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#241e12] cursor-pointer"
                    >
                      {owned ? (
                        <>
                          <Check className="w-3 h-3" />
                          Na ficha
                        </>
                      ) : (
                        <>Adicionar</>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          <div>
            <h4 className="text-[11px] uppercase tracking-widest text-[#e5c172] mb-2">
              Escudos
            </h4>
            <div className="flex items-center justify-between gap-2 rounded border border-[#33302c] bg-[#101014] px-3 py-2 max-w-sm">
              <div>
                <div className="text-xs font-semibold text-white">
                  {LIBRARY_SHIELD.name}
                </div>
                <div className="text-[11px] text-[#9e9a91] mt-0.5">
                  +{LIBRARY_SHIELD.ac} CA
                </div>
              </div>
              <button
                type="button"
                disabled={sheet.equipment.some(
                  (eq) =>
                    eq.type === 'Shield' &&
                    eq.name === LIBRARY_SHIELD.name
                )}
                onClick={() =>
                  onUpdateSheet((prev) => ({
                    ...prev,
                    equipment: [
                      ...prev.equipment,
                      libraryItemToEquipment(LIBRARY_SHIELD.id)!,
                    ],
                  }))
                }
                className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1.5 rounded border border-[#786137] bg-[#1a1814] text-[#e5c172] text-[11px] font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#241e12] cursor-pointer"
              >
                Adicionar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
