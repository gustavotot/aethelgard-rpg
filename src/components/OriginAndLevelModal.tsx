import React from 'react';
import { Sparkles, X, ArrowUpCircle } from 'lucide-react';
import {
  COMPENDIUM_BACKGROUNDS,
  COMPENDIUM_CLASSES,
  COMPENDIUM_FEATS,
  COMPENDIUM_REALMS,
  COMPENDIUM_SPECIES,
} from '../data/compendium';
import { CharacterSheetState, CompendiumClass } from '../types/rpg';
import { getArchetypeById, resolveArchetypeBase } from '../data/archetypes';
import {
  computeAbilities,
  formatSigned,
  getProficiencyBonus,
  synchronizeOrigins,
} from '../utils/calculations';

interface OriginAndLevelModalProps {
  open: boolean;
  sheet: CharacterSheetState;
  onClose: () => void;
  onUpdateSheet: (updater: (prev: CharacterSheetState) => CharacterSheetState) => void;
}

export const OriginAndLevelModal: React.FC<OriginAndLevelModalProps> = ({
  open,
  sheet,
  onClose,
  onUpdateSheet,
}) => {
  if (!open) return null;

  const selectedSpecies = COMPENDIUM_SPECIES.find(
    (s) => s.id === sheet.speciesId
  );
  const selectedRealm = COMPENDIUM_REALMS.find((r) => r.id === sheet.realmId);
  const selectedClass = COMPENDIUM_CLASSES.find((c) => c.id === sheet.classId);
  const profBonus = getProficiencyBonus(sheet.level);
  const abilities = computeAbilities(sheet);
  const heatLimit = (lvl: number): number => {
    const archetype = getArchetypeById(resolveArchetypeBase(sheet.classId));
    const multiplier = archetype?.calorMultiplier ?? 3;
    const primaryMods = (archetype?.primaryAbilities || ['STR', 'CON']).map(
      (k) => abilities[k]?.modifier ?? 0
    );
    return multiplier * Math.max(...primaryMods, 0) + lvl;
  };
  const manaFor = (
    cls: CompendiumClass | undefined,
    lvl: number
  ): number | null => {
    const base = cls?.manaBase ?? 0;
    if (base <= 0) return null;
    return Math.max(1, lvl + abilities.INT.modifier) * base;
  };

  const handleSyncChange = (
    updates: Parameters<typeof synchronizeOrigins>[1]
  ) => {
    onUpdateSheet((prev) => synchronizeOrigins(prev, updates));
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl rounded-xl border border-[#786137] bg-[#141418] p-5 shadow-2xl space-y-5 my-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#2c2a27]">
          <div className="flex items-center gap-2 text-[#f0cd7e] font-display font-bold text-base uppercase tracking-wider">
            <Sparkles className="w-5 h-5 text-[#c8a357]" />
            <span>Origens, Criação & Evolução (Level Up)</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded border border-[#7c2d2d] bg-[#2a1414] text-[#f87171] hover:bg-[#3f1d1d] cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-[#9e9a91]">
          Altere a Espécie, Reino (Realm), Classe ou Nível a qualquer momento. A ficha recebe automaticamente os modificadores, Traits, magias exclusivas e proficiências da origem escolhida, preservando suas customizações manuais.
        </p>

        {/* Row 1: Character Name & Level Up Control */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block text-[#9e9a91] uppercase text-[10px] mb-1">
              Nome do Personagem
            </label>
            <input
              type="text"
              value={sheet.name}
              onChange={(e) =>
                onUpdateSheet((p) => ({ ...p, name: e.target.value }))
              }
              className="w-full px-3 py-2 rounded border border-[#3a3835] bg-[#101014] text-white font-display font-bold uppercase focus:border-[#c8a357] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[#9e9a91] uppercase text-[10px] mb-1">
              Nível do Personagem (Proficiency Bonus: {formatSigned(profBonus)})
            </label>
            <div className="flex items-center gap-2">
              <select
                value={sheet.level}
                onChange={(e) => {
                  const newLvl = parseInt(e.target.value, 10) || 1;
                  handleSyncChange({ level: newLvl });
                  onUpdateSheet((p) => ({
                    ...p,
                    heatMax: Math.max(p.heatMax, heatLimit(p.level)),
                  }));
                }}
                className="flex-1 px-3 py-2 rounded border border-[#3a3835] bg-[#101014] text-white font-mono-num font-bold focus:border-[#c8a357] focus:outline-none cursor-pointer"
              >
                {Array.from({ length: 20 }).map((_, idx) => {
                  const lvl = idx + 1;
                  return (
                    <option key={lvl} value={lvl} className="bg-[#16161b]">
                      Nível {lvl} (Prof. {formatSigned(getProficiencyBonus(lvl))} · Calor Máx: {heatLimit(lvl)} · Mana: {manaFor(selectedClass, lvl) ?? '—'})
                    </option>
                  );
                })}
              </select>

              <button
                type="button"
                onClick={() => {
                  const nextLvl = Math.min(20, sheet.level + 1);
                  handleSyncChange({ level: nextLvl });
                  onUpdateSheet((p) => {
                    const manaLvlMax = manaFor(selectedClass, nextLvl);
                    const manaLvl =
                      manaLvlMax !== null
                        ? Math.min(
                            manaLvlMax,
                            p.manaCurrent + Math.max(0, manaLvlMax - p.manaMax)
                          )
                        : p.manaCurrent;
                    return {
                      ...p,
                      hpMaxBase: p.hpMaxBase + 7,
                      hpCurrent: p.hpCurrent + 7,
                      manaMax: manaLvlMax ?? p.manaMax,
                      manaCurrent: manaLvl,
                      heatMax: heatLimit(nextLvl),
                    };
                  });
                }}
                disabled={sheet.level >= 20}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded bg-[#9e2525] hover:bg-[#b92b2b] disabled:opacity-40 text-white font-bold cursor-pointer"
              >
                <ArrowUpCircle className="w-4 h-4" />
                <span>Level Up</span>
              </button>
            </div>
          </div>
        </div>

        {/* Row 2: Species & Realm */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block text-[#9e9a91] uppercase text-[10px] mb-1">
              Species (Espécie)
            </label>
            <select
              value={sheet.speciesId}
              onChange={(e) => handleSyncChange({ speciesId: e.target.value })}
              className="w-full px-3 py-2 rounded border border-[#3a3835] bg-[#101014] text-white font-semibold focus:border-[#c8a357] focus:outline-none cursor-pointer"
            >
              {COMPENDIUM_SPECIES.map((sp) => (
                <option key={sp.id} value={sp.id} className="bg-[#16161b]">
                  {sp.name} — {sp.modifiers.map((m) => m.label).join(', ')}
                </option>
              ))}
            </select>
            {selectedSpecies && (
              <p className="text-[11px] text-[#c7bfa8] mt-1">
                Concede: {selectedSpecies.traits.map((t) => t.name).join(', ')}
              </p>
            )}
          </div>

          <div>
            <label className="block text-[#9e9a91] uppercase text-[10px] mb-1">
              Realm (Reino de Origem)
            </label>
            <select
              value={sheet.realmId}
              onChange={(e) => handleSyncChange({ realmId: e.target.value })}
              className="w-full px-3 py-2 rounded border border-[#3a3835] bg-[#101014] text-[#f0cd7e] font-semibold focus:border-[#c8a357] focus:outline-none cursor-pointer"
            >
              {COMPENDIUM_REALMS.map((rm) => (
                <option key={rm.id} value={rm.id} className="bg-[#16161b]">
                  {rm.name} ({rm.elementAffinity})
                </option>
              ))}
            </select>
            {selectedRealm && (
              <p className="text-[11px] text-[#c7bfa8] mt-1">
                Concede: {selectedRealm.traits.map((t) => t.name).join(', ')}
                {selectedRealm.unlockedSpells.length > 0 &&
                  ` + Magia: ${selectedRealm.unlockedSpells
                    .map((s) => s.name)
                    .join(', ')}`}
              </p>
            )}
          </div>
        </div>

        {/* Row 3: Class & Background */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block text-[#9e9a91] uppercase text-[10px] mb-1">
              Class (Classe)
            </label>
            <select
              value={sheet.classId}
              onChange={(e) => {
                const cid = e.target.value;
                const cls = COMPENDIUM_CLASSES.find((c) => c.id === cid);
                handleSyncChange({ classId: cid });
                const target = manaFor(cls, sheet.level);
                if (target !== null) {
                  onUpdateSheet((p) => ({
                    ...p,
                    manaMax: target,
                    heatMax: heatLimit(p.level),
                  }));
                }
              }}
              className="w-full px-3 py-2 rounded border border-[#3a3835] bg-[#101014] text-white font-semibold focus:border-[#c8a357] focus:outline-none cursor-pointer"
            >
              {COMPENDIUM_CLASSES.map((cls) => (
                <option key={cls.id} value={cls.id} className="bg-[#16161b]">
                  {cls.name} (d{cls.hitDie})
                </option>
              ))}
            </select>
            {selectedClass && (
              <p className="text-[11px] text-[#c7bfa8] mt-1">
                Perícias da Classe:{' '}
                {selectedClass.skillGrants
                  .map((g) => `${g.skillId} (${g.level})`)
                  .join(', ')}
              </p>
            )}
          </div>

          <div>
            <label className="block text-[#9e9a91] uppercase text-[10px] mb-1">
              Background Principal
            </label>
            <select
              value={sheet.backgroundId}
              onChange={(e) =>
                handleSyncChange({ backgroundId: e.target.value })
              }
              className="w-full px-3 py-2 rounded border border-[#3a3835] bg-[#101014] text-white font-semibold focus:border-[#c8a357] focus:outline-none cursor-pointer"
            >
              {COMPENDIUM_BACKGROUNDS.map((bg) => (
                <option key={bg.id} value={bg.id} className="bg-[#16161b]">
                  {bg.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Row 4: Feats Multi-Select */}
        <div className="text-xs">
          <label className="block text-[#9e9a91] uppercase text-[10px] mb-1.5">
            Feats (Talentos Desbloqueados)
          </label>
          <div className="flex flex-wrap gap-2">
            {COMPENDIUM_FEATS.map((feat) => {
              const active = sheet.featIds.includes(feat.id);
              return (
                <button
                  key={feat.id}
                  type="button"
                  onClick={() => {
                    const next = active
                      ? sheet.featIds.filter((id) => id !== feat.id)
                      : [...sheet.featIds, feat.id];
                    handleSyncChange({ featIds: next });
                  }}
                  className={`px-3 py-1.5 rounded border text-xs font-medium transition-colors cursor-pointer ${
                    active
                      ? 'border-[#c8a357] bg-[#2a2315] text-[#f5d98e]'
                      : 'border-[#33312e] bg-[#101014] text-[#9e9a91] hover:text-white'
                  }`}
                >
                  {active ? '✓ ' : '+ '}
                  {feat.name}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex justify-end pt-3 border-t border-[#2c2a27]">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded bg-[#c8a357] hover:bg-[#d8b467] text-[#0e0e12] font-bold text-xs uppercase tracking-wider cursor-pointer"
          >
            Concluir & Voltar para a Ficha
          </button>
        </div>
      </div>
    </div>
  );
};
