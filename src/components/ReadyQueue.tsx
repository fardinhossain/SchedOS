/**
 * Ready queue and completed set (spec §10, §28).
 *
 * The three lanes together make the scheduling decision legible: what is
 * waiting, what just got the CPU, and what is finished. Chips animate in as
 * processes arrive so the movement itself carries the explanation.
 */
import { Check, Clock, Hourglass } from 'lucide-react';
import type { SimulationFrame } from '../engine/timeline';
import type { ProcessResult } from '../types/scheduling';
import { textOn } from './processColors';

interface ReadyQueueProps {
  frame: SimulationFrame | null;
  processes: ProcessResult[];
  colors: Record<string, string>;
  onSelectProcess?: (id: string | null) => void;
  selectedProcess?: string | null;
}

export function ReadyQueue({
  frame,
  processes,
  colors,
  onSelectProcess,
  selectedProcess,
}: ReadyQueueProps) {
  const byId = new Map(processes.map((p) => [p.id, p]));
  const ready = frame?.readyIds ?? [];
  const completed = frame?.completedIds ?? [];
  const unarrived = processes
    .filter((p) => (frame ? p.arrivalTime > frame.time : true))
    .map((p) => p.id);

  return (
    <div className="space-y-3">
      <Lane
        title="Ready Queue"
        icon={<Clock aria-hidden="true" className="h-3 w-3" />}
        count={ready.length}
        empty="Queue empty"
        accent="border-l-crt"
      >
        {ready.map((id, i) => (
          <Chip
            key={id}
            id={id}
            color={colors[id]}
            detail={`BT ${byId.get(id)?.burstTime ?? '?'}`}
            position={i + 1}
            onClick={() => onSelectProcess?.(selectedProcess === id ? null : id)}
            selected={selectedProcess === id}
          />
        ))}
      </Lane>

      <Lane
        title="Not Yet Arrived"
        icon={<Hourglass aria-hidden="true" className="h-3 w-3" />}
        count={unarrived.length}
        empty="All processes have arrived"
        accent="border-l-machine"
      >
        {unarrived.map((id) => (
          <Chip
            key={id}
            id={id}
            color={colors[id]}
            detail={`AT ${byId.get(id)?.arrivalTime ?? '?'}`}
            faded
            onClick={() => onSelectProcess?.(selectedProcess === id ? null : id)}
            selected={selectedProcess === id}
          />
        ))}
      </Lane>

      <Lane
        title="Completed"
        icon={<Check aria-hidden="true" className="h-3 w-3" />}
        count={completed.length}
        empty="Nothing completed yet"
        accent="border-l-electric"
      >
        {completed.map((id) => (
          <Chip
            key={id}
            id={id}
            color={colors[id]}
            detail={`CT ${byId.get(id)?.completionTime ?? '?'}`}
            done
            onClick={() => onSelectProcess?.(selectedProcess === id ? null : id)}
            selected={selectedProcess === id}
          />
        ))}
      </Lane>
    </div>
  );
}

function Lane({
  title,
  icon,
  count,
  empty,
  accent,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  count: number;
  empty: string;
  accent: string;
  children: React.ReactNode;
}) {
  return (
    <div className={['border border-rule border-l-2 bg-bone-2/50 p-2', accent].join(' ')}>
      <div className="mb-2 flex items-center justify-between">
        <span className="label flex items-center gap-1.5 text-muted-2">
          {icon}
          {title}
        </span>
        <span className="tabular text-[10px] text-muted-2">
          {String(count).padStart(2, '0')}
        </span>
      </div>
      {count === 0 ? (
        <p className="tabular py-1 text-[11px] text-muted-2/80">{empty}</p>
      ) : (
        <div className="flex flex-wrap gap-1.5">{children}</div>
      )}
    </div>
  );
}

function Chip({
  id,
  color,
  detail,
  position,
  faded,
  done,
  selected,
  onClick,
}: {
  id: string;
  color?: string;
  detail: string;
  position?: number;
  faded?: boolean;
  done?: boolean;
  selected?: boolean;
  onClick?: () => void;
}) {
  const bg = color ?? '#A7A49B';
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={[
        'anim-enter-queue flex items-center gap-1.5 border px-1.5 py-1 transition-transform hover:-translate-y-px',
        selected ? 'border-ink ring-1 ring-ink' : 'border-ink/25',
        faded ? 'opacity-55' : '',
        done ? 'line-through decoration-ink/40' : '',
      ].join(' ')}
      style={{ backgroundColor: bg, color: textOn(bg) }}
      title={`${id} — ${detail}`}
    >
      {position !== undefined && (
        <span className="tabular text-[9px] opacity-65">#{position}</span>
      )}
      <span className="tabular text-[11px] font-bold">{id}</span>
      <span className="tabular text-[9px] opacity-75">{detail}</span>
    </button>
  );
}
