import React from 'react';
import { Clock, Skull, X } from 'lucide-react';
import { CharacterSheetState } from '../types/rpg';
import { CONDITIONS_LIST, conditionLabel } from '../data/constants';

interface ConditionsSectionProps {
  sheet: CharacterSheetState;
  onUpdateSheet: (
    updater: (prev: CharacterSheetState) => CharacterSheetState
  ) => void;
}

const ConditionsSection: React.FC<ConditionsSectionProps> = ({
  sheet,
  onUpdateSheet,
}) => {
  const turns = sheet.conditionTurns ?? {};

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

  const clearConditions = () => {
    onUpdateSheet((prev) => ({
      ...prev,
      activeConditions: [],
      conditionTurns: {},
    }));
  };

  return (
    <div className="flex flex-col gap-4 sm:gap-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Skull className="w-5 h-5 text-[#c8a357]" />
          <h2 className="text-lg sm:text-xl font-display font-bold text-[#e5c172] tracking-wider">
            Condições & Status
          </h2>
        </div>
        {sheet.activeConditions.length > 0 && (
          <button
            type="button"
            onClick={clearConditions}
            className="px-2.5 py-1.5 rounded border border-[#3a3835] bg-[#16161b] text-xs text-[#d4d0c8] hover:text-white hover:border-[#786137] transition-colors cursor-pointer"
          >
            Limpar Tudo
          </button>
        )}
      </div>

      {/* Active Conditions Summary */}
      <div className="rounded border border-[#2c2a27] bg-[#0d0d11] p-4">
        <div className="text-xs font-semibold text-[#c4AA78] mb-2">
          Condições Ativas
        </div>
        {sheet.activeConditions.length > 0 ? (
          <div className="flex flex-col gap-2">
            {sheet.activeConditions.map((cond) => {
              const remaining = turns[cond] ?? 0;
              return (
                <div
                  key={cond}
                  className="flex flex-wrap items-center gap-2 rounded border border-[#5c1d1d] bg-[#7c1d1d]/20 px-2.5 py-1.5"
                >
                  <span className="text-sm font-semibold text-[#fca5a5]">
                    {conditionLabel(cond)}
                  </span>

                  <div
                    className="flex items-center rounded border border-[#ef4444]/40 bg-[#180a0a] px-1.5 py-1"
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
                      className="w-9 text-center bg-transparent font-mono-num font-bold text-xs text-[#fde047] focus:outline-none"
                    />
                    <span className="text-[10px] text-[#fca5a5]">t</span>
                  </div>

                  {remaining > 0 && (
                    <button
                      type="button"
                      onClick={() => tickCondition(cond)}
                      title="Passar 1 turno (em 0 a condição é removida)"
                      className="px-2 py-1 rounded bg-[#7f1d1d] hover:bg-[#991b1b] text-white font-mono-num text-[11px] font-bold cursor-pointer"
                    >
                      -1t
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => toggleCondition(cond)}
                    title="Remover condição"
                    className="ml-auto inline-flex items-center gap-1 px-2 py-1 rounded border border-[#5c1d1d] text-[11px] text-[#fca5a5] hover:text-white hover:bg-[#7c1d1d] transition-colors cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                    Remover
                  </button>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-sm text-[#8c877e]">Nenhuma condição ativa</div>
        )}
      </div>

      {/* Conditions Grid */}
      <div className="rounded border border-[#2c2a27] bg-[#0d0d11] p-4">
        <div className="text-xs font-semibold text-[#c4AA78] mb-3">
          Todas as Condições
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
          {CONDITIONS_LIST.map((cond) => {
            const active = sheet.activeConditions.includes(cond);
            return (
              <button
                key={cond}
                type="button"
                onClick={() => toggleCondition(cond)}
                title={cond}
                className={`px-2 py-2 rounded text-xs font-medium border transition-all duration-150 cursor-pointer text-center ${
                  active
                    ? 'bg-[#7c1d1d] border-[#ef4444] text-white shadow-[0_0_8px_rgba(239,68,68,0.25)]'
                    : 'bg-[#08080a] border-[#2e2c29] text-[#9e9a91] hover:text-white hover:border-[#786137]'
                }`}
              >
                {conditionLabel(cond)}
              </button>
            );
          })}
        </div>
      </div>

      {/* Notes about multiple conditions */}
      <div className="text-xs text-[#8c877e] px-1">
        Você pode ter várias condições ativas ao mesmo tempo. Clique para
        ativar/desativar. Defina os turnos para contar a duração automaticamente.
      </div>
    </div>
  );
};

export default ConditionsSection;
