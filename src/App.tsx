import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Dices,
  Plus,
  Scroll,
  Smartphone,
  Monitor,
  Users,
  X,
} from 'lucide-react';
import {
  INITIAL_ELARA_CHARACTER,
  LEGACY_REALM_MAP,
} from './data/compendium';
import {
  CharacterSheetState,
  RollLogEntry,
  RollMode,
  SheetSectionId,
} from './types/rpg';
import {
  computeAbilities,
  computeSkills,
  computeVitals,
  createD20RollLog,
  evaluateDiceFormula,
} from './utils/calculations';
import { VitalsHeaderCard } from './components/VitalsHeaderCard';
import { SectionSwitcherBar } from './components/SectionSwitcherModal';
import ConditionsSection from './components/ConditionsSection';
import {
  AbilitiesSection,
  SkillsAndToolsSection,
} from './components/AbilitiesAndSkillsSection';
import { CombatSection } from './components/CombatSection';
import { SpellsSection } from './components/SpellsSection';
import { InventorySection } from './components/InventorySection';
import { FeaturesSection } from './components/FeaturesSection';
import {
  AboutSection,
  NotesSection,
  ProficienciesSection,
} from './components/NotesAboutProficienciesSections';
import { CompendiumView } from './components/CompendiumView';
import { OriginAndLevelModal } from './components/OriginAndLevelModal';
import { CombatLogPanel } from './components/CombatLogPanel';
import { RosterView } from './components/RosterView';
import { CharacterCreator } from './components/CharacterCreator';

const ROSTER_KEY = 'aethelgard_rpg_roster_v2';
const ACTIVE_ID_KEY = 'aethelgard_rpg_active_id_v2';
const LEGACY_KEY = 'aethelgard_rpg_character_v2';

function migrateCharacter(char: CharacterSheetState): CharacterSheetState {
  if (!char || char.realmId === undefined) return char;
  const mapped = LEGACY_REALM_MAP[char.realmId];
  return mapped ? { ...char, realmId: mapped } : char;
}

function initialRosterState(): {
  roster: CharacterSheetState[];
  activeId: string | null;
} {
  try {
    const raw = localStorage.getItem(ROSTER_KEY);
    if (raw) {
      const roster = JSON.parse(raw) as CharacterSheetState[];
      if (Array.isArray(roster) && roster.length > 0) {
        const activeId = localStorage.getItem(ACTIVE_ID_KEY);
        return {
          roster: roster.map((c) =>
            c.realmId !== undefined ? migrateCharacter(c) : c
          ),
          activeId:
            activeId && roster.some((c) => c.id === activeId)
              ? activeId
              : roster[0].id,
        };
      }
    }
    const legacy = localStorage.getItem(LEGACY_KEY);
    if (legacy) {
      const char = JSON.parse(legacy) as CharacterSheetState;
      if (char && char.id) {
        const mapped = {
          ...migrateCharacter(char),
          id:
            char.id === 'char-elara-01'
              ? 'char-elara-migrated'
              : char.id,
        };
        return { roster: [mapped], activeId: mapped.id };
      }
    }
  } catch {
    // ignore storage error
  }
  return { roster: [], activeId: null };
}

