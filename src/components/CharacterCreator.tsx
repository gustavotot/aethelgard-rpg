import { useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, Check, Crown, Dices, ExternalLink, Shield } from 'lucide-react';
import { COMPENDIUM_CLASSES, COMPENDIUM_REALMS, COMPENDIUM_SPECIES } from '../data/compendium';
import { COMPENDIUM_ARCHETYPES } from '../data/archetypes';
import {
  LIBRARY_ARMOR,
  LIBRARY_SHIELD,
  LIBRARY_WEAPONS,
  armorLibraryBlurb,
  weaponLibraryBlurb,
} from '../data/equipmentLibrary';
import { REALM_AFFINITIES, SPELL_SCHOOL_LABELS_PT } from '../data/affinities';
import { ABILITY_KEYS, ABILITY_LABELS } from '../data/constants';
import { AbilityKey, CharacterSheetState } from '../types/rpg';
import { computeAbilities, computeVitals } from '../utils/calculations';
import {
  ABILITY_PRESETS,
  buildCharacterSheet,
  libraryItemToEquipment,
  recommendedEquipmentForClass,
} from '../utils/characterFactory';
import { randomCharacterName } from '../data/names';

const STEPS = [
  { id: 'name', label: 'Nome' },
  { id: 'realm', label: 'Reino' },
  { id: 'class', label: 'Arquétipo' },
  { id: 'species', label: 'Raça' },
  { id: 'abilities', label: 'Atributos' },
  { id: 'equipment', label: 'Equipamento' },
  { id: 'summary', label: 'Resumo & Criar' },
];

const DEFAULT_SCORES: Record<AbilityKey, number> = {
  STR: 8,
  DEX: 13,
  CON: 12,
  INT: 14,
  WIS: 10,
  CHA: 15,
};

interface CharacterCreatorProps {
  onCreate: (sheet: CharacterSheetState) => void;
  onCancel: () => void;
}

