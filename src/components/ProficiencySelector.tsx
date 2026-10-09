import React, { useState, useRef, useEffect } from 'react';
import { ProficiencyLevel } from '../types/rpg';
import { PROFICIENCY_LEVELS } from '../data/constants';

interface ProficiencySelectorProps {
  value: ProficiencyLevel;
  onChange: (newLevel: ProficiencyLevel) => void;
  sourceLabel?: string;
  size?: 'sm' | 'md';
}

export const ProficiencyBadgeIcon: React.FC<{
  level: ProficiencyLevel;
  size?: 'sm' | 'md';
}> = ({ level, size = 'md' }) => {
  const dim = size === 'sm' ? 'w-4 h-4' : 'w-5 h-5';

  if (level === 'None') {
    return (
      <span
        className={`inline-flex items-center justify-center rounded-full border border-dashed border-[#6b6863] ${dim} transition-colors group-hover:border-[#c8a357]`}
      />
    );
  }

  if (level === 'Half Proficiency') {
    return (
      <span
        className={`relative inline-flex items-center justify-center rounded-full border border-dashed border-[#c93b3b] ${dim} overflow-hidden`}
      >
        <span className="absolute left-0 top-0 bottom-0 w-1/2 bg-[#b92b2b]" />
      </span>
    );
  }

  if (level === 'Proficient') {
    return (
      <span
        className={`inline-flex items-center justify-center rounded-full border border-[#e05252] bg-[#9e2525] ${dim} shadow-[0_0_8px_rgba(185,43,43,0.45)]`}
      />
    );
  }

  // Expertise
  return (
    <span
      className={`inline-flex items-center justify-center rounded-full border-2 border-[#e05252] p-0.5 ${dim} shadow-[0_0_10px_rgba(224,82,82,0.55)]`}
    >
      <span className="w-full h-full rounded-full bg-[#c93232]" />
    </span>
  );
};

export const ProficiencySelector: React.FC<ProficiencySelectorProps> = ({
  value,
  onChange,
  sourceLabel,
  size = 'md',
}) => {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  return (
    <div ref={containerRef} className="relative inline-flex items-center">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((prev) => !prev);
        }}
        title={
          sourceLabel
            ? `${value} · Origem: ${sourceLabel}`
            : `Proficiência: ${value}`
        }
        className="group min-w-[32px] min-h-[32px] flex items-center justify-center rounded hover:bg-white/5 focus:outline-none"
      >
        <ProficiencyBadgeIcon level={value} size={size} />
      </button>

      {open && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="absolute right-0 top-full mt-1 z-50 w-52 rounded-md border border-[#3a3630] bg-[#16161b] shadow-2xl py-1 text-left"
        >
          {sourceLabel && (
            <div className="px-3 py-1.5 text-[11px] text-[#a39e93] border-b border-[#262421]">
              Origem: <span className="text-[#d8b467] font-medium">{sourceLabel}</span>
            </div>
          )}
          {PROFICIENCY_LEVELS.map((opt) => {
            const active = opt.value === value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  onChange(opt.value);
                  setOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 text-sm transition-colors ${
                  active
                    ? 'bg-[#7c1d1d] text-white font-medium'
                    : 'text-[#d4d0c8] hover:bg-[#222229]'
                }`}
              >
                <ProficiencyBadgeIcon level={opt.value} size="sm" />
                <span>{opt.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
