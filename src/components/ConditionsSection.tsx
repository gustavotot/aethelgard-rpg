import React from 'react';
import { Skull } from 'lucide-react';
import { CharacterSheetState } from '../types/rpg';
import { CONDITIONS_LIST } from '../data/constants';

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
  const toggleCondition = (cond: string) => {
    onUpdateSheet((prev) => {
      const exists = prev.activeConditions.includes(cond);
      return {
        ...prev,
        activeConditions: exists
          ? prev.activeConditions.filter((c) => c !== cond)
          : [...prev.activeConditions, cond],
      };
    });
  };

  const clearConditions = () => {
    onUpdateSheet((prev) => ({
      ...prev,
      activeConditions: [],
    }));
  };

  return (
    <div className="flex flex-col gap-4 sm:gap-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Skull className="w-5 h-5 text-[#c8a357]" />
          <h2 className="text-lg sm:text-xl font-display font-bold text-[#e5c172] tracking-wider">
            Conditions & Status
          </h2>
        </div>
        {sheet.activeConditions.length > 0 && (
          <button
            type="button"
            onClick={clearConditions}
            className="px-2.5 py-1.5 rounded border border-[#3a3835] bg-[#16161b] text-xs text-[#d4d0c8] hover:text-white hover:border-[#786137] transition-colors cursor-pointer"
          >
            Clear All
          </button>
        )}
      </div>

      {/* Active Conditions Summary */}
      <div className="rounded border border-[#2c2a27] bg-[#0d0d11] p-4">
        <div className="text-xs font-semibold text-[#c4AA78] mb-2">
          Active Conditions
        </div>
        {sheet.activeConditions.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {sheet.activeConditions.map((cond) => (
              <button
                key={cond}
                type="button"
                onClick={() => toggleCondition(cond)}
                className="px-2.5 py-1 rounded text-xs font-medium border bg-[#7c1d1d] border-[#ef4444] text-white hover:bg-[#9f1f1f] transition-colors cursor-pointer"
                title="Remove condition"
              >
                {cond} ✕
              </button>
            ))}
          </div>
        ) : (
          <div className="text-sm text-[#8c877e]">No conditions active</div>
        )}
      </div>

      {/* Conditions Grid */}
      <div className="rounded border border-[#2c2a27] bg-[#0d0d11] p-4">
        <div className="text-xs font-semibold text-[#c4AA78] mb-3">
          All Conditions
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
          {CONDITIONS_LIST.map((cond) => {
            const active = sheet.activeConditions.includes(cond);
            return (
              <button
                key={cond}
                type="button"
                onClick={() => toggleCondition(cond)}
                className={`px-2 py-2 rounded text-xs font-medium border transition-all duration-150 cursor-pointer text-center ${
                  active
                    ? 'bg-[#7c1d1d] border-[#ef4444] text-white shadow-[0_0_8px_rgba(239,68,68,0.25)]'
                    : 'bg-[#08080a] border-[#2e2c29] text-[#9e9a91] hover:text-white hover:border-[#786137]'
                }`}
              >
                {cond}
              </button>
            );
          })}
        </div>
      </div>

      {/* Notes about multiple conditions */}
      <div className="text-xs text-[#8c877e] px-1">
        You can have multiple conditions active at the same time. Click a condition to toggle it on/off.
      </div>
    </div>
  );
};

export default ConditionsSection;
