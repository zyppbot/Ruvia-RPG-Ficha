import { useState } from 'react';
import { Check, Copy, Link2, Radio, Trash2, X } from 'lucide-react';
import type { CharacterSheet } from './types';
import { buildShareUrl } from './firebaseSync';

export function ShareLinkDialog({
  character,
  isGuestView,
  busy,
  error,
  onClose,
  onCreateLink,
  onRevokeLink,
}: {
  character: CharacterSheet | null;
  isGuestView: boolean;
  busy: boolean;
  error: string | null;
  onClose: () => void;
  onCreateLink: (char: CharacterSheet) => Promise<void>;
  onRevokeLink: (char: CharacterSheet) => Promise<void>;
}) {
  const [copied, setCopied] = useState(false);
  const [confirmRevoke, setConfirmRevoke] = useState(false);

  if (!character) return null;

  const shareUrl = character.shareId ? buildShareUrl(character.shareId) : '';
  const isOwner = Boolean(character.shareId && character.shareOwnerSecret);

  const handleCopy = async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      window.prompt('Copie o link compartilhado:', shareUrl);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="share-dialog-title"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-sm border border-amber-400/40 bg-[#101218] p-6 text-slate-100 shadow-2xl"
        onClick={event => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 border-b border-white/10 pb-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-amber-300">
              Compartilhamento simultâneo
            </p>
            <h2 id="share-dialog-title" className="mt-0.5 text-lg font-bold text-white">
              {character.name || 'Ficha sem nome'}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="rounded p-1 text-slate-400 hover:bg-white/10 hover:text-white"
          >
            <X size={18} />
          </button>
        </div>

        <div className="mt-4 space-y-4 text-sm">
          {!character.shareId ? (
            <>
              <p className="text-xs leading-relaxed text-slate-300">
                Gere um link único para esta ficha. Qualquer pessoa com o link poderá visualizar e editar
                a ficha ao mesmo tempo que você, em tempo real, até que você delete o link.
              </p>
              <button
                type="button"
                disabled={busy || isGuestView}
                onClick={() => onCreateLink(character)}
                className="flex w-full items-center justify-center gap-2 rounded-sm bg-amber-400 px-4 py-2.5 text-xs font-black uppercase tracking-wider text-black transition hover:bg-amber-300 disabled:opacity-50"
              >
                <Link2 size={15} />
                {busy ? 'Gerando link...' : 'Gerar link em tempo real'}
              </button>
            </>
          ) : (
            <>
              <div className="flex items-center gap-2 rounded-sm border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-300">
                <Radio size={14} className="shrink-0 animate-pulse" />
                <span>
                  Link ativo — todas as edições são sincronizadas em tempo real entre você e quem abrir o link.
                </span>
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  readOnly
                  aria-label="Link de compartilhamento"
                  value={shareUrl}
                  onFocus={event => event.target.select()}
                  className="min-w-0 flex-1 rounded-sm border border-white/15 bg-black/40 px-3 py-2 font-mono text-xs text-slate-200 outline-none"
                />
                <button
                  type="button"
                  onClick={handleCopy}
                  className="flex shrink-0 items-center gap-1.5 rounded-sm bg-amber-400 px-3 py-2 text-xs font-bold uppercase text-black hover:bg-amber-300"
                >
                  {copied ? <Check size={14} /> : <Copy size={14} />}
                  <span>{copied ? 'Copiado!' : 'Copiar'}</span>
                </button>
              </div>

              {isOwner && !isGuestView ? (
                <div className="border-t border-white/10 pt-4">
                  {!confirmRevoke ? (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => setConfirmRevoke(true)}
                      className="flex items-center gap-2 rounded-sm border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-xs font-bold uppercase text-rose-300 hover:bg-rose-500/20 disabled:opacity-50"
                    >
                      <Trash2 size={14} />
                      <span>Deletar link (revogar acesso)</span>
                    </button>
                  ) : (
                    <div className="flex flex-wrap items-center justify-between gap-2 rounded-sm border border-rose-500/40 bg-rose-950/40 p-3">
                      <span className="text-xs text-rose-200">
                        Quem tiver este link perderá o acesso imediatamente. Confirmar?
                      </span>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setConfirmRevoke(false)}
                          className="rounded border border-white/15 px-2.5 py-1 text-xs text-slate-300 hover:bg-white/10"
                        >
                          Cancelar
                        </button>
                        <button
                          type="button"
                          disabled={busy}
                          onClick={async () => {
                            await onRevokeLink(character);
                            setConfirmRevoke(false);
                          }}
                          className="rounded bg-rose-600 px-3 py-1 text-xs font-bold uppercase text-white hover:bg-rose-500 disabled:opacity-50"
                        >
                          {busy ? 'Removendo...' : 'Sim, deletar link'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-xs text-slate-400">
                  Você está acessando como convidado. Apenas o dono da ficha pode deletar este link.
                </p>
              )}
            </>
          )}

          {error && (
            <p role="alert" className="rounded border border-rose-500/40 bg-rose-500/10 p-2.5 text-xs text-rose-300">
              {error}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
