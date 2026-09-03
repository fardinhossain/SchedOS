/**
 * Empty state — a technical placeholder rather than a blank void, so an
 * un-run panel still reads as part of the instrument.
 */
import { Terminal } from 'lucide-react';

interface EmptyStateProps {
  title: string;
  body: string;
  action?: { label: string; onClick: () => void };
}

export function EmptyState({ title, body, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center border border-dashed border-rule bg-bone-2/40 px-4 py-10 text-center">
      <Terminal aria-hidden="true" className="mb-2.5 h-6 w-6 text-muted-2" strokeWidth={1.5} />
      <p className="label text-text/75">{title}</p>
      <p className="mt-2 max-w-sm text-xs leading-relaxed text-text/60">{body}</p>
      {action && (
        <button
          type="button"
          onClick={action.onClick}
          className="mt-4 border border-ink bg-ink px-3 py-1.5 text-xs font-bold text-bone transition-colors hover:bg-ink-3"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
