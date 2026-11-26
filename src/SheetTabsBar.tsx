import { useEffect } from 'react';
import { ExternalLink, Home, Layers, Share2, X } from 'lucide-react';
import type { CharacterSheet } from './types';

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
  isOpenInTab,
  onClose,
  onOpen,
  onOpenNewTab,
  onOpenBackgroundTab,
  onCloseTab,
  onShare,
}: {
  state: { x: number; y: number; character: CharacterSheet } | null;
  isOpenInTab: boolean;
  onClose: () => void;
  onOpen: (id: string) => void;
  onOpenNewTab: (id: string) => void;
  onOpenBackgroundTab: (id: string) => void;
  onCloseTab: (id: string) => void;
  onShare?: (character: CharacterSheet) => void;
}) {
  useEffect(() => {
    if (!state) return;
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    const handlePointer = () => onClose();
    window.addEventListener('keydown', handleKey);
    window.addEventListener('click', handlePointer);
    window.addEventListener('scroll', handlePointer, true);
    return () => {
      window.removeEventListener('keydown', handleKey);
      window.removeEventListener('click', handlePointer);
      window.removeEventListener('scroll', handlePointer, true);
    };
  }, [state, onClose]);

  if (!state) return null;

  const menuWidth = 248;
  const menuHeight = (isOpenInTab ? 180 : 145) + (onShare ? 36 : 0);
  const left = typeof window !== 'undefined' ? Math.max(8, Math.min(state.x, window.innerWidth - menuWidth - 8)) : state.x;
  const top = typeof window !== 'undefined' ? Math.max(8, Math.min(state.y, window.innerHeight - menuHeight - 8)) : state.y;

  return (
    <div
      role="menu"
      aria-label={`Opções para ${state.character.name}`}
      style={{ left, top, width: menuWidth }}
      onClick={event => event.stopPropagation()}
      onContextMenu={event => event.preventDefault()}
      className="fixed z-50 rounded-sm border border-amber-400/40 bg-[#111319] p-1.5 text-xs text-slate-100 shadow-2xl"
    >
      <div className="border-b border-white/10 px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-amber-300/80 truncate">
        {state.character.name || 'Sem nome'}
      </div>
      <button
        type="button"
        role="menuitem"
        onClick={() => {
          onOpen(state.character.id);
          onClose();
        }}
        className="mt-1 flex w-full items-center gap-2 rounded-sm px-2.5 py-2 text-left hover:bg-white/10"
      >
        <ExternalLink size={13} className="text-amber-300" />
        <span>Abrir ficha</span>
      </button>
      <button
        type="button"
        role="menuitem"
        onClick={() => {
          onOpenNewTab(state.character.id);
          onClose();
        }}
        className="flex w-full items-center gap-2 rounded-sm px-2.5 py-2 text-left hover:bg-white/10"
      >
        <Layers size={13} className="text-amber-300" />
        <span>Abrir em nova guia</span>
      </button>
      <button
        type="button"
        role="menuitem"
        onClick={() => {
          onOpenBackgroundTab(state.character.id);
          onClose();
        }}
        className="flex w-full items-center gap-2 rounded-sm px-2.5 py-2 text-left text-slate-300 hover:bg-white/10 hover:text-white"
      >
        <Layers size={13} className="text-slate-400" />
        <span>Abrir em nova guia (2º plano)</span>
      </button>
      {onShare && (
        <button
          type="button"
          role="menuitem"
          onClick={() => {
            onShare(state.character);
            onClose();
          }}
          className="flex w-full items-center gap-2 rounded-sm px-2.5 py-2 text-left text-emerald-300 hover:bg-emerald-500/10"
        >
          <Share2 size={13} className="text-emerald-400" />
          <span>{state.character.shareId ? 'Gerenciar link ao vivo' : 'Compartilhar por link'}</span>
        </button>
      )}
      {isOpenInTab && (
        <button
          type="button"
          role="menuitem"
          onClick={() => {
            onCloseTab(state.character.id);
            onClose();
          }}
          className="mt-1 flex w-full items-center gap-2 border-t border-white/10 px-2.5 py-2 text-left text-rose-300 hover:bg-rose-500/10"
        >
          <X size={13} />
          <span>Fechar guia aberta</span>
        </button>
      )}
    </div>
  );
}
