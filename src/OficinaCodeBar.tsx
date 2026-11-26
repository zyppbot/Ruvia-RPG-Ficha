import { useState } from 'react';
import { Check, Copy, Download } from 'lucide-react';
import type { CharacterSheet } from './types';
import { copyOrvCodeToClipboard, importOrvCodeIntoCharacter } from './oficinaBridge';

export function OficinaCodeBar({
  character,
  onApply,
  variant = 'default',
}: {
  character: CharacterSheet;
  onApply: (updates: Partial<CharacterSheet>) => void;
  variant?: 'default' | 'eidos' | 'portadores';
}) {
  const [codeInput, setCodeInput] = useState('');
  const [feedback, setFeedback] = useState<{ ok: boolean; text: string } | null>(null);

  const handleImport = () => {
    if (!codeInput.trim()) {
      setFeedback({ ok: false, text: 'Cole um código ORV1: gerado pela Oficina Ruvia.' });
      return;
    }
    const result = importOrvCodeIntoCharacter(character, codeInput);
    if (result.ok) {
      onApply(result.updates);
      setCodeInput('');
      setFeedback({ ok: true, text: result.message });
    } else if ('error' in result) {
      setFeedback({ ok: false, text: result.error });
    }
  };

  const wrapperClass =
    variant === 'eidos'
      ? 'rounded-2xl border border-[#6c4fd1]/20 bg-white/70 p-4 text-[#2a2550]'
      : variant === 'portadores'
        ? 'rounded border border-current/25 bg-black/10 p-4'
        : 'rounded-sm border border-ruvia-accent/30 bg-ruvia-panel/40 p-4';

  const inputClass =
    variant === 'eidos'
      ? 'eidos-field min-w-0 flex-1 rounded-lg border px-3 py-2 text-xs font-mono outline-none'
      : variant === 'portadores'
        ? 'min-w-0 flex-1 rounded border border-current/25 bg-black/15 px-3 py-2 text-xs font-mono outline-none'
        : 'min-w-0 flex-1 rounded-sm border border-ruvia-accent/25 bg-ruvia-bg/80 px-3 py-2 text-xs font-mono text-white outline-none focus:border-ruvia-accent';

  const buttonClass =
    variant === 'eidos'
      ? 'inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-[#6c4fd1] px-3 py-2 text-xs font-semibold text-white transition hover:bg-[#5c40c0]'
      : variant === 'portadores'
        ? 'inline-flex shrink-0 items-center gap-1.5 rounded border border-current/40 bg-current/15 px-3 py-2 text-xs font-bold uppercase'
        : 'inline-flex shrink-0 items-center gap-1.5 rounded-sm bg-ruvia-accent px-3 py-2 text-xs font-bold uppercase text-ruvia-bg transition hover:opacity-90';

  return (
    <section className={wrapperClass} aria-label="Importar código da Oficina Ruvia">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="min-w-0 shrink-0">
          <p className="text-[11px] font-bold uppercase tracking-wider opacity-85">Integração Oficina · Ruvia</p>
          <p className="text-[11px] opacity-65">Cole o código <code className="font-mono">ORV1:...</code> para adicionar à ficha</p>
        </div>
        <div className="flex min-w-0 flex-1 gap-2">
          <input
            type="text"
            aria-label="Código da Oficina Ruvia"
            placeholder="Cole aqui o código ORV1:..."
            value={codeInput}
            onChange={event => {
              setCodeInput(event.target.value);
              if (feedback) setFeedback(null);
            }}
            onKeyDown={event => {
              if (event.key === 'Enter') {
                event.preventDefault();
                handleImport();
              }
            }}
            className={inputClass}
          />
          <button type="button" onClick={handleImport} className={buttonClass}>
            <Download size={14} /> Importar código
          </button>
        </div>
      </div>
      {feedback && (
        <p
          role="status"
          className={`mt-2 text-xs font-medium ${
            feedback.ok
              ? variant === 'eidos'
                ? 'text-[#256d44]'
                : 'text-emerald-400'
              : variant === 'eidos'
                ? 'text-[#a64756]'
                : 'text-rose-400'
          }`}
        >
          {feedback.text}
        </p>
      )}
    </section>
  );
}

export function CopyOrvCodeButton({
  getCode,
  label = 'Código',
  className = '',
}: {
  getCode: () => string;
  label?: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const code = getCode();
    const ok = await copyOrvCodeToClipboard(code);
    if (ok) {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } else {
      window.prompt('Copie o código ORV1 para colar na Oficina Ruvia:', code);
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      title="Copiar código para abrir na Oficina Ruvia"
      className={`inline-flex items-center gap-1 rounded border border-current/25 px-2 py-0.5 text-[10px] font-bold uppercase transition hover:border-current/60 ${className}`}
    >
      {copied ? <Check size={11} /> : <Copy size={11} />}
      <span>{copied ? 'Copiado!' : label}</span>
    </button>
  );
}
