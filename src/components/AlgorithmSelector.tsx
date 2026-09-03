/**
 * Algorithm selector (spec §2).
 * Visually grouped under NON-PREEMPTIVE / PREEMPTIVE headings, with the two
 * Priority variants listed separately and never conflated.
 */
import { Lock, Zap } from 'lucide-react';
import type { AlgorithmId, AlgorithmMeta } from '../types/scheduling';
import { NON_PREEMPTIVE, PREEMPTIVE } from '../algorithms';

interface AlgorithmSelectorProps {
  selected: AlgorithmId;
  onSelect: (id: AlgorithmId) => void;
}

export function AlgorithmSelector({ selected, onSelect }: AlgorithmSelectorProps) {
  return (
    <div className="space-y-3">
      <Group
        title="Non-Preemptive"
        icon={<Lock aria-hidden="true" className="h-3 w-3" />}
        items={NON_PREEMPTIVE}
        selected={selected}
        onSelect={onSelect}
      />
      <Group
        title="Preemptive"
        icon={<Zap aria-hidden="true" className="h-3 w-3" />}
        items={PREEMPTIVE}
        selected={selected}
        onSelect={onSelect}
      />
    </div>
  );
}

function Group({
  title,
  icon,
  items,
  selected,
  onSelect,
}: {
  title: string;
  icon: React.ReactNode;
  items: AlgorithmMeta[];
  selected: AlgorithmId;
  onSelect: (id: AlgorithmId) => void;
}) {
  return (
    <fieldset>
      <legend className="label mb-1.5 flex items-center gap-1.5 text-muted-2">
        {icon}
        {title}
      </legend>
      <div className="grid grid-cols-2 gap-1.5">
        {items.map((meta) => {
          const active = selected === meta.id;
          return (
            <button
              key={meta.id}
              type="button"
              onClick={() => onSelect(meta.id)}
              aria-pressed={active}
              title={meta.rule}
              className={[
                'group relative border px-2 py-1.5 text-left transition-all',
                active
                  ? 'border-ink bg-ink text-bone'
                  : 'border-rule bg-bone-2 hover:border-ink hover:bg-bone-3',
              ].join(' ')}
            >
              {/* Active indicator: a solid signal bar, not colour alone */}
              <span
                aria-hidden="true"
                className={[
                  'absolute top-0 left-0 h-full w-1 transition-colors',
                  active
                    ? meta.category === 'preemptive'
                      ? 'bg-signal'
                      : 'bg-crt'
                    : 'bg-transparent',
                ].join(' ')}
              />
              <span className="tabular block pl-1.5 text-[11px] font-bold">
                {meta.shortName}
              </span>
              <span
                className={[
                  'block pl-1.5 text-[10px] leading-tight',
                  active ? 'text-bone/65' : 'text-muted-2',
                ].join(' ')}
              >
                {meta.name.replace(/ \(.*\)/, '')}
              </span>
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
