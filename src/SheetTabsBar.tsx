import { useEffect, useState } from 'react';
import {
  ArrowLeft,
  Check,
  FolderMinus,
  FolderPlus,
  Home,
  Layers,
  Plus,
  Share2,
  Trash2,
  X,
} from 'lucide-react';
import type { CharacterSheet } from './types';

export interface FolderOption {
  id: string;
  name: string;
}

export interface OpenSheetTab {
  id: string;
  label: string;
  supplement: string;
  isShared?: boolean;
}

const SUPPLEMENT_DOT: Record<string, string> = {
  'modulo-basico': 'bg-amber-400',
  'quatro-elementos': 'bg-amber-700',
  'infames-condutores': 'bg-slate-400',
  'fading-humans': 'bg-pink-400',
  'ad-astra': 'bg-sky-400',
  'nova-ruvia': 'bg-cyan-400',
  'portadores-milagres': 'bg-emerald-400',
  eidos: 'bg-violet-400',
  nave: 'bg-sky-300',
};

export function SheetTabsBar({
  tabs,
  activeTabId,
  isListView,
  onSelectHome,
  onSelectTab,
  onCloseTab,
}: {
  tabs: OpenSheetTab[];
  activeTabId: string | null;
  isListView: boolean;
  onSelectHome: () => void;
  onSelectTab: (id: string) => void;
  onCloseTab: (id: string) => void;
}) {
  if (tabs.length === 0) return null;

  return (
    <nav
      aria-label="Guias de fichas abertas"
      className="sticky top-0 z-40 flex items-center gap-1 overflow-x-auto border-b border-white/10 bg-[#0b0d12]/95 px-3 py-1.5 text-xs text-slate-200 backdrop-blur-md"
    >
      <button
        type="button"
        onClick={onSelectHome}
        className={`flex shrink-0 items-center gap-1.5 rounded-sm border px-2.5 py-1 font-bold uppercase tracking-wider transition-colors ${
          isListView
            ? 'border-amber-400/60 bg-amber-400/15 text-amber-300'
            : 'border-white/10 bg-white/5 text-slate-300 hover:border-white/25 hover:text-white'
        }`}
      >
        <Home size={13} />
        <span>Menu Inicial</span>
      </button>

      <div className="mx-1 h-4 w-px shrink-0 bg-white/10" aria-hidden="true" />

      {tabs.map(tab => {
        const isActive = !isListView && activeTabId === tab.id;
        const dotColor = SUPPLEMENT_DOT[tab.supplement] || 'bg-amber-400';
        return (
          <div
            key={tab.id}
            className={`group flex max-w-[220px] shrink-0 items-center gap-1 rounded-sm border transition-colors ${
              isActive
                ? 'border-amber-400/60 bg-white/15 text-white'
                : 'border-white/10 bg-white/[0.03] text-slate-300 hover:border-white/25 hover:bg-white/[0.08]'
            }`}
          >
            <button
              type="button"
              onClick={() => onSelectTab(tab.id)}
              onMouseDown={event => {
                if (event.button === 1) {
                  event.preventDefault();
                  onCloseTab(tab.id);
                }
              }}
              className="flex min-w-0 flex-1 items-center gap-2 py-1 pl-2.5 pr-1 text-left font-semibold"
              title={tab.label}
            >
              <span className={`size-2 shrink-0 rounded-full ${dotColor}`} aria-hidden="true" />
              <span className="truncate">{tab.label || 'Sem nome'}</span>
              {tab.isShared && (
                <span className="shrink-0 rounded bg-emerald-500/20 px-1 text-[9px] font-bold uppercase text-emerald-300">
                  Live
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={event => {
                event.stopPropagation();
                onCloseTab(tab.id);
              }}
              aria-label={`Fechar guia ${tab.label}`}
              title="Fechar guia"
              className="mr-1 rounded p-0.5 text-slate-400 transition-colors hover:bg-white/10 hover:text-white"
            >
              <X size={12} />
            </button>
          </div>
        );
      })}
    </nav>
  );
}

export function CardContextMenu({
  state,
  folders,
  characterFolderIds,
  isOpenInTab,
  onClose,
  onOpenNewTab,
  onOpenBackgroundTab,
  onCloseTab,
  onMoveToFolder,
  onCreateAndMoveToFolder,
  onRemoveFromFolders,
  onShare,
  onDelete,
}: {
  state: { x: number; y: number; character: CharacterSheet } | null;
  folders: FolderOption[];
  characterFolderIds: string[];
  isOpenInTab: boolean;
  onClose: () => void;
  onOpenNewTab: (id: string) => void;
  onOpenBackgroundTab: (id: string) => void;
  onCloseTab: (id: string) => void;
  onMoveToFolder: (characterId: string, folderId: string) => void;
  onCreateAndMoveToFolder: (characterId: string, folderName: string) => void;
  onRemoveFromFolders: (characterId: string, folderIds: string[]) => void;
  onShare: (character: CharacterSheet) => void;
  onDelete: (characterId: string) => void;
}) {
  const [mode, setMode] = useState<'main' | 'move' | 'remove' | 'delete'>('main');
  const [newFolderName, setNewFolderName] = useState('');
  const [selectedRemoveIds, setSelectedRemoveIds] = useState<string[]>([]);

  useEffect(() => {
    setMode('main');
    setNewFolderName('');
    setSelectedRemoveIds([]);
  }, [state]);

  useEffect(() => {
    if (!state) return;
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    const handlePointer = () => onClose();
    window.addEventListener('keydown', handleKey);
    window.addEventListener('click', handlePointer);
    return () => {
      window.removeEventListener('keydown', handleKey);
      window.removeEventListener('click', handlePointer);
    };
  }, [state, onClose]);

  if (!state) return null;

  const assignedFolders = folders.filter(folder => characterFolderIds.includes(folder.id));
  const menuWidth = mode === 'main' ? 276 : 300;
  const estimatedHeight = mode === 'main' ? 245 : 320;
  const left = typeof window !== 'undefined' ? Math.max(8, Math.min(state.x, window.innerWidth - menuWidth - 8)) : state.x;
  const top = typeof window !== 'undefined' ? Math.max(8, Math.min(state.y, window.innerHeight - estimatedHeight - 8)) : state.y;

  const toggleRemoveFolder = (folderId: string) => {
    setSelectedRemoveIds(prev =>
      prev.includes(folderId) ? prev.filter(id => id !== folderId) : [...prev, folderId]
    );
  };

  return (
    <div
      role="menu"
      aria-label={`Opções para ${state.character.name}`}
      style={{ left, top, width: menuWidth }}
      onClick={event => event.stopPropagation()}
      onContextMenu={event => event.preventDefault()}
      className="fixed z-50 max-h-[75vh] overflow-y-auto rounded-sm border border-amber-400/40 bg-[#111319] p-1.5 text-xs text-slate-100 shadow-2xl"
    >
      <div className="flex items-center justify-between gap-2 border-b border-white/10 px-2.5 py-1.5">
        {mode !== 'main' ? (
          <button
            type="button"
            onClick={() => setMode('main')}
            className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-slate-300 hover:text-amber-300"
          >
            <ArrowLeft size={12} />
            <span>Voltar</span>
          </button>
        ) : null}
        <span className="truncate text-[10px] font-bold uppercase tracking-wider text-amber-300/85">
          {state.character.name || 'Sem nome'}
        </span>
      </div>

      {mode === 'main' && (
        <div className="mt-1 space-y-0.5">
          <div className="flex items-center gap-1 rounded-sm hover:bg-white/10">
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                onOpenNewTab(state.character.id);
                onClose();
              }}
              className="flex flex-1 items-center gap-2 px-2.5 py-2 text-left"
            >
              <Layers size={13} className="shrink-0 text-amber-300" />
              <span>Abrir em nova guia</span>
            </button>
            <button
              type="button"
              onClick={() => {
                onOpenBackgroundTab(state.character.id);
                onClose();
              }}
              title="Abrir em nova guia sem sair do Menu Inicial"
              className="mr-1 rounded border border-white/15 px-1.5 py-0.5 text-[10px] text-slate-300 hover:border-amber-400/50 hover:text-white"
            >
              2º plano
            </button>
            {isOpenInTab && (
              <button
                type="button"
                onClick={() => {
                  onCloseTab(state.character.id);
                  onClose();
                }}
                aria-label="Fechar guia aberta"
                title="Fechar guia aberta"
                className="mr-1 rounded p-1 text-rose-300 hover:bg-rose-500/20"
              >
                <X size={12} />
              </button>
            )}
          </div>

          <button
            type="button"
            role="menuitem"
            onClick={() => setMode('move')}
            className="flex w-full items-center gap-2 rounded-sm px-2.5 py-2 text-left hover:bg-white/10"
          >
            <FolderPlus size={13} className="shrink-0 text-amber-300" />
            <span>Mover para...</span>
          </button>

          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setSelectedRemoveIds(assignedFolders.length === 1 ? [assignedFolders[0].id] : []);
              setMode('remove');
            }}
            className="flex w-full items-center justify-between gap-2 rounded-sm px-2.5 py-2 text-left hover:bg-white/10"
          >
            <span className="flex items-center gap-2">
              <FolderMinus size={13} className="shrink-0 text-sky-300" />
              <span>Remover de...</span>
            </span>
            {assignedFolders.length > 0 && (
              <span className="rounded bg-white/10 px-1.5 text-[10px] text-slate-300">
                {assignedFolders.length}
              </span>
            )}
          </button>

          <button
            type="button"
            role="menuitem"
            onClick={() => {
              onShare(state.character);
              onClose();
            }}
            className="flex w-full items-center gap-2 rounded-sm px-2.5 py-2 text-left text-emerald-300 hover:bg-emerald-500/10"
          >
            <Share2 size={13} className="shrink-0 text-emerald-400" />
            <span>
              {state.character.shareId
                ? 'Gerenciar compartilhamento ao vivo'
                : 'Ativar compartilhamento em tempo real'}
            </span>
          </button>

          <button
            type="button"
            role="menuitem"
            onClick={() => setMode('delete')}
            className="mt-1 flex w-full items-center gap-2 border-t border-white/10 px-2.5 py-2 text-left text-rose-300 hover:bg-rose-500/10"
          >
            <Trash2 size={13} className="shrink-0" />
            <span>Excluir ficha</span>
          </button>
        </div>
      )}

      {mode === 'move' && (
        <div className="mt-2 space-y-2.5 px-1.5 pb-1">
          <form
            className="flex gap-1.5"
            onSubmit={event => {
              event.preventDefault();
              const trimmed = newFolderName.trim();
              if (!trimmed) return;
              onCreateAndMoveToFolder(state.character.id, trimmed);
              onClose();
            }}
          >
            <input
              type="text"
              autoFocus
              aria-label="Nome da nova pasta"
              placeholder="Nova pasta..."
              value={newFolderName}
              onChange={event => setNewFolderName(event.target.value)}
              className="min-w-0 flex-1 rounded-sm border border-white/15 bg-black/40 px-2 py-1.5 text-xs text-white outline-none focus:border-amber-400"
            />
            <button
              type="submit"
              disabled={!newFolderName.trim()}
              className="inline-flex shrink-0 items-center gap-1 rounded-sm bg-amber-400 px-2.5 py-1.5 text-[11px] font-bold uppercase text-black hover:bg-amber-300 disabled:opacity-40"
            >
              <Plus size={12} />
              <span>Criar</span>
            </button>
          </form>

          {folders.length > 0 && (
            <div className="space-y-1 border-t border-white/10 pt-2">
              <p className="px-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Adicionar a uma pasta existente
              </p>
              {folders.map(folder => {
                const alreadyIn = characterFolderIds.includes(folder.id);
                return (
                  <button
                    key={folder.id}
                    type="button"
                    onClick={() => {
                      if (!alreadyIn) {
                        onMoveToFolder(state.character.id, folder.id);
                        onClose();
                      }
                    }}
                    className={`flex w-full items-center justify-between rounded-sm px-2 py-1.5 text-left transition ${
                      alreadyIn
                        ? 'bg-emerald-500/10 text-emerald-300'
                        : 'hover:bg-white/10 text-slate-200'
                    }`}
                  >
                    <span className="truncate">{folder.name}</span>
                    {alreadyIn ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-300">
                        <Check size={11} /> Na pasta
                      </span>
                    ) : (
                      <span className="text-[10px] text-amber-300">+ Mover</span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {mode === 'remove' && (
        <div className="mt-2 space-y-2.5 px-1.5 pb-1">
          {assignedFolders.length === 0 ? (
            <p className="px-1 py-2 text-slate-400">
              Esta ficha não está vinculada a nenhuma pasta no momento.
            </p>
          ) : (
            <>
              <div className="flex items-center justify-between px-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Selecione as pastas
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setSelectedRemoveIds(
                      selectedRemoveIds.length === assignedFolders.length
                        ? []
                        : assignedFolders.map(folder => folder.id)
                    )
                  }
                  className="text-[10px] text-amber-300 hover:underline"
                >
                  {selectedRemoveIds.length === assignedFolders.length ? 'Limpar' : 'Todas'}
                </button>
              </div>
              <div className="space-y-1">
                {assignedFolders.map(folder => (
                  <label
                    key={folder.id}
                    className="flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 hover:bg-white/10"
                  >
                    <input
                      type="checkbox"
                      checked={selectedRemoveIds.includes(folder.id)}
                      onChange={() => toggleRemoveFolder(folder.id)}
                      className="accent-amber-400"
                    />
                    <span className="truncate">{folder.name}</span>
                  </label>
                ))}
              </div>
              <button
                type="button"
                disabled={selectedRemoveIds.length === 0}
                onClick={() => {
                  onRemoveFromFolders(state.character.id, selectedRemoveIds);
                  onClose();
                }}
                className="w-full rounded-sm bg-sky-400 px-3 py-1.5 text-[11px] font-bold uppercase text-slate-950 hover:bg-sky-300 disabled:opacity-40"
              >
                Remover das pastas ({selectedRemoveIds.length})
              </button>
            </>
          )}
        </div>
      )}

      {mode === 'delete' && (
        <div className="mt-2 space-y-3 px-2 pb-1.5">
          <p className="leading-relaxed text-slate-300">
            Tem certeza que deseja excluir <strong className="text-white">{state.character.name || 'esta ficha'}</strong>? Esta ação não pode ser desfeita.
          </p>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setMode('main')}
              className="rounded border border-white/15 px-2.5 py-1 text-slate-300 hover:bg-white/10"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={() => {
                onDelete(state.character.id);
                onClose();
              }}
              className="rounded bg-rose-600 px-3 py-1 font-bold uppercase text-white hover:bg-rose-500"
            >
              Excluir
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
