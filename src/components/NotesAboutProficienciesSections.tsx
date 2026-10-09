import React, { useState } from 'react';
import {
  Lock,
  MessageSquare,
  MinusCircle,
  Pencil,
  Plus,
  Search,
  Settings,
  X,
} from 'lucide-react';
import {
  CharacterSheetState,
  NoteEntry,
  ProficiencyCategory,
} from '../types/rpg';
import { ARMOR_CATEGORIES, BASE_LANGUAGES } from '../data/constants';

/* ============================================================================
 * 26. NOTES SECTION (Matching Screenshot 15)
 * ========================================================================== */
interface NotesSectionProps {
  sheet: CharacterSheetState;
  onUpdateSheet: (updater: (prev: CharacterSheetState) => CharacterSheetState) => void;
}

export const NotesSection: React.FC<NotesSectionProps> = ({
  sheet,
  onUpdateSheet,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCatId, setFilterCatId] = useState<string>('All');
  const [addingEntryCatId, setAddingEntryCatId] = useState<string | null>(null);
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);
  const [entryDraft, setEntryDraft] = useState<Omit<NoteEntry, 'id'>>({
    name: '',
    relationship: '',
    description: '',
    additionalNotes: '',
  });

  const [addingCategory, setAddingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  const handleSaveEntry = (catId: string) => {
    if (!entryDraft.name.trim()) return;
    const newEntry: NoteEntry = {
      ...entryDraft,
      id: `note-${Date.now()}`,
    };
    onUpdateSheet((prev) => ({
      ...prev,
      noteCategories: prev.noteCategories.map((c) =>
        c.id === catId ? { ...c, entries: [...c.entries, newEntry] } : c
      ),
    }));
    setEntryDraft({
      name: '',
      relationship: '',
      description: '',
      additionalNotes: '',
    });
    setAddingEntryCatId(null);
  };

  const handleUpdateEntry = (catId: string, updated: NoteEntry) => {
    onUpdateSheet((prev) => ({
      ...prev,
      noteCategories: prev.noteCategories.map((c) =>
        c.id === catId
          ? {
              ...c,
              entries: c.entries.map((e) =>
                e.id === updated.id ? updated : e
              ),
            }
          : c
      ),
    }));
  };

  const handleRemoveEntry = (catId: string, entryId: string) => {
    onUpdateSheet((prev) => ({
      ...prev,
      noteCategories: prev.noteCategories.map((c) =>
        c.id === catId
          ? { ...c, entries: c.entries.filter((e) => e.id !== entryId) }
          : c
      ),
    }));
  };

  const handleAddCategory = () => {
    if (!newCategoryName.trim()) return;
    onUpdateSheet((prev) => ({
      ...prev,
      noteCategories: [
        ...prev.noteCategories,
        {
          id: `cat-custom-${Date.now()}`,
          name: newCategoryName.trim().toUpperCase(),
          isDefault: false,
          entries: [],
        },
      ],
    }));
    setNewCategoryName('');
    setAddingCategory(false);
  };

  return (
    <div className="rounded-lg border border-[#786137] bg-[#141418] p-4 shadow-lg space-y-5">
      {/* Search & Filter Bar matching Screenshot 15 */}
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
            value={filterCatId}
            onChange={(e) => setFilterCatId(e.target.value)}
            aria-label="Filtrar categorias de notas"
            className="bg-transparent text-xs text-[#b8b4ac] border-l border-[#2c2a27] pl-2 ml-2 focus:outline-none cursor-pointer"
          >
            <option value="All" className="bg-[#16161b]">
              Show: All
            </option>
            {sheet.noteCategories.map((cat) => (
              <option key={cat.id} value={cat.id} className="bg-[#16161b]">
                {cat.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Categories List matching Screenshot 15 */}
      <div className="space-y-6">
        {sheet.noteCategories
          .filter((c) => filterCatId === 'All' || c.id === filterCatId)
          .map((cat) => {
            const filteredEntries = cat.entries.filter(
              (e) =>
                e.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                e.description
                  .toLowerCase()
                  .includes(searchQuery.toLowerCase()) ||
                e.relationship.toLowerCase().includes(searchQuery.toLowerCase())
            );

            return (
              <div key={cat.id}>
                <div className="flex items-center justify-between pb-2 border-b border-[#2c2a27] text-xs">
                  <div className="flex items-center gap-1.5 font-display font-bold tracking-wider text-[#d8b467] uppercase">
                    <Lock className="w-3 h-3 text-[#8c877e]" />
                    <span>{cat.name}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    {!cat.isDefault && (
                      <button
                        type="button"
                        onClick={() =>
                          onUpdateSheet((prev) => ({
                            ...prev,
                            noteCategories: prev.noteCategories.filter(
                              (x) => x.id !== cat.id
                            ),
                          }))
                        }
                        className="p-1 text-[#78746d] hover:text-[#f87171] cursor-pointer"
                        title="Remover categoria personalizada"
                      >
                        <MinusCircle className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() =>
                        setAddingEntryCatId(
                          addingEntryCatId === cat.id ? null : cat.id
                        )
                      }
                      className="p-1 text-[#a39e93] hover:text-[#e5c172] cursor-pointer"
                      title={`Adicionar nota em ${cat.name}`}
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Inline New Entry Form */}
                {addingEntryCatId === cat.id && (
                  <div className="my-2 p-3 rounded border border-[#4a3f28] bg-[#18181e] space-y-2.5 text-xs">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <input
                        type="text"
                        placeholder="Name (Nome da Organização, Aliado, Inimigo...)"
                        value={entryDraft.name}
                        onChange={(e) =>
                          setEntryDraft({ ...entryDraft, name: e.target.value })
                        }
                        className="px-2.5 py-1.5 rounded bg-[#101014] border border-[#33312e] text-white"
                      />
                      <input
                        type="text"
                        placeholder="Relationship (Relação / Cargo / Status)"
                        value={entryDraft.relationship}
                        onChange={(e) =>
                          setEntryDraft({
                            ...entryDraft,
                            relationship: e.target.value,
                          })
                        }
                        className="px-2.5 py-1.5 rounded bg-[#101014] border border-[#33312e] text-white"
                      />
                    </div>
                    <textarea
                      rows={2}
                      placeholder="Description..."
                      value={entryDraft.description}
                      onChange={(e) =>
                        setEntryDraft({
                          ...entryDraft,
                          description: e.target.value,
                        })
                      }
                      className="w-full px-2.5 py-1.5 rounded bg-[#101014] border border-[#33312e] text-white"
                    />
                    <input
                      type="text"
                      placeholder="Additional Notes..."
                      value={entryDraft.additionalNotes}
                      onChange={(e) =>
                        setEntryDraft({
                          ...entryDraft,
                          additionalNotes: e.target.value,
                        })
                      }
                      className="w-full px-2.5 py-1.5 rounded bg-[#101014] border border-[#33312e] text-white"
                    />
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setAddingEntryCatId(null)}
                        className="px-2.5 py-1 text-[#9e9a91]"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSaveEntry(cat.id)}
                        className="px-3 py-1 rounded bg-[#8a6f3b] text-white font-semibold cursor-pointer"
                      >
                        Salvar Nota
                      </button>
                    </div>
                  </div>
                )}

                {filteredEntries.length === 0 ? (
                  <p className="py-3 text-xs text-[#6e6a63]">
                    You currently have no {cat.name.toLowerCase()}
                  </p>
                ) : (
                  <div className="divide-y divide-[#201f25]">
                    {filteredEntries.map((entry) => {
                      const isEditing = editingEntryId === entry.id;

                      if (isEditing) {
                        return (
                          <div
                            key={entry.id}
                            className="py-3 px-2.5 my-2 rounded border border-[#5c4b2b] bg-[#18181e] space-y-2.5 text-xs"
                          >
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              <input
                                type="text"
                                value={entry.name}
                                onChange={(e) =>
                                  handleUpdateEntry(cat.id, {
                                    ...entry,
                                    name: e.target.value,
                                  })
                                }
                                className="px-2.5 py-1.5 rounded bg-[#101014] border border-[#33312e] text-white"
                              />
                              <input
                                type="text"
                                value={entry.relationship}
                                onChange={(e) =>
                                  handleUpdateEntry(cat.id, {
                                    ...entry,
                                    relationship: e.target.value,
                                  })
                                }
                                className="px-2.5 py-1.5 rounded bg-[#101014] border border-[#33312e] text-white"
                              />
                            </div>
                            <textarea
                              rows={2}
                              value={entry.description}
                              onChange={(e) =>
                                handleUpdateEntry(cat.id, {
                                  ...entry,
                                  description: e.target.value,
                                })
                              }
                              className="w-full px-2.5 py-1.5 rounded bg-[#101014] border border-[#33312e] text-white"
                            />
                            <input
                              type="text"
                              value={entry.additionalNotes}
                              onChange={(e) =>
                                handleUpdateEntry(cat.id, {
                                  ...entry,
                                  additionalNotes: e.target.value,
                                })
                              }
                              className="w-full px-2.5 py-1.5 rounded bg-[#101014] border border-[#33312e] text-white"
                            />
                            <div className="flex justify-end">
                              <button
                                type="button"
                                onClick={() => setEditingEntryId(null)}
                                className="px-3 py-1 rounded bg-[#2e2d35] text-white font-bold uppercase text-xs cursor-pointer"
                              >
                                DONE
                              </button>
                            </div>
                          </div>
                        );
                      }

                      return (
                        <div key={entry.id} className="py-3 text-xs">
                          <div className="flex items-start justify-between gap-2">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-semibold text-white">
                                  {entry.name}
                                </span>
                                {entry.relationship && (
                                  <span className="text-[11px] text-[#e5c172]">
                                    · {entry.relationship}
                                  </span>
                                )}
                              </div>
                              {entry.description && (
                                <p className="text-[#b8b4ac]">
                                  {entry.description}
                                </p>
                              )}
                              {entry.additionalNotes && (
                                <p className="text-[11px] text-[#8c877e] italic">
                                  {entry.additionalNotes}
                                </p>
                              )}
                            </div>

                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                type="button"
                                onClick={() => setEditingEntryId(entry.id)}
                                className="p-1 text-[#8c877e] hover:text-white cursor-pointer"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  handleRemoveEntry(cat.id, entry.id)
                                }
                                className="p-1 text-[#78746d] hover:text-[#f87171] cursor-pointer"
                              >
                                <MinusCircle className="w-3.5 h-3.5" />
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

      {/* 26.4 + Add New Category Button matching bottom of Screenshot 15 */}
      <div className="pt-2 border-t border-[#26252b]">
        {addingCategory ? (
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              placeholder="Nome da categoria (ex: Quests, Locations, Lore, Secrets...)"
              className="flex-1 px-3 py-1.5 rounded border border-[#3a3835] bg-[#101014] text-xs text-white focus:border-[#c8a357] focus:outline-none"
            />
            <button
              type="button"
              onClick={handleAddCategory}
              className="px-3 py-1.5 rounded bg-[#8a6f3b] text-white text-xs font-semibold cursor-pointer"
            >
              Criar
            </button>
            <button
              type="button"
              onClick={() => setAddingCategory(false)}
              className="px-2 py-1.5 text-xs text-[#9e9a91]"
            >
              Cancelar
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setAddingCategory(true)}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#c4aa78] hover:text-[#f0cd7e] cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Category</span>
          </button>
        )}
      </div>
    </div>
  );
};

/* ============================================================================
 * 27–30. ABOUT SECTION (Matching Screenshot 16)
 * ========================================================================== */
interface AboutSectionProps {
  sheet: CharacterSheetState;
  onUpdateSheet: (updater: (prev: CharacterSheetState) => CharacterSheetState) => void;
}

export const AboutSection: React.FC<AboutSectionProps> = ({
  sheet,
  onUpdateSheet,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [addingCharField, setAddingCharField] = useState(false);
  const [newCharLabel, setNewCharLabel] = useState('');
  const [newCharValue, setNewCharValue] = useState('');

  const handleAddBackground = () => {
    onUpdateSheet((prev) => ({
      ...prev,
      backgrounds: [
        ...prev.backgrounds,
        {
          id: `bg-${Date.now()}`,
          title: 'New Background',
          description: '',
        },
      ],
    }));
  };

  const handleAddAppearance = () => {
    onUpdateSheet((prev) => ({
      ...prev,
      appearances: [
        ...prev.appearances,
        {
          id: `app-${Date.now()}`,
          name: 'New Appearance',
          description: '',
        },
      ],
    }));
  };

  const handleAddCharacteristic = () => {
    if (!newCharLabel.trim()) return;
    onUpdateSheet((prev) => ({
      ...prev,
      characteristics: [
        ...prev.characteristics,
        {
          id: `char-custom-${Date.now()}`,
          label: newCharLabel.trim(),
          value: newCharValue.trim() || 'None',
          isDefault: false,
        },
      ],
    }));
    setNewCharLabel('');
    setNewCharValue('');
    setAddingCharField(false);
  };

  return (
    <div className="rounded-lg border border-[#786137] bg-[#141418] p-4 shadow-lg space-y-6">
      {/* Top Search Bar matching Screenshot 16 */}
      <div className="flex items-center rounded border border-[#3a3835] bg-[#101014] px-3 py-1.5">
        <Search className="w-4 h-4 text-[#78746d] mr-2 shrink-0" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search..."
          className="w-full bg-transparent text-xs text-white placeholder-[#6e6a63] focus:outline-none"
        />
      </div>

      {/* 28. BACKGROUND SECTION (Supports Multiple Backgrounds!) */}
      <div>
        <div className="flex items-center justify-between pb-2 border-b border-[#2c2a27] text-xs">
          <div className="flex items-center gap-1.5 font-display font-bold tracking-wider text-[#d8b467] uppercase">
            <Lock className="w-3 h-3 text-[#8c877e]" />
            <span>BACKGROUND</span>
          </div>
          <button
            type="button"
            onClick={handleAddBackground}
            className="p-1 text-[#a39e93] hover:text-[#e5c172] cursor-pointer"
            title="+ Add Background"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {sheet.backgrounds.length === 0 ? (
          <p className="py-3 text-xs text-[#6e6a63]">
            You currently have no backgrounds
          </p>
        ) : (
          <div className="space-y-3 pt-3">
            {sheet.backgrounds
              .filter(
                (b) =>
                  b.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  b.description
                    .toLowerCase()
                    .includes(searchQuery.toLowerCase())
              )
              .map((bg) => (
                <div
                  key={bg.id}
                  className="space-y-2 pb-3 border-b border-[#201f25] last:border-b-0 text-xs"
                >
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={bg.title}
                      onChange={(e) =>
                        onUpdateSheet((prev) => ({
                          ...prev,
                          backgrounds: prev.backgrounds.map((item) =>
                            item.id === bg.id
                              ? { ...item, title: e.target.value }
                              : item
                          ),
                        }))
                      }
                      placeholder="Background Title"
                      className="flex-1 px-3 py-1.5 rounded border border-[#3a3835] bg-[#18181e] text-white font-semibold focus:border-[#c8a357] focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        onUpdateSheet((prev) => ({
                          ...prev,
                          backgrounds: prev.backgrounds.filter(
                            (item) => item.id !== bg.id
                          ),
                        }))
                      }
                      className="p-1 text-[#e07a7a] hover:text-[#f87171] cursor-pointer"
                    >
                      <MinusCircle className="w-4 h-4" />
                    </button>
                  </div>
                  <textarea
                    rows={2}
                    value={bg.description}
                    onChange={(e) =>
                      onUpdateSheet((prev) => ({
                        ...prev,
                        backgrounds: prev.backgrounds.map((item) =>
                          item.id === bg.id
                            ? { ...item, description: e.target.value }
                            : item
                        ),
                      }))
                    }
                    placeholder="Background Description..."
                    className="w-full rounded border border-[#3a3835] bg-[#121216] p-2.5 text-[#d4d0c8] focus:border-[#c8a357] focus:outline-none"
                  />
                </div>
              ))}
          </div>
        )}
      </div>

      {/* 29. CHARACTERISTICS SECTION matching Screenshot 16 */}
      <div>
        <div className="flex items-center justify-between pb-2 border-b border-[#2c2a27] text-xs">
          <div className="flex items-center gap-1.5 font-display font-bold tracking-wider text-[#d8b467] uppercase">
            <Lock className="w-3 h-3 text-[#8c877e]" />
            <span>CHARACTERISTICS</span>
          </div>
          <button
            type="button"
            onClick={() => setAddingCharField((p) => !p)}
            className="p-1 text-[#a39e93] hover:text-[#e5c172] cursor-pointer"
            title="Add New Characteristic"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {addingCharField && (
          <div className="my-2 p-3 rounded border border-[#4a3f28] bg-[#18181e] flex flex-wrap items-center gap-2 text-xs">
            <input
              type="text"
              placeholder="Característica (ex: Voz, Marca Arcana)"
              value={newCharLabel}
              onChange={(e) => setNewCharLabel(e.target.value)}
              className="flex-1 px-2.5 py-1.5 rounded bg-[#101014] border border-[#33312e] text-white"
            />
            <input
              type="text"
              placeholder="Valor"
              value={newCharValue}
              onChange={(e) => setNewCharValue(e.target.value)}
              className="flex-1 px-2.5 py-1.5 rounded bg-[#101014] border border-[#33312e] text-white"
            />
            <button
              type="button"
              onClick={handleAddCharacteristic}
              className="px-3 py-1.5 rounded bg-[#8a6f3b] text-white font-semibold cursor-pointer"
            >
              Add
            </button>
          </div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-x-4 gap-y-4 pt-3 text-xs">
          {sheet.characteristics.map((ch) => (
            <div key={ch.id} className="flex flex-col">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-semibold uppercase tracking-wider text-[#9e9a91] mb-1">
                  {ch.label}:
                </label>
                {!ch.isDefault && (
                  <button
                    type="button"
                    onClick={() =>
                      onUpdateSheet((prev) => ({
                        ...prev,
                        characteristics: prev.characteristics.filter(
                          (c) => c.id !== ch.id
                        ),
                      }))
                    }
                    className="text-[#78746d] hover:text-[#f87171]"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>

              <div className="flex items-center border-b border-[#3a3835] pb-1">
                {ch.options ? (
                  <select
                    value={ch.value}
                    onChange={(e) =>
                      onUpdateSheet((prev) => ({
                        ...prev,
                        characteristics: prev.characteristics.map((c) =>
                          c.id === ch.id ? { ...c, value: e.target.value } : c
                        ),
                      }))
                    }
                    className="w-full bg-transparent text-white focus:outline-none cursor-pointer"
                  >
                    {ch.options.map((opt) => (
                      <option key={opt} value={opt} className="bg-[#18181e]">
                        {opt}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={ch.value}
                    onChange={(e) =>
                      onUpdateSheet((prev) => ({
                        ...prev,
                        characteristics: prev.characteristics.map((c) =>
                          c.id === ch.id ? { ...c, value: e.target.value } : c
                        ),
                      }))
                    }
                    className="w-full bg-transparent text-[#d4d0c8] italic focus:text-white focus:not-italic focus:outline-none"
                  />
                )}
                {ch.unit && (
                  <span className="text-[#8c877e] ml-1 shrink-0">
                    {ch.unit}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 30. APPEARANCE SECTION matching Screenshot 16 */}
      <div>
        <div className="flex items-center justify-between pb-2 border-b border-[#2c2a27] text-xs">
          <div className="flex items-center gap-1.5 font-display font-bold tracking-wider text-[#d8b467] uppercase">
            <Lock className="w-3 h-3 text-[#8c877e]" />
            <span>APPEARANCE</span>
          </div>
          <button
            type="button"
            onClick={handleAddAppearance}
            className="p-1 text-[#a39e93] hover:text-[#e5c172] cursor-pointer"
            title="Adicionar entrada de Aparência (Face, Hair, Clothing, Scars...)"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-4 pt-3 text-xs">
          {sheet.appearances.map((app) => (
            <div key={app.id} className="space-y-2">
              <label className="block text-[10px] uppercase tracking-wider text-[#9e9a91]">
                NAME
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={app.name}
                  onChange={(e) =>
                    onUpdateSheet((prev) => ({
                      ...prev,
                      appearances: prev.appearances.map((a) =>
                        a.id === app.id ? { ...a, name: e.target.value } : a
                      ),
                    }))
                  }
                  placeholder="Ex: Face, Hair, Clothing, Scars..."
                  className="flex-1 px-3 py-2 rounded border border-[#3a3835] bg-[#18181e] text-white font-medium focus:border-[#c8a357] focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() =>
                    onUpdateSheet((prev) => ({
                      ...prev,
                      appearances: prev.appearances.filter(
                        (a) => a.id !== app.id
                      ),
                    }))
                  }
                  className="p-1 text-[#e07a7a] hover:text-[#f87171] cursor-pointer"
                >
                  <MinusCircle className="w-4 h-4 fill-[#e07a7a]/20" />
                </button>
              </div>

              <label className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-[#9e9a91] pt-1">
                <span>DESCRIPTION</span>
                <MessageSquare className="w-3 h-3 text-[#78746d]" />
              </label>
              <textarea
                rows={3}
                value={app.description}
                onChange={(e) =>
                  onUpdateSheet((prev) => ({
                    ...prev,
                    appearances: prev.appearances.map((a) =>
                      a.id === app.id
                        ? { ...a, description: e.target.value }
                        : a
                    ),
                  }))
                }
                className="w-full rounded border border-[#3a3835] bg-[#121216] p-2.5 text-white focus:border-[#c8a357] focus:outline-none"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

/* ============================================================================
 * 31–32. PROFICIENCIES & LANGUAGES SECTION (Matching Screenshot 17)
 * ========================================================================== */
interface ProficienciesSectionProps {
  sheet: CharacterSheetState;
  onUpdateSheet: (updater: (prev: CharacterSheetState) => CharacterSheetState) => void;
}

const PROF_CATEGORIES: { key: ProficiencyCategory; label: string }[] = [
  { key: 'Weapons', label: 'Weapons' },
  { key: 'Armor', label: 'Armor' },
  { key: 'Tools', label: 'Tools' },
  { key: 'Languages', label: 'Languages' },
];

export const ProficienciesSection: React.FC<ProficienciesSectionProps> = ({
  sheet,
  onUpdateSheet,
}) => {
  const [showSources, setShowSources] = useState(true);
  const [inputs, setInputs] = useState<Record<ProficiencyCategory, string>>({
    Weapons: '',
    Armor: '',
    Tools: '',
    Languages: '',
  });

  const handleAddProf = (category: ProficiencyCategory, name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    onUpdateSheet((prev) => ({
      ...prev,
      proficiencies: [
        ...prev.proficiencies,
        {
          id: `prof-${category}-${Date.now()}`,
          category,
          name: trimmed,
          source: { type: 'Custom', name: 'Custom' },
        },
      ],
    }));
    setInputs((p) => ({ ...p, [category]: '' }));
  };

  return (
    <div className="rounded-lg border border-[#786137] bg-[#141418] p-4 shadow-lg space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-display font-bold text-sm tracking-wider text-[#d8b467] uppercase">
          PROFICIENCIES & LANGUAGES
        </h2>
        <button
          type="button"
          onClick={() => setShowSources((prev) => !prev)}
          title="Alternar exibição da fonte (Class, Species, Realm, Background)"
          className={`inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs transition-colors cursor-pointer ${
            showSources
              ? 'bg-[#2a2315] text-[#f0cd7e] border border-[#8a6f3b]'
              : 'text-[#8c877e] hover:text-[#d8b467]'
          }`}
        >
          <Settings className="w-4 h-4" />
          <span className="hidden sm:inline">Fontes</span>
        </button>
      </div>

      {/* 4 Boxes matching Screenshot 17 (Weapons, Armor, Tools, Languages) */}
      <div className="space-y-4 text-xs">
        {PROF_CATEGORIES.map((cat) => {
          const items = sheet.proficiencies.filter(
            (p) => p.category === cat.key
          );

          return (
            <div key={cat.key}>
              <label className="block text-[#9e9a91] font-medium mb-1.5">
                {cat.label}
              </label>

              {/* Tag container styled like the dark input box in Screenshot 17 */}
              <div className="min-h-[42px] rounded border border-[#3a3835] bg-[#121216] p-2 flex flex-wrap items-center gap-1.5">
                {items.map((item) => (
                  <span
                    key={item.id}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#232229] border border-[#35333d] text-white font-medium"
                  >
                    <span>{item.name}</span>
                    {showSources && (
                      <span className="text-[10px] text-[#d8b467]">
                        · {item.source.type}: {item.source.name}
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() =>
                        onUpdateSheet((prev) => ({
                          ...prev,
                          proficiencies: prev.proficiencies.filter(
                            (x) => x.id !== item.id
                          ),
                        }))
                      }
                      className="text-[#8c877e] hover:text-[#f87171] ml-0.5 cursor-pointer"
                      aria-label={`Remover ${item.name}`}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}

                <input
                  type="text"
                  value={inputs[cat.key]}
                  onChange={(e) =>
                    setInputs((p) => ({ ...p, [cat.key]: e.target.value }))
                  }
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddProf(cat.key, inputs[cat.key]);
                    }
                  }}
                  placeholder={`+ Adicionar ${cat.label.toLowerCase()} (Enter)...`}
                  className="flex-1 min-w-[140px] bg-transparent text-xs text-white placeholder-[#5e5a54] focus:outline-none px-1"
                />
              </div>

              {/* Quick suggestion presets for Armor & Languages */}
              {cat.key === 'Armor' && (
                <div className="flex flex-wrap gap-1.5 mt-1.5 text-[11px] text-[#8c877e]">
                  <span>Sugestões:</span>
                  {ARMOR_CATEGORIES.map((ac) => (
                    <button
                      key={ac}
                      type="button"
                      onClick={() => handleAddProf('Armor', ac)}
                      className="hover:text-[#e5c172] underline cursor-pointer"
                    >
                      +{ac}
                    </button>
                  ))}
                </div>
              )}

              {cat.key === 'Languages' && (
                <div className="flex flex-wrap gap-1.5 mt-1.5 text-[11px] text-[#8c877e]">
                  <span>Idiomas:</span>
                  {BASE_LANGUAGES.map((lang) => (
                    <button
                      key={lang}
                      type="button"
                      onClick={() => handleAddProf('Languages', lang)}
                      className="hover:text-[#e5c172] underline cursor-pointer"
                    >
                      +{lang}
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