export default function App() {
  const [initial] = useState(() => initialRosterState());
  const [roster, setRoster] = useState<CharacterSheetState[]>(
    initial.roster
  );
  const [activeId, setActiveId] = useState<string | null>(initial.activeId);
  const [activeView, setActiveView] = useState<
    'sheet' | 'compendium' | 'roster' | 'creator'
  >(() => (initial.activeId ? 'sheet' : 'roster'));
  const [compendiumTarget, setCompendiumTarget] = useState<{
    tab: 'realms' | 'species' | 'classes' | 'backgrounds' | 'feats';
    id?: string;
  }>({ tab: 'realms', id: 'havendor' });

  const [activeSection, setActiveSection] =
    useState<SheetSectionId>('abilities');
  const [rollMode, setRollMode] = useState<RollMode>('normal');
  const [rollLogs, setRollLogs] = useState<RollLogEntry[]>([]);
  const [logModalOpen, setLogModalOpen] = useState(false);
  const [latestToast, setLatestToast] = useState<RollLogEntry | null>(null);
  const [originModalOpen, setOriginModalOpen] = useState(false);
  const [mobileFramePreview, setMobileFramePreview] = useState(false);

  const activeSheet =
    roster.find((c) => c.id === activeId) ?? null;

  useEffect(() => {
    try {
      localStorage.setItem(ROSTER_KEY, JSON.stringify(roster));
      if (activeId) {
        localStorage.setItem(ACTIVE_ID_KEY, activeId);
      } else {
        localStorage.removeItem(ACTIVE_ID_KEY);
      }
      localStorage.removeItem(LEGACY_KEY);
    } catch {
      // ignore quota error
    }
  }, [roster, activeId]);

  useEffect(() => {
    if (!activeSheet && activeView !== 'creator' && activeView !== 'roster') {
      setActiveView('roster');
    }
  }, [activeSheet, activeView]);

  // Auto-dismiss roll toast after 4.5 seconds
  useEffect(() => {
    if (!latestToast) return;
    const timer = setTimeout(() => {
      setLatestToast(null);
    }, 4500);
    return () => clearTimeout(timer);
  }, [latestToast]);

  const computedSheet = activeSheet as CharacterSheetState | undefined;
  const computedAbilities = computedSheet
    ? computeAbilities(computedSheet)
    : null;
  const computedSkills = computedSheet
    ? computeSkills(computedSheet, computedAbilities!)
    : null;
  const computedVitals = computedSheet
    ? computeVitals(computedSheet, computedAbilities!)
    : null;

  const handleUpdateSheet = (
    updater: (prev: CharacterSheetState) => CharacterSheetState
  ) => {
    if (!activeId) return;
    setRoster((prev) =>
      prev.map((c) => (c.id === activeId ? updater(c) : c))
    );
  };

  const pushLogEntry = (entry: RollLogEntry) => {
    setRollLogs((prev) => [entry, ...prev]);
    setLatestToast(entry);
  };

  const handleRollD20 = (title: string, subtitle: string, modifier: number) => {
    const entry = createD20RollLog({
      title,
      subtitle,
      modifier,
      rollMode,
    });
    pushLogEntry(entry);
  };

  const handleRollAttack = (
    attackName: string,
    hitBonus: number,
    damageFormula: string,
    damageType: string
  ) => {
    const entry = createD20RollLog({
      title: attackName,
      subtitle: 'Attack Roll',
      modifier: hitBonus,
      rollMode,
      damageFormula,
      damageType,
    });
    pushLogEntry(entry);
  };

  const handleRollDamageOnly = (
    title: string,
    damageFormula: string,
    damageType: string
  ) => {
    const dmg = evaluateDiceFormula(damageFormula);
    const entry: RollLogEntry = {
      id: `roll-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      }),
      title,
      subtitle: `${damageType} Roll`,
      rollMode: 'normal',
      damageTotal: dmg.total,
      damageBreakdown: dmg.breakdown,
      damageType,
    };
    pushLogEntry(entry);
  };

  const handleCastSpellToLog = (
    spellName: string,
    manaSpent: number,
    heatAdded: number
  ) => {
    const entry: RollLogEntry = {
      id: `cast-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      }),
      title: `Magia: ${spellName}`,
      subtitle:
        manaSpent > 0
          ? `Conjurada (-${manaSpent} Mana · +${heatAdded} Calor)`
          : 'Cantrip Conjurado (0 Mana)',
      rollMode: 'normal',
    };
    pushLogEntry(entry);
  };

  const handleSendFeatureToLog = (
    title: string,
    description: string,
    rollFormula?: string
  ) => {
    let damageTotal: number | undefined;
    let damageBreakdown: string | undefined;
    if (rollFormula) {
      const res = evaluateDiceFormula(rollFormula);
      damageTotal = res.total;
      damageBreakdown = res.breakdown;
      if (
        title.toLowerCase().includes('second wind') &&
        computedVitals && computedSheet
      ) {
        handleUpdateSheet((prev) => ({
          ...prev,
          hpCurrent: Math.min(
            computedVitals.effectiveMaxHP,
            prev.hpCurrent + res.total
          ),
        }));
      }
    }
    const entry: RollLogEntry = {
      id: `feat-log-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      }),
      title,
      subtitle: description,
      rollMode: 'normal',
      damageTotal,
      damageBreakdown,
      damageType: rollFormula ? 'Resultado' : undefined,
    };
    pushLogEntry(entry);
  };

  const handleOpenCompendiumItem = (
    tab: 'species' | 'realms' | 'classes',
    id: string
  ) => {
    setCompendiumTarget({ tab, id });
    setActiveView('compendium');
  };

  const handleOpenCharacter = (id: string) => {
    setActiveId(id);
    setActiveView('sheet');
  };

  const handleCreateCharacter = (sheet: CharacterSheetState) => {
    setRoster((prev) => [...prev, sheet]);
    setActiveId(sheet.id);
    setActiveView('sheet');
  };

  const handleDuplicateCharacter = (id: string) => {
    setRoster((prev) => {
      const src = prev.find((c) => c.id === id);
      if (!src) return prev;
      const copy: CharacterSheetState = {
        ...JSON.parse(JSON.stringify(src)),
        id: `char-copy-${Date.now()}`,
        name: `${src.name || 'FICHA'} (cópia)`,
      };
      setActiveId(copy.id);
      return [...prev, copy];
    });
    setActiveView('sheet');
  };

  const handleDeleteCharacter = (id: string) => {
    setRoster((prev) => {
      const next = prev.filter((c) => c.id !== id);
      if (activeId === id) {
        setActiveId(next[0]?.id ?? null);
        setActiveView(next.length > 0 ? 'roster' : 'roster');
      }
      return next;
    });
  };

  const handleExportCharacter = (ch: CharacterSheetState) => {
    const blob = new Blob([JSON.stringify(ch, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `aethelgard-ficha-${ch.name
      .replace(/[^a-zA-Z0-9_-]+/g, '-')
      .toLowerCase() || 'personagem'}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportCharacters = (chars: CharacterSheetState[]) => {
    setRoster((prev) => {
      const existingIds = new Set(prev.map((c) => c.id));
      const added: CharacterSheetState[] = [];
      for (const ch of chars) {
        let id = ch.id;
        let i = 1;
        while (existingIds.has(id) || added.some((a) => a.id === id)) {
          id = `${ch.id}-import-${i++}`;
        }
        existingIds.add(id);
        added.push({ ...ch, id });
      }
      return [...prev, ...added];
    });
  };

  const handleAddElara = () => {
    const elara: CharacterSheetState = {
      ...INITIAL_ELARA_CHARACTER,
      id: `char-elara-${Date.now()}`,
      realmId: LEGACY_REALM_MAP[INITIAL_ELARA_CHARACTER.realmId] || INITIAL_ELARA_CHARACTER.realmId,
    };
    setRoster((prev) => [...prev, elara]);
    setActiveId(elara.id);
    setActiveView('sheet');
  };

  const renderActiveSection = () => {
    if (!computedSheet || !computedAbilities || !computedVitals || !computedSkills) {
      return null;
    }
    switch (activeSection) {
      case 'abilities':
        return (
          <AbilitiesSection
            sheet={computedSheet}
            abilities={computedAbilities}
            onUpdateSheet={handleUpdateSheet}
            onRollD20={handleRollD20}
            onOpenCompendiumItem={handleOpenCompendiumItem}
          />
        );
      case 'skills':
        return (
          <SkillsAndToolsSection
            sheet={computedSheet}
            skills={computedSkills}
            onUpdateSheet={handleUpdateSheet}
            onRollD20={handleRollD20}
          />
        );
      case 'combat':
        return (
          <CombatSection
            sheet={computedSheet}
            abilities={computedAbilities}
            onUpdateSheet={handleUpdateSheet}
            onRollAttack={handleRollAttack}
            onRollDamageOnly={handleRollDamageOnly}
          />
        );
      case 'spells':
        return (
          <SpellsSection
            sheet={computedSheet}
            abilities={computedAbilities}
            onUpdateSheet={handleUpdateSheet}
            onRollAttack={handleRollAttack}
            onRollDamageOnly={handleRollDamageOnly}
            onCastSpellToLog={handleCastSpellToLog}
          />
        );
      case 'inventory':
        return (
          <InventorySection
            sheet={computedSheet}
            abilities={computedAbilities}
            onUpdateSheet={handleUpdateSheet}
          />
        );
      case 'features':
        return (
          <FeaturesSection
            sheet={computedSheet}
            onUpdateSheet={handleUpdateSheet}
            onSendFeatureToLog={handleSendFeatureToLog}
            onOpenCompendiumItem={handleOpenCompendiumItem}
          />
        );
      case 'notes':
        return (
          <NotesSection sheet={computedSheet} onUpdateSheet={handleUpdateSheet} />
        );
      case 'about':
        return (
          <AboutSection sheet={computedSheet} onUpdateSheet={handleUpdateSheet} />
        );
      case 'proficiencies':
        return (
          <ProficienciesSection
            sheet={computedSheet}
            onUpdateSheet={handleUpdateSheet}
          />
        );
      case 'conditions':
        return (
          <ConditionsSection
            sheet={computedSheet}
            onUpdateSheet={handleUpdateSheet}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-[#08080b] text-[#e6e4e0] flex flex-col">
      {/* Top Bar following the 3-Zone Contract */}
      <header className="sticky top-0 z-30 flex items-center justify-between px-3 sm:px-6 py-3 border-b border-[#252320] bg-[#0e0e12]/95 backdrop-blur-md">
        {/* Zone 1: Single text element wordmark */}
        <a
          href="#sheet"
          onClick={(e) => {
            e.preventDefault();
            setActiveView(activeSheet ? 'sheet' : 'roster');
          }}
          className="font-display font-bold text-sm sm:text-lg tracking-wider text-[#e5c172] whitespace-nowrap cursor-pointer"
        >
          Aethelgard RPG
        </a>

        {/* Zone 2: Clean navigation links (Fichas & Reinos/Compêndio) */}
        <nav className="hidden md:flex items-center gap-6 text-xs font-medium text-[#a39e93]">
          <button
            type="button"
            onClick={() => setActiveView('roster')}
            className={`hover:text-white transition-colors whitespace-nowrap cursor-pointer ${
              activeView === 'roster' || activeView === 'creator'
                ? 'text-[#f0cd7e] underline underline-offset-4'
                : ''
            }`}
          >
            Fichas
          </button>
          <button
            type="button"
            onClick={() => {
              if (!activeSheet) return;
              setCompendiumTarget({
                tab: 'realms',
                id: activeSheet.realmId || 'havendor',
              });
              setActiveView('compendium');
            }}
            disabled={!activeSheet}
            className={`transition-colors whitespace-nowrap cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
              activeView === 'compendium'
                ? 'text-[#f0cd7e] underline underline-offset-4'
                : 'hover:text-white'
            }`}
          >
            Reinos & Compêndio
          </button>
          {activeSheet && (
            <button
              type="button"
              onClick={() => setActiveView('sheet')}
              className={`transition-colors whitespace-nowrap cursor-pointer ${
                activeView === 'sheet'
                  ? 'text-[#f0cd7e] underline underline-offset-4'
                  : 'hover:text-white'
              }`}
            >
              Ficha: {activeSheet.name}
            </button>
          )}
        </nav>

        {/* Zone 3: Primary Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            type="button"
            onClick={() => setMobileFramePreview((p) => !p)}
            title="Alternar entre visualização Compacta e Expandida"
            className="hidden lg:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded border border-[#32302c] bg-[#16161b] hover:border-[#6e5931] text-xs text-[#b8b4ac] hover:text-white whitespace-nowrap cursor-pointer"
          >
            {mobileFramePreview ? (
              <>
                <Monitor className="w-3.5 h-3.5 text-[#c8a357]" />
                <span>Desktop</span>
              </>
            ) : (
              <>
                <Smartphone className="w-3.5 h-3.5 text-[#c8a357]" />
                <span>Mobile</span>
              </>
            )}
          </button>

          {/* Log Modal Window Button */}
          <button
            type="button"
            onClick={() => setLogModalOpen(true)}
            className={`hidden md:inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded border text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer ${
              logModalOpen || rollLogs.length > 0
                ? 'border-[#c8a357] bg-[#241e12] text-[#f5d98e]'
                : 'border-[#3a3835] bg-[#16161b] text-[#d4d0c8] hover:border-[#786137]'
            }`}
          >
            <Dices className="w-3.5 h-3.5 text-[#c8a357]" />
            <span>Log ({rollLogs.length})</span>
          </button>

          <button
            type="button"
            onClick={() => handleAddElara}
            title="Adicionar a ficha padrão da Elara ao roster"
            className="p-1.5 rounded border border-[#2c2a27] bg-[#16161b] text-[#8c877e] hover:text-[#e5c172] cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#0e0e12]/98 border-t border-[#252320] backdrop-blur-md pb-safe">
        <div className="grid grid-cols-4 gap-1 px-2 py-1.5">
          <button
            type="button"
            onClick={() => setActiveView('roster')}
            className={`flex flex-col items-center justify-center gap-0.5 py-2 px-1 rounded-md text-xs font-medium transition-colors ${
              activeView === 'roster' || activeView === 'creator'
                ? 'text-[#f0cd7e] bg-[#1a1814]'
                : 'text-[#b8b4ac] hover:text-white'
            }`}
          >
            <Users className="w-5 h-5" />
            <span>Fichas</span>
          </button>

          <button
            type="button"
            onClick={() => {
              if (!activeSheet) return;
              setActiveView('sheet');
            }}
            disabled={!activeSheet}
            className={`flex flex-col items-center justify-center gap-0.5 py-2 px-1 rounded-md text-xs font-medium transition-colors disabled:opacity-40 ${
              activeView === 'sheet' && activeSheet ? 'text-[#f0cd7e] bg-[#1a1814]' : 'text-[#b8b4ac] hover:text-white'
            }`}
          >
            <Scroll className="w-5 h-5" />
            <span>Ficha</span>
          </button>

          <button
            type="button"
            onClick={() => {
              if (!activeSheet) return;
              setCompendiumTarget({ tab: 'realms', id: activeSheet.realmId || 'havendor' });
              setActiveView('compendium');
            }}
            disabled={!activeSheet}
            className={`flex flex-col items-center justify-center gap-0.5 py-2 px-1 rounded-md text-xs font-medium transition-colors disabled:opacity-40 ${
              activeView === 'compendium' ? 'text-[#f0cd7e] bg-[#1a1814]' : 'text-[#b8b4ac] hover:text-white'
            }`}
          >
            <BookOpen className="w-5 h-5" />
            <span>Reinos</span>
          </button>

          <button
            type="button"
            onClick={() => setLogModalOpen(true)}
            className={`flex flex-col items-center justify-center gap-0.5 py-2 px-1 rounded-md text-xs font-medium transition-colors ${
              logModalOpen || rollLogs.length > 0 ? 'text-[#f5d98e] bg-[#241e12]' : 'text-[#b8b4ac] hover:text-white'
            }`}
          >
            <Dices className="w-5 h-5 text-[#c8a357]" />
            <span>Log ({rollLogs.length})</span>
          </button>
        </div>
      </nav>

      {/* Main Content Container */}
      <main className="flex-1 w-full max-w-[1100px] mx-auto px-2.5 sm:px-6 py-4 sm:py-5 md:pb-4 pb-20">
        {activeView === 'creator' ? (
          <CharacterCreator
            onCreate={handleCreateCharacter}
            onCancel={() => setActiveView('roster')}
          />
        ) : activeView === 'roster' ? (
          <RosterView
            roster={roster}
            activeId={activeId}
            onOpen={handleOpenCharacter}
            onNew={() => setActiveView('creator')}
            onDuplicate={handleDuplicateCharacter}
            onDelete={handleDeleteCharacter}
            onExport={handleExportCharacter}
            onImport={handleImportCharacters}
            onCancel={() =>
              activeSheet ? setActiveView('sheet') : setActiveView('roster')
            }
          />
        ) : activeView === 'compendium' && activeSheet ? (
          <CompendiumView
            sheet={activeSheet}
            initialTab={compendiumTarget.tab}
            initialSelectedId={compendiumTarget.id}
            onUpdateSheet={handleUpdateSheet}
            onBackToSheet={() => setActiveView('sheet')}
          />
        ) : activeSheet &&
          computedSheet &&
          computedAbilities &&
          computedSkills &&
          computedVitals ? (
          <div
            className={
              mobileFramePreview
                ? 'max-w-[440px] mx-auto space-y-4'
                : 'max-w-2xl mx-auto space-y-4'
            }
          >
            <VitalsHeaderCard
              sheet={computedSheet}
              abilities={computedAbilities}
              skills={computedSkills}
              vitals={computedVitals}
              rollMode={rollMode}
              onChangeRollMode={setRollMode}
              onUpdateSheet={handleUpdateSheet}
              onRollD20={handleRollD20}
              onOpenOriginBuilder={() => setOriginModalOpen(true)}
              onOpenCompendiumItem={handleOpenCompendiumItem}
            />

            <SectionSwitcherBar
              activeSection={activeSection}
              onSelectSection={setActiveSection}
            />

            {renderActiveSection()}
          </div>
        ) : (
          <RosterView
            roster={roster}
            activeId={activeId}
            onOpen={handleOpenCharacter}
            onNew={() => setActiveView('creator')}
            onDuplicate={handleDuplicateCharacter}
            onDelete={handleDeleteCharacter}
            onExport={handleExportCharacter}
            onImport={handleImportCharacters}
            onCancel={() => {}}
          />
        )}
      </main>

      {/* Compact Floating Roll Notification Toast on Bottom */}
      {latestToast && !logModalOpen && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 w-[92%] max-w-md rounded-xl border border-[#c8a357] bg-[#121217]/95 backdrop-blur-md p-3 shadow-[0_10px_35px_rgba(0,0,0,0.85)] flex items-center justify-between gap-3">
          <div
            onClick={() => setLogModalOpen(true)}
            className="flex-1 cursor-pointer"
          >
            <div className="flex items-center gap-2 text-xs">
              <Dices className="w-4 h-4 text-[#c8a357] shrink-0" />
              <span className="font-bold text-white truncate">
                {latestToast.title}
              </span>
              {latestToast.total !== undefined && (
                <span className="px-2 py-0.5 rounded bg-[#25221b] border border-[#786137] font-mono-num font-bold text-sm text-[#f5d98e]">
                  {latestToast.total}
                </span>
              )}
              {latestToast.damageTotal !== undefined && (
                <span className="px-2 py-0.5 rounded bg-[#2d1618] border border-[#991b1b] font-mono-num font-bold text-sm text-[#f87171]">
                  Dano: {latestToast.damageTotal}
                </span>
              )}
            </div>
            <div className="text-[11px] text-[#a39e93] mt-0.5 truncate">
              {latestToast.breakdown || latestToast.subtitle} ·{' '}
              <span className="text-[#e5c172] underline">Ver janela de Log</span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setLatestToast(null)}
            className="p-1 text-[#8c877e] hover:text-white cursor-pointer"
            aria-label="Fechar notificação de rolagem"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Floating Combat & Roll Log Modal Window */}
      <CombatLogPanel
        open={logModalOpen}
        logs={rollLogs}
        onClearLogs={() => setRollLogs([])}
        onClose={() => setLogModalOpen(false)}
      />

      {/* Unified Character Creation / Origin & Level Up Modal */}
      {activeSheet && (
        <OriginAndLevelModal
          open={originModalOpen}
          sheet={activeSheet}
          onClose={() => setOriginModalOpen(false)}
          onUpdateSheet={handleUpdateSheet}
        />
      )}
    </div>
  );
}