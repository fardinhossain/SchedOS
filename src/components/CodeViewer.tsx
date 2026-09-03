/**
 * Multi-language code viewer (spec §22, §23).
 *
 * Designed as an actual editor: dark surface, line numbers, language tabs and
 * a copy control. Switching language re-renders immediately. Highlighting uses
 * Prism with a warm terminal token palette (defined in styles.css) — never the
 * default blue/purple theme.
 */
import { useMemo, useState } from 'react';
import { Check, Copy, FileCode2 } from 'lucide-react';
import Prism from 'prismjs';
import 'prismjs/components/prism-c';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-typescript';
import type { AlgorithmId, SupportedLanguage } from '../types/scheduling';
import { ALGORITHM_MAP } from '../algorithms';
import { LANGUAGES, getCode } from '../codeExamples';

interface CodeViewerProps {
  algorithmId: AlgorithmId;
  /** Collapsed by default on small screens (spec §26). */
  defaultOpen?: boolean;
}

export function CodeViewer({ algorithmId, defaultOpen = true }: CodeViewerProps) {
  const [language, setLanguage] = useState<SupportedLanguage>('c');
  const [copied, setCopied] = useState(false);
  const [open, setOpen] = useState(defaultOpen);

  const meta = ALGORITHM_MAP[algorithmId];
  const langMeta = LANGUAGES.find((l) => l.id === language) ?? LANGUAGES[0];
  const source = getCode(algorithmId, language);

  const html = useMemo(() => {
    const grammar = Prism.languages[langMeta.grammar];
    // Fall back to escaped plain text if a grammar failed to register, rather
    // than rendering raw HTML.
    if (!grammar) {
      return source.replace(/[&<>]/g, (ch) =>
        ch === '&' ? '&amp;' : ch === '<' ? '&lt;' : '&gt;',
      );
    }
    return Prism.highlight(source, grammar, langMeta.grammar);
  }, [source, langMeta.grammar]);

  const lines = source.split('\n');

  const copy = async (): Promise<void> => {
    try {
      await navigator.clipboard.writeText(source);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  };

  return (
    <section className="registered border border-ink bg-ink">
      {/* Editor chrome */}
      <header className="flex flex-wrap items-center justify-between gap-2 border-b border-ink-3 bg-ink-2 px-3 py-2">
        <div className="flex min-w-0 items-center gap-2">
          <FileCode2 aria-hidden="true" className="h-3.5 w-3.5 shrink-0 text-crt" />
          <h2 className="label truncate text-bone/85">Algorithm Code</h2>
          <span className="tabular hidden text-[11px] text-muted-2 sm:inline">
            {meta.shortName.toLowerCase().replace(/\s+/g, '_')}.{langMeta.extension}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Language selector */}
          <div
            className="flex border border-ink-3"
            role="radiogroup"
            aria-label="Implementation language"
          >
            {LANGUAGES.map((lang) => (
              <button
                key={lang.id}
                type="button"
                role="radio"
                aria-checked={language === lang.id}
                onClick={() => setLanguage(lang.id)}
                className={[
                  'border-r border-ink-3 px-2 py-1 text-[11px] font-medium transition-colors last:border-r-0',
                  language === lang.id
                    ? 'bg-crt text-ink'
                    : 'bg-ink text-muted hover:bg-ink-3 hover:text-bone',
                ].join(' ')}
              >
                {lang.label}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={copy}
            className="flex items-center gap-1.5 border border-ink-3 px-2 py-1 text-[11px] font-medium text-muted transition-colors hover:border-bone/40 hover:text-bone"
          >
            {copied ? (
              <>
                <Check aria-hidden="true" className="h-3 w-3 text-crt" />
                Copied
              </>
            ) : (
              <>
                <Copy aria-hidden="true" className="h-3 w-3" />
                Copy Code
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => setOpen(!open)}
            aria-expanded={open}
            className="border border-ink-3 px-2 py-1 text-[11px] font-medium text-muted transition-colors hover:border-bone/40 hover:text-bone lg:hidden"
          >
            {open ? 'Hide' : 'Show'}
          </button>
        </div>
      </header>

      <p className="border-b border-ink-3 px-3 py-1.5 font-mono text-[10px] leading-relaxed text-muted-2">
        This is the educational implementation of {meta.name} in {langMeta.label}. The simulator
        engine itself always runs the TypeScript version — no code shown here is executed.
      </p>

      {open && (
        <div className="scanlines thin-scroll max-h-[30rem] overflow-auto">
          <div className="flex min-w-0">
            {/* Line numbers */}
            <div
              aria-hidden="true"
              className="tabular shrink-0 border-r border-ink-3 bg-black/25 px-2.5 py-3 text-right text-[13px] leading-[1.65] text-muted-2/60 select-none"
            >
              {lines.map((_, i) => (
                <div key={i}>{String(i + 1).padStart(2, '0')}</div>
              ))}
            </div>

            <pre className="min-w-0 flex-1 overflow-x-auto px-3 py-3">
              <code
                className={`language-${langMeta.grammar}`}
                // Prism output only — the source strings are authored in this
                // repo and never user-supplied, so there is no injection path.
                dangerouslySetInnerHTML={{ __html: html }}
              />
            </pre>
          </div>
        </div>
      )}
    </section>
  );
}
