import React from 'react';
import { Dices, Trash2, X } from 'lucide-react';
import { RollLogEntry } from '../types/rpg';

interface CombatLogModalProps {
  open: boolean;
  logs: RollLogEntry[];
  onClearLogs: () => void;
  onClose: () => void;
}

export const CombatLogPanel: React.FC<CombatLogModalProps> = ({
  open,
  logs,
  onClearLogs,
  onClose,
}) => {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-xl border border-[#786137] bg-[#121216] p-4 shadow-2xl flex flex-col max-h-[82vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#2c2a27]">
          <div className="flex items-center gap-2 font-display font-bold text-sm tracking-wider text-[#d8b467] uppercase">
            <Dices className="w-4 h-4 text-[#c8a357]" />
            <span>Combat & Roll Log ({logs.length})</span>
          </div>

          <div className="flex items-center gap-2">
            {logs.length > 0 && (
              <button
                type="button"
                onClick={onClearLogs}
                title="Limpar histórico"
                className="inline-flex items-center gap-1 px-2 py-1 rounded bg-[#1d1c22] hover:bg-[#2a1818] text-xs text-[#a39e93] hover:text-[#f87171] cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Limpar</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded border border-[#7c2d2d] bg-[#2a1414] text-[#f87171] hover:bg-[#3f1d1d] cursor-pointer"
              aria-label="Fechar janela de Log"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Log Body */}
        {logs.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center py-10 px-4 text-xs text-[#78746d]">
            <Dices className="w-8 h-8 text-[#4a463f] mb-2.5" />
            <p className="leading-relaxed">
              Nenhuma rolagem registrada ainda. Clique em qualquer{' '}
              <strong className="text-[#b8b4ac]">Ataque</strong>,{' '}
              <strong className="text-[#b8b4ac]">Dano</strong>,{' '}
              <strong className="text-[#b8b4ac]">Magia</strong>,{' '}
              <strong className="text-[#b8b4ac]">Atributo</strong>,{' '}
              <strong className="text-[#b8b4ac]">Perícia</strong> ou{' '}
              <strong className="text-[#b8b4ac]">Iniciativa</strong> na ficha.
            </p>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
            {logs.map((entry) => (
              <div
                key={entry.id}
                className="p-3 rounded-lg border border-[#2c2a30] bg-[#0b0b0e] text-xs space-y-1.5"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-bold text-white">{entry.title}</span>
                  <span className="text-[10px] font-mono-num text-[#78746d]">
                    {entry.timestamp}
                  </span>
                </div>

                <div className="text-[11px] text-[#9e9a91] flex items-center justify-between">
                  <span>{entry.subtitle}</span>
                  {entry.rollMode !== 'normal' && (
                    <span className="uppercase text-[10px] font-bold text-[#e5c172]">
                      {entry.rollMode}
                    </span>
                  )}
                </div>

                {entry.total !== undefined && (
                  <div className="flex items-center justify-between pt-1.5 border-t border-[#1e1d24]">
                    <span className="text-[11px] font-mono-num text-[#b8b4ac]">
                      {entry.breakdown}
                    </span>
                    <span
                      className={`font-mono-num text-base font-bold px-2.5 py-0.5 rounded ${
                        entry.isCrit
                          ? 'bg-[#1b3620] text-[#4ade80] border border-[#22c55e]'
                          : entry.isFumble
                          ? 'bg-[#3b1515] text-[#f87171] border border-[#ef4444]'
                          : 'bg-[#25221b] text-[#f5d98e] border border-[#786137]'
                      }`}
                    >
                      {entry.total}
                    </span>
                  </div>
                )}

                {entry.damageTotal !== undefined && (
                  <div className="flex items-center justify-between pt-1.5 border-t border-[#1e1d24]">
                    <span className="text-[11px] font-mono-num text-[#e09f9f]">
                      {entry.damageType || 'Dano'}: {entry.damageBreakdown}
                    </span>
                    <span className="font-mono-num text-sm font-bold px-2.5 py-0.5 rounded bg-[#2d1618] text-[#f87171] border border-[#991b1b]">
                      {entry.damageTotal}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
