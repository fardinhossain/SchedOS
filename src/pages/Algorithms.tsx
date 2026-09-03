/**
 * Algorithms catalogue (spec §21).
 * Every algorithm with its rule, category, advantages, disadvantages, explicit
 * tie-breaking policy, a Try button, and its source code in three languages.
 */
import { useState } from 'react';
import { ArrowRight, Check, ChevronDown, Lock, Minus, Zap } from 'lucide-react';
import type { AlgorithmId } from '../types/scheduling';
import { ALGORITHMS, NON_PREEMPTIVE, PREEMPTIVE } from '../algorithms';
import type { AlgorithmMeta } from '../types/scheduling';
import { PageHeader } from '../components/Sidebar';
import { Panel } from '../components/Panel';
import { CodeViewer } from '../components/CodeViewer';

interface AlgorithmsProps {
  onTry: (id: AlgorithmId) => void;
  selected: AlgorithmId;
}

export function Algorithms({ onTry, selected }: AlgorithmsProps) {
  const [expanded, setExpanded] = useState<AlgorithmId | null>(selected);

  return (
    <div className="space-y-4">
      <PageHeader
        code="03"
        title="Algorithm Reference"
        subtitle="Eight scheduling policies: what each one does, when it helps, and where it fails."
      />

      {/* Category summary */}
      <div className="grid gap-4 md:grid-cols-2">
        <Panel title="Non-Preemptive" code="CAT-01">
          <p className="text-xs leading-relaxed text-text/70">
            A dispatched process runs until it finishes. The scheduler makes a decision only when
            the CPU becomes free, so overhead is minimal — but a single long job can hold
            everything else up. That delay is called the <strong>convoy effect</strong>.
          </p>
          <p className="tabular mt-2 text-[11px] text-muted-2">
            {NON_PREEMPTIVE.map((a) => a.shortName).join(' · ')}
          </p>
        </Panel>
        <Panel title="Preemptive" code="CAT-02">
          <p className="text-xs leading-relaxed text-text/70">
            The scheduler can take the CPU back mid-execution. Decisions are re-made continuously,
            which improves responsiveness but costs a <strong>context switch</strong> every time
            the running process changes.
          </p>
          <p className="tabular mt-2 text-[11px] text-muted-2">
            {PREEMPTIVE.map((a) => a.shortName).join(' · ')}
          </p>
        </Panel>
      </div>

      {/* Cards */}
      <div className="space-y-3">
        {ALGORITHMS.map((meta, i) => (
          <AlgorithmCard
            key={meta.id}
            meta={meta}
            index={i + 1}
            isCurrent={meta.id === selected}
            expanded={expanded === meta.id}
            onExpand={() => setExpanded(expanded === meta.id ? null : meta.id)}
            onTry={() => onTry(meta.id)}
          />
        ))}
      </div>
    </div>
  );
}

