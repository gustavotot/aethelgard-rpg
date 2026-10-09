import { useRef, useState } from 'react';
import {
  Check,
  Copy,
  Crown,
  Download,
  Plus,
  Trash2,
  Upload,
  User,
  Users,
  X,
} from 'lucide-react';
import { CharacterSheetState } from '../types/rpg';
import { COMPENDIUM_CLASSES, COMPENDIUM_REALMS, COMPENDIUM_SPECIES } from '../data/compendium';
import { realmGroupLabel } from '../utils/characterFactory';

interface RosterViewProps {
  roster: CharacterSheetState[];
  activeId: string | null;
  onOpen: (id: string) => void;
  onNew: () => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
  onExport: (ch: CharacterSheetState) => void;
  onImport: (chars: CharacterSheetState[]) => void;
  onCancel: () => void;
}

export function RosterView({
  roster,
  activeId,
  onOpen,
  onNew,
  onDuplicate,
  onDelete,
  onExport,
  onImport,
  onCancel,
}: RosterViewProps) {
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleImportFile = (file: File) => {
    setImportError(null);
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(String(reader.result));
        const arr = Array.isArray(data) ? data : [data];
        const valid = arr.filter(
          (x): x is CharacterSheetState =>
            x && typeof x === 'object' && typeof x.id === 'string' && typeof x.name === 'string'
        );
        if (valid.length === 0) {
          setImportError('Nenhuma ficha válida encontrada no arquivo.');
          return;
        }
        onImport(valid);
      } catch {
        setImportError('Não foi possível ler o arquivo: JSON inválido.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div className="rounded-lg border border-[#786137] bg-[#141418] p-5 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-[#c8a357]" />
            <h2 className="font-display text-lg text-[#e5c172] tracking-wide">
              Minhas Fichas ({roster.length})
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded border border-[#3a3835] bg-[#16161b] text-xs text-[#e5c172] hover:border-[#786137] cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5" />
              Importar
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/json,.json"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleImportFile(file);
                e.target.value = '';
              }}
            />
            <button
              type="button"
              onClick={onCancel}
              className="px-3 py-1.5 rounded border border-[#3a3835] bg-[#16161b] text-xs text-[#a39e93] hover:text-white cursor-pointer"
            >
              Voltar
            </button>
          </div>
        </div>

        {importError && (
          <div className="mb-4 px-3 py-2 rounded border border-[#7c2d2d] bg-[#2a1414] text-xs text-[#f87171]">
            {importError}
          </div>
        )}

        {roster.length === 0 ? (
          <div className="text-center py-10 space-y-3">
            <Crown className="w-10 h-10 mx-auto text-[#5c4b2b]" />
            <p className="text-sm text-[#a39e93]">
              Nenhuma ficha criada ainda. Crie uma nova ficha para começar.
            </p>
            <button
              type="button"
              onClick={onNew}
              className="inline-flex items-center gap-2 px-4 py-2 rounded border border-[#c8a357] bg-[#241e12] text-[#f5d98e] text-sm font-semibold hover:bg-[#2e2416] cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Nova Ficha
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {roster.map((ch) => {
              const realm = COMPENDIUM_REALMS.find((r) => r.id === ch.realmId);
              const cls = COMPENDIUM_CLASSES.find((c) => c.id === ch.classId);
              const sp = COMPENDIUM_SPECIES.find((s) => s.id === ch.speciesId);
              const confirming = confirmDeleteId === ch.id;
              return (
                <div
                  key={ch.id}
                  className={`rounded-lg border p-3.5 flex flex-col sm:flex-row sm:items-center gap-3 ${
                    activeId === ch.id
                      ? 'border-[#c8a357] bg-[#241e12]'
                      : 'border-[#3a3835] bg-[#101014]'
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-display font-bold text-[#f5d98e] text-base tracking-wider truncate">
                        {ch.name}
                      </span>
                      {activeId === ch.id && (
                        <span className="px-2 py-0.5 rounded-full bg-[#c8a357]/20 border border-[#c8a357] text-[10px] font-semibold text-[#f5d98e] uppercase">
                          Ativa
                        </span>
                      )}
                      <span className="px-2 py-0.5 rounded bg-[#1a1814] border border-[#5c4b2b] text-[11px] text-[#e5c172]">
                        Nv {ch.level}
                      </span>
                    </div>
                    <div className="text-xs text-[#a39e93] mt-1 flex flex-wrap gap-1.5">
                      <span className="inline-flex items-center gap-1">
                        <Crown className="w-3 h-3" />
                        {realm?.name || ch.realmId}
                      </span>
                      <span>·</span>
                      <span>{cls?.name || ch.classId}</span>
                      <span>·</span>
                      <span>{sp?.name || ch.speciesId}</span>
                    </div>
                    {realm?.group && (
                      <div className="text-[11px] text-[#8c877e] mt-0.5">
                        {realmGroupLabel(realm.group)}
                      </div>
                    )}
                  </div>

                  {confirming ? (
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-[#f87171]">
                        Excluir esta ficha?
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          onDelete(ch.id);
                          setConfirmDeleteId(null);
                        }}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded bg-[#7c2d2d] hover:bg-[#9e2525] text-white text-xs font-semibold cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5" />
                        Excluir
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteId(null)}
                        className="p-2 rounded border border-[#3a3835] bg-[#16161b] text-[#8c877e] hover:text-white cursor-pointer"
                        title="Cancelar exclusão"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => onOpen(ch.id)}
                        className="px-3.5 py-1.5 rounded border border-[#786137] bg-[#1a1814] text-[#e5c172] text-xs font-semibold hover:bg-[#241e12] cursor-pointer"
                      >
                        Abrir
                      </button>
                      <button
                        type="button"
                        onClick={() => onDuplicate(ch.id)}
                        title="Duplicar ficha"
                        className="p-2 rounded border border-[#3a3835] bg-[#16161b] text-[#8c877e] hover:text-white cursor-pointer"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onExport(ch)}
                        title="Exportar ficha (JSON)"
                        className="p-2 rounded border border-[#3a3835] bg-[#16161b] text-[#8c877e] hover:text-white cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteId(ch.id)}
                        title="Excluir ficha"
                        className="p-2 rounded border border-[#3a3835] bg-[#16161b] text-[#8c877e] hover:text-[#f87171] cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {roster.length > 0 && (
        <button
          type="button"
          onClick={onNew}
          className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-lg border border-dashed border-[#786137] bg-[#141418] text-[#e5c172] text-sm font-semibold hover:bg-[#1a1814] cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Criar Nova Ficha de Personagem
        </button>
      )}
    </div>
  );
}

export function SheetBadge({ sheet }: { sheet: CharacterSheetState }) {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#1a1814] border border-[#5c4b2b] text-[11px] text-[#e5c172]">
      <User className="w-3 h-3" />
      {sheet.name}
    </span>
  );
}