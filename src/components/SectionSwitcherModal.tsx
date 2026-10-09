import React, { useState } from 'react';
import {
  Compass,
  Dumbbell,
  Swords,
  Sparkles,
  Backpack,
  Award,
  ScrollText,
  BookOpen,
  Languages,
  LayoutGrid,
  X,
} from 'lucide-react';
import { SheetSectionId } from '../types/rpg';

export interface SectionMeta {
  id: SheetSectionId;
  label: string;
  upperLabel: string;
  icon: React.FC<{ className?: string }>;
}

export const SHEET_SECTIONS: SectionMeta[] = [
  {
    id: 'abilities',
    label: 'Abilities',
    upperLabel: 'ABILITIES',
    icon: Compass,
  },
  {
    id: 'skills',
    label: 'Skills & Tools',
    upperLabel: 'SKILLS & TOOLS',
    icon: Dumbbell,
  },
  {
    id: 'combat',
    label: 'Combat',
    upperLabel: 'COMBAT',
    icon: Swords,
  },
  {
    id: 'spells',
    label: 'Spells',
    upperLabel: 'SPELLS',
    icon: Sparkles,
  },
  {
    id: 'inventory',
    label: 'Inventory',
    upperLabel: 'INVENTORY',
    icon: Backpack,
  },
  {
    id: 'features',
    label: 'Features & Traits',
    upperLabel: 'FEATURES & TRAITS',
    icon: Award,
  },
  {
    id: 'notes',
    label: 'Notes',
    upperLabel: 'NOTES',
    icon: ScrollText,
  },
  {
    id: 'about',
    label: 'About',
    upperLabel: 'ABOUT',
    icon: BookOpen,
  },
  {
    id: 'proficiencies',
    label: 'Prof. & Languages',
    upperLabel: 'PROFICIENCIES & LANGUAGES',
    icon: Languages,
  },
];

interface SectionSwitcherProps {
  activeSection: SheetSectionId;
  onSelectSection: (section: SheetSectionId) => void;
}

export const SectionSwitcherBar: React.FC<SectionSwitcherProps> = ({
  activeSection,
  onSelectSection,
}) => {
  const [modalOpen, setModalOpen] = useState(false);
  const currentMeta =
    SHEET_SECTIONS.find((s) => s.id === activeSection) || SHEET_SECTIONS[0];

  return (
    <>
      {/* Gold divider + central section trigger button matching Screenshot 1, 5, 6, 8, 11, 14, 15, 16, 17 */}
      <div className="relative flex items-center justify-center my-4 px-2">
        <div className="flex-1 h-[1px] bg-gradient-to-r from-transparent via-[#735c30] to-[#b89249]" />
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="mx-3 inline-flex items-center gap-2.5 px-4 py-2 rounded border border-[#c8a357] bg-[#121216] hover:bg-[#1b1a20] text-[#e5c172] font-display font-bold tracking-wider text-sm shadow-[0_0_15px_rgba(200,163,87,0.12)] transition-colors cursor-pointer"
        >
          <LayoutGrid className="w-4 h-4 text-[#c8a357]" />
          <span>{currentMeta.upperLabel}</span>
        </button>
        <div className="flex-1 h-[1px] bg-gradient-to-l from-transparent via-[#735c30] to-[#b89249]" />
      </div>

      {/* Quick horizontal desktop/tablet bar for instant 1-click switching */}
      <div className="hidden lg:flex items-center justify-center flex-wrap gap-1.5 mb-4 px-2">
        {SHEET_SECTIONS.map((sec) => {
          const Icon = sec.icon;
          const isActive = sec.id === activeSection;
          return (
            <button
              key={sec.id}
              type="button"
              onClick={() => onSelectSection(sec.id)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-colors whitespace-nowrap ${
                isActive
                  ? 'bg-[#252118] text-[#f0cd7e] border border-[#c8a357]/70'
                  : 'bg-[#141418] text-[#9e9a91] border border-[#26252a] hover:text-[#e6e4e0] hover:border-[#454138]'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{sec.label}</span>
            </button>
          );
        })}
      </div>

      {/* 3x3 Grid Modal matching Screenshot 4 */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4"
          onClick={() => setModalOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-xl border border-[#4a4336] bg-[#16161a] p-5 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative flex items-center justify-center pb-4 mb-3 border-b border-[#2a2825]">
              <div className="inline-flex items-center gap-2 text-[#d8b467] font-display font-bold tracking-wider text-sm">
                <LayoutGrid className="w-4 h-4 text-[#c8a357]" />
                <span>{currentMeta.upperLabel}</span>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="absolute right-0 top-0 p-1.5 rounded border border-[#7c2d2d] bg-[#2a1414] text-[#f87171] hover:bg-[#3f1d1d]"
                aria-label="Fechar menu de seções"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {SHEET_SECTIONS.map((sec) => {
                const Icon = sec.icon;
                const isSelected = sec.id === activeSection;
                return (
                  <button
                    key={sec.id}
                    type="button"
                    onClick={() => {
                      onSelectSection(sec.id);
                      setModalOpen(false);
                    }}
                    className={`flex flex-col items-center justify-center gap-2.5 p-4 rounded-lg border transition-all min-h-[104px] ${
                      isSelected
                        ? 'bg-[#28272c] border-[#c8a357] text-white shadow-[0_0_12px_rgba(200,163,87,0.2)]'
                        : 'bg-[#1b1b20] border-transparent hover:border-[#3d3930] text-[#b8b4ac] hover:text-white'
                    }`}
                  >
                    <Icon
                      className={`w-9 h-9 ${
                        isSelected ? 'text-[#e5c172]' : 'text-[#b5b0a6]'
                      }`}
                    />
                    <span className="text-xs font-medium text-center leading-tight">
                      {sec.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
