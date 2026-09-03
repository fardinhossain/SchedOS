/**
 * Instrument panel — the single structural primitive the whole UI is built
 * from. Hairline border, engineering header rail, optional experiment id.
 * Keeping this in one place is what makes every surface look like part of the
 * same machine rather than a collection of cards.
 */
import type { ReactNode } from 'react';

interface PanelProps {
  title: string;
  /** Experiment/module identifier shown at the right of the header rail. */
  code?: string;
  children: ReactNode;
  /** Right-aligned controls inside the header rail. */
  actions?: ReactNode;
  tone?: 'light' | 'dark';
  className?: string;
  bodyClassName?: string;
  /** Small note rendered under the header, above the body. */
  note?: string;
}

export function Panel({
  title,
  code,
  children,
  actions,
  tone = 'light',
  className = '',
  bodyClassName = '',
  note,
}: PanelProps) {
  const dark = tone === 'dark';
  return (
    <section
      className={[
        'registered flex min-w-0 flex-col border',
        dark ? 'border-ink bg-ink text-bone scanlines' : 'border-rule bg-bone-2/40',
        className,
      ].join(' ')}
    >
      <header
        className={[
          'flex shrink-0 items-center justify-between gap-3 border-b px-3 py-2',
          dark ? 'border-ink-3 bg-ink-2' : 'border-rule bg-bone-3/60',
        ].join(' ')}
      >
        <div className="flex min-w-0 items-center gap-2">
          <span
            aria-hidden="true"
            className={['h-2 w-2 shrink-0', dark ? 'bg-crt' : 'bg-ink'].join(' ')}
          />
          <h2 className={['label truncate', dark ? 'text-bone/85' : 'text-text/80'].join(' ')}>
            {title}
          </h2>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {actions}
          {code && (
            <span className={['label', dark ? 'text-muted-2' : 'text-muted-2'].join(' ')}>
              {code}
            </span>
          )}
        </div>
      </header>
      {note && (
        <p
          className={[
            'shrink-0 border-b px-3 py-1.5 font-mono text-[11px] leading-relaxed',
            dark ? 'border-ink-3 text-muted' : 'border-rule/70 text-muted-2',
          ].join(' ')}
        >
          {note}
        </p>
      )}
      <div className={['min-w-0 flex-1 p-3', bodyClassName].join(' ')}>{children}</div>
    </section>
  );
}

/** Uppercase engineering caption used above groups of controls. */
export function FieldLabel({
  children,
  htmlFor,
  hint,
}: {
  children: ReactNode;
  htmlFor?: string;
  hint?: string;
}) {
  return (
    <label htmlFor={htmlFor} className="label mb-1.5 block text-muted-2">
      {children}
      {hint && <span className="ml-1.5 normal-case tracking-normal opacity-70">{hint}</span>}
    </label>
  );
}

/** Horizontal rule with a centred label, like a schematic divider. */
export function Divider({ children }: { children?: ReactNode }) {
  if (!children) return <hr className="border-rule" />;
  return (
    <div className="flex items-center gap-2">
      <hr className="flex-1 border-rule" />
      <span className="label text-muted-2">{children}</span>
      <hr className="flex-1 border-rule" />
    </div>
  );
}