function AlgorithmCard({
  meta,
  index,
  isCurrent,
  expanded,
  onExpand,
  onTry,
}: {
  meta: AlgorithmMeta;
  index: number;
  isCurrent: boolean;
  expanded: boolean;
  onExpand: () => void;
  onTry: () => void;
}) {
  const preemptive = meta.category === 'preemptive';

  return (
    <article className="registered border border-rule bg-bone-2/40">
      {/* Header rail */}
      <header
        className={[
          'flex flex-wrap items-center gap-3 border-b px-3 py-2.5',
          expanded ? 'border-ink bg-bone-3/70' : 'border-rule bg-bone-3/40',
        ].join(' ')}
      >
        <span className="tabular shrink-0 text-[10px] font-bold text-muted-2">
          ALG-{String(index).padStart(2, '0')}
        </span>

        <div className="min-w-0 flex-1">
          <h2 className="flex flex-wrap items-baseline gap-2">
            <span className="tabular text-sm font-bold">{meta.shortName}</span>
            <span className="text-sm">{meta.name}</span>
            {isCurrent && (
              <span className="label border border-crt-dim bg-crt/20 px-1.5 py-0.5 text-crt-dim">
                Selected
              </span>
            )}
          </h2>
        </div>

        <span
          className={[
            'label flex shrink-0 items-center gap-1.5 border px-1.5 py-0.5',
            preemptive
              ? 'border-signal/50 bg-signal/10 text-signal'
              : 'border-muted-2/50 bg-muted/10 text-muted-2',
          ].join(' ')}
        >
          {preemptive ? (
            <Zap aria-hidden="true" className="h-2.5 w-2.5" />
          ) : (
            <Lock aria-hidden="true" className="h-2.5 w-2.5" />
          )}
          {preemptive ? 'Preemptive' : 'Non-Preemptive'}
        </span>

        <div className="flex shrink-0 items-center gap-1.5">
          <button
            type="button"
            onClick={onTry}
            className="group flex items-center gap-1.5 border border-ink bg-ink px-2.5 py-1.5 text-[11px] font-bold text-bone transition-colors hover:bg-ink-3"
          >
            Try Algorithm
            <ArrowRight
              aria-hidden="true"
              className="h-3 w-3 transition-transform group-hover:translate-x-0.5"
            />
          </button>
          <button
            type="button"
            onClick={onExpand}
            aria-expanded={expanded}
            aria-label={`${expanded ? 'Hide' : 'Show'} details and code for ${meta.name}`}
            className="border border-rule bg-bone-2 p-1.5 transition-colors hover:border-ink"
          >
            <ChevronDown
              aria-hidden="true"
              className={[
                'h-3.5 w-3.5 transition-transform',
                expanded ? 'rotate-180' : '',
              ].join(' ')}
            />
          </button>
        </div>
      </header>

      <div className="p-3">
        {/* Rule — always visible, it's the essence of the algorithm */}
        <div className="border-l-2 border-crt bg-bone-3/40 px-3 py-2">
          <p className="label mb-1 text-muted-2">Scheduling Rule</p>
          <p className="tabular text-xs font-medium">{meta.rule}</p>
        </div>

        <p className="mt-3 max-w-3xl text-xs leading-relaxed text-text/75">{meta.summary}</p>

        {expanded && (
          <div className="mt-4 space-y-4">
            <div className="grid gap-3 md:grid-cols-2">
              <ProsCons title="Advantages" items={meta.advantages} positive />
              <ProsCons title="Disadvantages" items={meta.disadvantages} />
            </div>

            <div className="border border-rule bg-bone-2/60 px-3 py-2">
              <p className="label mb-1 text-muted-2">Tie-Breaking Policy</p>
              <p className="text-xs leading-relaxed text-text/75">{meta.tieBreak}</p>
            </div>

            {meta.usesPriority && (
              <p className="tabular border-l-2 border-machine bg-machine/10 px-2.5 py-1.5 text-[11px]">
                Requires a priority value per process. A LOWER number means HIGHER priority.
              </p>
            )}
            {meta.usesTimeQuantum && (
              <p className="tabular border-l-2 border-machine bg-machine/10 px-2.5 py-1.5 text-[11px]">
                Requires a time quantum. Too small and context-switch overhead dominates; too
                large and the algorithm degenerates into FCFS.
              </p>
            )}

            <CodeViewer algorithmId={meta.id} />
          </div>
        )}
      </div>
    </article>
  );
}

function ProsCons({
  title,
  items,
  positive,
}: {
  title: string;
  items: string[];
  positive?: boolean;
}) {
  return (
    <div>
      <p className="label mb-1.5 text-muted-2">{title}</p>
      <ul className="space-y-1">
        {items.map((item) => (
          <li key={item} className="flex gap-2 text-xs leading-relaxed">
            {positive ? (
              <Check aria-hidden="true" className="mt-0.5 h-3 w-3 shrink-0 text-crt-dim" />
            ) : (
              <Minus aria-hidden="true" className="mt-0.5 h-3 w-3 shrink-0 text-signal" />
            )}
            <span className="text-text/75">{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