export function CharacterCreator({
  onCreate,
  onCancel,
}: CharacterCreatorProps) {
  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [realmId, setRealmId] = useState<string>('');
  const [classId, setClassId] = useState<string>('');
  const [speciesId, setSpeciesId] = useState<string>('');
  const [presetId, setPresetId] = useState(ABILITY_PRESETS[0].id);
  const [manual, setManual] = useState<Record<AbilityKey, number>>({ ...DEFAULT_SCORES });
  const [manualMode, setManualMode] = useState(false);
  const [equipmentIds, setEquipmentIds] = useState<string[]>([]);

  const scores = useMemo<Record<AbilityKey, number>>(() => {
    if (!manualMode) {
      const preset = ABILITY_PRESETS.find((p) => p.id === presetId) || ABILITY_PRESETS[0];
      return { ...preset.scores };
    }
    return manual;
  }, [manualMode, presetId, manual]);

  const manualSum = useMemo(
    () => ABILITY_KEYS.reduce((a, k) => a + (manual[k] || 0), 0),
    [manual]
  );
  const remaining = 72 - manualSum;

  const realm = COMPENDIUM_REALMS.find((r) => r.id === realmId);
  const cls = COMPENDIUM_CLASSES.find((c) => c.id === classId);
  const species = COMPENDIUM_SPECIES.find((s) => s.id === speciesId);
  const affinity = REALM_AFFINITIES.find((a) => a.id === realmId);

  const originAbilityBonus = (k: AbilityKey): { name: string; value: number }[] => {
    const mods: { name: string; value: number }[] = [];
    for (const m of species?.modifiers ?? []) {
      if (m.target === 'AbilityScore' && m.subTarget === k) {
        mods.push({ name: species!.name, value: m.value });
      }
    }
    for (const m of realm?.modifiers ?? []) {
      if (m.target === 'AbilityScore' && m.subTarget === k) {
        mods.push({ name: realm!.name, value: m.value });
      }
    }
    return mods;
  };

  const abilityTotal = (k: AbilityKey): number =>
    (scores[k] ?? 8) + originAbilityBonus(k).reduce((a, m) => a + m.value, 0);

  const abilityModValue = (k: AbilityKey): number =>
    Math.floor((abilityTotal(k) - 10) / 2);

  const equipmentWeightById = (id: string): number =>
    libraryItemToEquipment(id)?.unitWeight ?? 0;

  const totalWeight = equipmentIds.reduce((a, id) => a + equipmentWeightById(id), 0);
  const carryCapacity = abilityTotal('STR') * 15;

  const [preview, setPreview] = useState<CharacterSheetState | null>(null);
  const previewStats = useMemo(() => {
    if (!preview) return null;
    const abilities = computeAbilities(preview);
    const vitals = computeVitals(preview, abilities);
    return {
      con: `HP ${vitals.effectiveMaxHP}`,
      ac: `CA ${vitals.effectiveAC}`,
      init: `Iniciativa ${vitals.effectiveInitiative >= 0 ? '+' : ''}${vitals.effectiveInitiative}`,
      speed: `Deslocamento ${preview.speedBase} ft.`,
      mana: `Mana ${preview.manaMax}`,
      heat: `Calor ${preview.heatMax}`,
    };
  }, [preview]);

  const canNext =
    step === 0 ? name.trim().length > 0 :
    step === 1 ? !!realmId :
    step === 2 ? !!classId :
    step === 3 ? !!speciesId :
    step === 4 ? (manualMode ? remaining === 0 : true) :
    step === 5 ? equipmentIds.length > 0 :
    true;

  const selectAbility = (k: AbilityKey, delta: number) => {
    setManual((prev) => {
      const next = Math.min(15, Math.max(8, (prev[k] || 8) + delta));
      return { ...prev, [k]: next };
    });
  };

  const recommendedDefault = recommendedEquipmentForClass(classId);
  const toggleEquipment = (id: string) => {
    setEquipmentIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const goToSummary = () => {
    const built = buildCharacterSheet({
      name,
      realmId,
      classId,
      speciesId,
      abilityScores: scores,
      equipmentIds,
    });
    setPreview(built);
    setStep(6);
  };

  const handleCreate = () => {
    if (!preview) {
      const built = buildCharacterSheet({
        name,
        realmId,
        classId,
        speciesId,
        abilityScores: scores,
        equipmentIds,
      });
      onCreate(built);
      return;
    }
    onCreate(preview);
  };

  const footer = (
    <div className="flex items-center justify-between mt-5 pt-4 border-t border-[#252320]">
      <div className="flex items-center gap-1.5">
        {STEPS.map((s, i) => (
          <span
            key={s.id}
            className={`h-1.5 w-6 rounded-full transition-colors ${
              i <= step ? 'bg-[#c8a357]' : 'bg-[#3a3835]'
            }`}
          />
        ))}
      </div>
      <div className="flex items-center gap-2">
        {step > 0 && (
          <button
            type="button"
            onClick={() => setStep((s) => s - 1)}
            className="inline-flex items-center gap-1 px-3.5 py-2 rounded border border-[#3a3835] bg-[#16161b] text-xs text-[#a39e93] hover:text-white cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Voltar
          </button>
        )}
        {step < 6 ? (
          <button
            type="button"
            disabled={!canNext}
            onClick={() => (step === 5 ? goToSummary() : setStep((s) => s + 1))}
            className="inline-flex items-center gap-1 px-4 py-2 rounded border border-[#c8a357] bg-[#241e12] text-[#f5d98e] text-xs font-semibold disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            Próximo
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        ) : (
          <button
            type="button"
            onClick={handleCreate}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded border border-[#c8a357] bg-[#e5c172] text-[#141418] text-xs font-bold hover:bg-[#f5d98e] cursor-pointer"
          >
            <Check className="w-4 h-4" />
            Criar Ficha
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto">
      <div className="rounded-lg border border-[#786137] bg-[#141418] p-5 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-display text-lg text-[#e5c172] tracking-wide">
              Nova Ficha de Personagem
            </h2>
            <p className="text-xs text-[#a39e93] mt-0.5">
              Passo {step + 1} de 7 — {STEPS[step].label}
            </p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="px-3 py-1.5 rounded border border-[#3a3835] bg-[#16161b] text-xs text-[#a39e93] hover:text-white cursor-pointer"
          >
            Cancelar
          </button>
        </div>

        {/* STEP 0 — NAME */}
        {step === 0 && (
          <div className="space-y-3">
            <label className="block text-xs text-[#a39e93]">
              Nome do personagem
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex.: Kalen, Ilyas, Seraphine…"
              className="w-full rounded border border-[#3a3835] bg-[#101014] px-3 py-2.5 text-sm text-white placeholder-[#6e6a63] focus:outline-none focus:border-[#786137]"
            />
            <button
              type="button"
              onClick={() => setName(randomCharacterName())}
              className="inline-flex items-center gap-1.5 rounded border border-[#3a3835] bg-[#16161b] px-3 py-2 text-xs text-[#e5c172] hover:border-[#786137] hover:text-white cursor-pointer"
            >
              <Dices className="w-3.5 h-3.5" />
              Gerar nome aleatório
            </button>
            <p className="text-[11px] text-[#8c877e]">
              Você poderá editar perfeitamente depois, na ficha.
            </p>
          </div>
        )}

        {/* STEP 1 — REALM */}
        {step === 1 && (
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div className="space-y-2">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-[#e5c172]">
                  Reinos Fruto ({COMPENDIUM_REALMS.filter((r) => r.group === 'fruto').length})
                </h3>
                {COMPENDIUM_REALMS.filter((r) => r.group === 'fruto').map((r) => {
                  const af = REALM_AFFINITIES.find((a) => a.id === r.id);
                  return (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => setRealmId(r.id)}
                      className={`w-full text-left rounded border p-3 transition-colors cursor-pointer ${
                        realmId === r.id
                          ? 'border-[#c8a357] bg-[#241e12]'
                          : 'border-[#3a3835] bg-[#101014] hover:border-[#6e5931]'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span>{r.icone || '✦'}</span>
                        <span className="font-display text-sm text-[#f5d98e]">
                          {r.name}
                        </span>
                      </div>
                      <div className="text-[11px] text-[#a39e93] mt-1">
                        {r.tagline}
                      </div>
                      {af && (
                        <div className="text-[11px] text-[#e5c172] mt-1">
                          Afinidade: {SPELL_SCHOOL_LABELS_PT[af.primary]} +{' '}
                          {SPELL_SCHOOL_LABELS_PT[af.secondary]}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
              <div className="space-y-2">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-[#f87171]">
                  Reinos do Caos ({COMPENDIUM_REALMS.filter((r) => r.group === 'caos').length})
                </h3>
                {COMPENDIUM_REALMS.filter((r) => r.group === 'caos').map((r) => {
                  const af = REALM_AFFINITIES.find((a) => a.id === r.id);
                  return (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => setRealmId(r.id)}
                      className={`w-full text-left rounded border p-3 transition-colors cursor-pointer ${
                        realmId === r.id
                          ? 'border-[#c8a357] bg-[#241e12]'
                          : 'border-[#3a3835] bg-[#101014] hover:border-[#6e5931]'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span>{r.icone || '☠'}</span>
                        <span className="font-display text-sm text-[#f5d98e]">
                          {r.name}
                        </span>
                      </div>
                      <div className="text-[11px] text-[#a39e93] mt-1">
                        {r.tagline}
                      </div>
                      {af && (
                        <div className="text-[11px] text-[#e5c172] mt-1">
                          Afinidade: {SPELL_SCHOOL_LABELS_PT[af.primary]} +{' '}
                          {SPELL_SCHOOL_LABELS_PT[af.secondary]}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
            {realm && (
              <div className="rounded border border-[#786137] bg-[#1a1814] p-3 text-xs text-[#a39e93]">
                <div className="text-[#e5c172] font-semibold mb-1">
                  {realm.name}
                  {realm.virtude ? ` — ${realm.virtude}` : ''}
                </div>
                {realm.citacao && (
                  <div className="italic text-[#b8b4ac] mt-1">
                    “{realm.citacao}”
                  </div>
                )}
                {realm.passiva && (
                  <div className="mt-2 border-t border-[#3a3835] pt-2">
                    <div className="font-semibold text-[#f5d98e]">
                      Passiva — {realm.passiva.nome}
                    </div>
                    <p className="text-[#b8b4ac] mt-0.5">
                      {realm.passiva.desc}
                    </p>
                  </div>
                )}
                <button
                  type="button"
                  onClick={() =>
                    window.open(
                      'file:///C:/Users/Gustavo Tot/Documents/RPG/App/reinos.html',
                      '_blank'
                    )
                  }
                  className="mt-2.5 inline-flex items-center gap-1.5 rounded border border-[#3a3835] bg-[#101014] px-3 py-1.5 text-xs text-[#e5c172] hover:border-[#786137] hover:text-white cursor-pointer"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Saiba mais sobre o reino
                </button>
              </div>
            )}
          </div>
        )}

        {/* STEP 2 — CLASS/ARCHETYPE */}
        {step === 2 && (
          <div className="space-y-2.5">
            {(realm?.arquetipos ?? []).length > 0 ? (
              realm!.arquetipos!.map((a) => {
                const base = COMPENDIUM_ARCHETYPES.find((x) => x.id === a.classe);
                return (
                  <button
                    key={a.classe}
                    type="button"
                    onClick={() => setClassId(a.classe)}
                    className={`w-full text-left rounded border p-3.5 transition-colors cursor-pointer ${
                      classId === a.classe
                        ? 'border-[#c8a357] bg-[#241e12]'
                        : 'border-[#3a3835] bg-[#101014] hover:border-[#6e5931]'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 text-center text-[#c8a357]">
                        {a.icone || base?.icone || '✦'}
                      </span>
                      <span className="font-display text-sm text-[#f5d98e]">
                        {a.nome} <span className="text-[11px] text-[#8c877e] normal-case">{a.classe}</span>
                        {a.revisao && (
                          <span className="ml-1.5 text-[10px] uppercase tracking-wide text-[#e5c172]">
                            Em revisão
                          </span>
                        )}
                      </span>
                    </div>
                    <div className="text-[11px] text-[#a39e93] mt-1">
                      {a.desc || base?.tagline}
                    </div>
                    <div className="text-[11px] text-[#8c877e] mt-1.5">
                      {base?.primaryAbilities.join(' / ') || '—'} · d{base?.hitDie} HP por nível ·{' '}
                      Mana ×{base?.manaMultiplier} · Calor ×{base?.calorMultiplier}
                    </div>
                  </button>
                );
              })
            ) : (
              COMPENDIUM_ARCHETYPES.map((a) => (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => setClassId(a.id)}
                  className={`w-full text-left rounded border p-3.5 transition-colors cursor-pointer ${
                    classId === a.id
                      ? 'border-[#c8a357] bg-[#241e12]'
                      : 'border-[#3a3835] bg-[#101014] hover:border-[#6e5931]'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-[#c8a357]" />
                    <span className="font-display text-sm text-[#f5d98e]">
                      {a.nome}
                    </span>
                  </div>
                  <div className="text-[11px] text-[#a39e93] mt-1">{a.tagline}</div>
                  <div className="text-[11px] text-[#8c877e] mt-1.5">
                    {a.primaryAbilities.join(' / ')} · d{a.hitDie} HP por nível ·{' '}
                    Mana ×{a.manaMultiplier} · Calor ×{a.calorMultiplier}
                  </div>
                </button>
              ))
            )}
          </div>
        )}

        {/* STEP 3 — SPECIES */}
        {step === 3 && (
          <div className="space-y-2.5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {COMPENDIUM_SPECIES.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setSpeciesId(s.id)}
                  className={`text-left rounded border p-3.5 transition-colors cursor-pointer ${
                    speciesId === s.id
                      ? 'border-[#c8a357] bg-[#241e12]'
                      : 'border-[#3a3835] bg-[#101014] hover:border-[#6e5931]'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Crown className="w-4 h-4 text-[#c8a357]" />
                      <span className="font-display text-sm text-[#f5d98e]">
                        {s.name}
                      </span>
                    </div>
                    <span className="text-[10px] text-[#8c877e] whitespace-nowrap">
                      {s.speedFt} ft. · Visão {s.darkvisionFt} ft.
                    </span>
                  </div>
                  <div className="text-[11px] text-[#a39e93] mt-1">
                    {s.tagline}
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {s.modifiers
                      .filter((m) => m.target === 'AbilityScore')
                      .map((m) => (
                        <span
                          key={m.id}
                          className="px-2 py-0.5 rounded bg-[#1a1814] border border-[#3a3835] text-[11px] text-[#e5c172]"
                        >
                          {ABILITY_LABELS[m.subTarget as AbilityKey]?.short}{' '}
                          {m.value > 0 ? '+' : ''}
                          {m.value}
                        </span>
                      ))}
                    {s.modifiers.some((m) => m.target === 'MaxHP') && (
                      <span className="px-2 py-0.5 rounded bg-[#1a1814] border border-[#3a3835] text-[11px] text-[#e5c172]">
                        HP {s.modifiers.find((m) => m.target === 'MaxHP')!.value > 0 ? '+' : ''}
                        {s.modifiers.find((m) => m.target === 'MaxHP')!.value}
                      </span>
                    )}
                    {s.modifiers.filter((m) => m.target === 'AbilityScore').length === 0 &&
                      !s.modifiers.some((m) => m.target === 'MaxHP') && (
                        <span className="px-2 py-0.5 rounded bg-[#18181e] border border-[#2b2930] text-[11px] text-[#8c877e]">
                          Sem bônus
                        </span>
                      )}
                  </div>
                  {s.traits.length > 0 && (
                    <div className="mt-2 border-t border-[#252324] pt-1.5 space-y-0.5">
                      <div className="text-[10px] uppercase tracking-wide text-[#8c877e]">
                        Passivas
                      </div>
                      {s.traits.slice(0, 3).map((t, i) => (
                        <div key={i} className="text-[11px] text-[#b8b4ac] leading-snug">
                          <span className="text-[#e5c172]">{t.name}</span>
                          <span className="text-[#8c877e]">
                            {' '}
                            — {t.description.length > 110 ? `${t.description.slice(0, 110)}…` : t.description}
                          </span>
                        </div>
                      ))}
                      {s.traits.length > 3 && (
                        <div className="text-[10px] text-[#8c877e]">
                          +{s.traits.length - 3} outra{s.traits.length - 3 > 1 ? 's' : ''} na ficha
                        </div>
                      )}
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* STEP 4 — ABILITIES */}
        {step === 4 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setManualMode(false)}
                className={`flex-1 rounded border px-3 py-2 text-xs font-semibold cursor-pointer ${
                  !manualMode
                    ? 'border-[#c8a357] bg-[#241e12] text-[#f5d98e]'
                    : 'border-[#3a3835] bg-[#101014] text-[#a39e93]'
                }`}
              >
                Conjuntos prontos
              </button>
              <button
                type="button"
                onClick={() => {
                  const preset =
                    ABILITY_PRESETS.find((p) => p.id === presetId) ||
                    ABILITY_PRESETS[0];
                  setManual({ ...preset.scores });
                  setManualMode(true);
                }}
                className={`flex-1 rounded border px-3 py-2 text-xs font-semibold cursor-pointer ${
                  manualMode
                    ? 'border-[#c8a357] bg-[#241e12] text-[#f5d98e]'
                    : 'border-[#3a3835] bg-[#101014] text-[#a39e93]'
                }`}
              >
                Distribuir manual (8–15)
              </button>
            </div>

            {!manualMode ? (
              <div className="space-y-2">
                {ABILITY_PRESETS.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setPresetId(p.id)}
                    className={`w-full text-left rounded border p-3 cursor-pointer ${
                      presetId === p.id
                        ? 'border-[#c8a357] bg-[#241e12]'
                        : 'border-[#3a3835] bg-[#101014] hover:border-[#6e5931]'
                    }`}
                  >
                    <div className="text-sm text-[#f5d98e] font-semibold">
                      {p.label}
                    </div>
                    <div className="text-[11px] text-[#a39e93] mt-0.5">
                      {p.desc}
                    </div>
                    <div className="flex gap-1.5 mt-2 flex-wrap">
                      {ABILITY_KEYS.map((k) => (
                        <span
                          key={k}
                          className="px-2 py-0.5 rounded bg-[#1a1814] border border-[#3a3835] text-[11px] text-[#b8b4ac]"
                        >
                          {ABILITY_LABELS[k].short} {p.scores[k]}
                        </span>
                      ))}
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                <div className="text-xs text-[#a39e93]">
                  Distribua sua reserva (padrão {remaining >= 0 ? 72 : 72}
                  {', deixe 0 pontos restantes'}). Atual:{' '}
                  <span
                    className={`font-bold ${
                      remaining === 0
                        ? 'text-[#4ade80]'
                        : remaining < 0
                          ? 'text-[#f87171]'
                          : 'text-[#e5c172]'
                    }`}
                  >
                    {remaining}
                  </span>{' '}
                  pts restantes.
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {ABILITY_KEYS.map((k) => (
                    <div
                      key={k}
                      className="flex items-center justify-between rounded border border-[#3a3835] bg-[#101014] px-3 py-2"
                    >
                      <div>
                        <div className="text-xs font-semibold text-white">
                          {ABILITY_LABELS[k].short}
                        </div>
                        <div className="text-[10px] text-[#8c877e]">
                          {ABILITY_LABELS[k].pt}
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => selectAbility(k, -1)}
                          className="px-2 py-0.5 rounded border border-[#3a3835] text-[#a39e93] hover:text-white cursor-pointer"
                        >
                          −
                        </button>
                        <span className="w-6 text-center font-mono-num text-sm text-[#f5d98e]">
                          {manual[k]}
                        </span>
                        <button
                          type="button"
                          onClick={() => selectAbility(k, 1)}
                          className="px-2 py-0.5 rounded border border-[#3a3835] text-[#a39e93] hover:text-white cursor-pointer"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="rounded border border-[#786137] bg-[#1a1814] p-3">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-semibold uppercase tracking-wide text-[#e5c172]">
                  Atributos finais
                </h4>
                <span className="text-[10px] text-[#8c877e]">
                  Base + bônus de origem
                </span>
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                {ABILITY_KEYS.map((k) => {
                  const chips = originAbilityBonus(k);
                  const total = abilityTotal(k);
                  const mod = abilityModValue(k);
                  return (
                    <div
                      key={k}
                      className="rounded border border-[#3a3835] bg-[#101014] px-2.5 py-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-white">
                          {ABILITY_LABELS[k].short}
                        </span>
                        <span
                          className={`font-mono-num text-sm font-bold ${
                            mod >= 0 ? 'text-[#e5c172]' : 'text-[#f87171]'
                          }`}
                        >
                          {mod >= 0 ? '+' : ''}
                          {mod}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 mt-1 flex-wrap">
                        <span className="text-[10px] text-[#8c877e]">
                          Base {scores[k] ?? 8}
                        </span>
                        {chips.map((c) => (
                          <span
                            key={c.name}
                            className="px-1.5 py-0.5 rounded bg-[#1a1814] border border-[#3a3835] text-[10px] text-[#e5c172]"
                          >
                            {c.value > 0 ? '+' : ''}
                            {c.value} {c.name}
                          </span>
                        ))}
                        {chips.length === 0 && (
                          <span className="text-[10px] text-[#6e6a63]">
                            sem bônus
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] font-bold text-[#f5d98e] mt-1">
                        Total {total}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* STEP 5 — EQUIPMENT */}
        {step === 5 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-[#e5c172]">
                  Equipamento inicial
                </h3>
                <p className="text-[11px] text-[#8c877e]">
                  Você pode adicionar ou remover itens depois, na ficha.
                </p>
              </div>
              <button
                type="button"
                onClick={() =>
                  setEquipmentIds((prev) =>
                    prev.length === recommendedDefault.length
                      ? []
                      : [...recommendedDefault]
                  )
                }
                className="px-3 py-1.5 rounded border border-[#3a3835] bg-[#16161b] text-xs text-[#a39e93] hover:text-white cursor-pointer"
              >
                Recomendado {cls ? `para ${cls.name}` : ''}
              </button>
            </div>

            <div className="flex items-center justify-between rounded border border-[#3a3835] bg-[#101014] px-3 py-2 text-xs">
              <span className="text-[#a39e93]">
                Peso total{' '}
                <span
                  className={`font-mono-num font-bold ${
                    totalWeight > carryCapacity
                      ? 'text-[#f87171]'
                      : 'text-[#f5d98e]'
                  }`}
                >
                  {totalWeight} lb
                </span>
                <span className="text-[#6e6a63]"> / {carryCapacity} lb</span>
              </span>
              <span className="text-[10px] text-[#8c877e]">
                Capacidade = FOR × 15
              </span>
            </div>

            <div className="space-y-3">
              <div>
                <h4 className="text-[11px] uppercase tracking-wide text-[#8c877e] mb-1.5">
                  Armas
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                  {LIBRARY_WEAPONS.map((w) => (
                    <button
                      key={w.id}
                      type="button"
                      onClick={() => toggleEquipment(w.id)}
                      className={`text-left rounded border px-3 py-2 cursor-pointer ${
                        equipmentIds.includes(w.id)
                          ? 'border-[#c8a357] bg-[#241e12]'
                          : 'border-[#3a3835] bg-[#101014] hover:border-[#6e5931]'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="text-xs text-[#f5d98e] font-semibold truncate">
                            {w.name}
                          </span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#1a1814] border border-[#3a3835] text-[#8c877e] whitespace-nowrap">
                            {equipmentWeightById(w.id)} lb
                          </span>
                        </div>
                        {equipmentIds.includes(w.id) && (
                          <Check className="w-3.5 h-3.5 shrink-0" />
                        )}
                      </div>
                      <div className="text-[10px] text-[#8c877e] mt-0.5">
                        {weaponLibraryBlurb(w)}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="text-[11px] uppercase tracking-wide text-[#8c877e] mb-1.5">
                  Armaduras
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                  {LIBRARY_ARMOR.map((a) => (
                    <button
                      key={a.id}
                      type="button"
                      onClick={() => toggleEquipment(a.id)}
                      className={`text-left rounded border px-3 py-2 cursor-pointer ${
                        equipmentIds.includes(a.id)
                          ? 'border-[#c8a357] bg-[#241e12]'
                          : 'border-[#3a3835] bg-[#101014] hover:border-[#6e5931]'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="text-xs text-[#f5d98e] font-semibold truncate">
                            {a.name}
                          </span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#1a1814] border border-[#3a3835] text-[#8c877e] whitespace-nowrap">
                            {equipmentWeightById(a.id)} lb
                          </span>
                        </div>
                        {equipmentIds.includes(a.id) && (
                          <Check className="w-3.5 h-3.5 shrink-0" />
                        )}
                      </div>
                      <div className="text-[10px] text-[#8c877e] mt-0.5">
                        {armorLibraryBlurb(a)}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="text-[11px] uppercase tracking-wide text-[#8c877e] mb-1.5">
                  Escudo
                </h4>
                <button
                  type="button"
                  onClick={() => toggleEquipment(LIBRARY_SHIELD.id)}
                  className={`text-left rounded border px-3 py-2 w-full cursor-pointer ${
                    equipmentIds.includes(LIBRARY_SHIELD.id)
                      ? 'border-[#c8a357] bg-[#241e12]'
                      : 'border-[#3a3835] bg-[#101014] hover:border-[#6e5931]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="text-xs text-[#f5d98e] font-semibold truncate">
                        {LIBRARY_SHIELD.name}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#1a1814] border border-[#3a3835] text-[#8c877e] whitespace-nowrap">
                        {equipmentWeightById(LIBRARY_SHIELD.id)} lb
                      </span>
                    </div>
                    {equipmentIds.includes(LIBRARY_SHIELD.id) && (
                      <Check className="w-3.5 h-3.5 shrink-0" />
                    )}
                  </div>
                  <div className="text-[10px] text-[#8c877e] mt-0.5">
                    +{LIBRARY_SHIELD.ac} CA
                  </div>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* STEP 6 — SUMMARY */}
        {step === 6 && preview && (
          <div className="space-y-3">
            {realm && (
              <div className="rounded border border-[#786137] bg-[#1a1814] p-3.5">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{realm.icone || '✦'}</span>
                  <div>
                    <div className="font-display text-lg text-[#f5d98e] tracking-wide">
                      {preview.name}
                    </div>
                    <div className="text-xs text-[#a39e93]">
                      {realm.name} · {cls?.name} · {species?.name} · Nv 1
                    </div>
                  </div>
                </div>
                {affinity && (
                  <div className="text-[11px] text-[#e5c172] mt-2">
                    Afinidade Mágica: {SPELL_SCHOOL_LABELS_PT[affinity.primary]} +{' '}
                    {SPELL_SCHOOL_LABELS_PT[affinity.secondary]}
                  </div>
                )}
              </div>
            )}

            {previewStats && (
              <div className="grid grid-cols-3 gap-2">
                {Object.entries(previewStats).map(([key, val]) => (
                  <div
                    key={key}
                    className="rounded border border-[#3a3835] bg-[#101014] px-2.5 py-2 text-center"
                  >
                    <div className="text-[10px] uppercase tracking-wide text-[#8c877e]">
                      {val.split(' ')[0]}
                    </div>
                    <div className="text-xs font-bold text-[#f5d98e] mt-0.5">
                      {val.split(' ').slice(1).join(' ')}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="grid grid-cols-3 gap-1.5">
              {ABILITY_KEYS.map((k) => (
                <div
                  key={k}
                  className="flex justify-between items-center rounded border border-[#3a3835] bg-[#101014] px-2.5 py-1.5 text-xs"
                >
                  <span className="text-[#a39e93]">{ABILITY_LABELS[k].short}</span>
                  <span className="font-mono-num font-bold text-[#f5d98e]">
                    {scores[k]}
                  </span>
                </div>
              ))}
            </div>

            <div className="text-xs text-[#a39e93]">
              <span className="text-[#e5c172] font-semibold">
                {equipmentIds.length} itens
              </span>{' '}
              no inventário ·{' '}
              <span className="text-[#e5c172] font-semibold">
                {preview.spells.length} magias
              </span>{' '}
              do reino disponíveis ·{' '}
              <span className="text-[#e5c172] font-semibold">
                {preview.features.length} características
              </span>{' '}
              de origem
            </div>

            <p className="text-[11px] text-[#8c877e]">
              O bônus racial de {species?.name} é aplicado automaticamente nos
              atributos. Você pode ajustar tudo depois na ficha.
            </p>
          </div>
        )}

        {footer}
      </div>
    </div>
  );
}