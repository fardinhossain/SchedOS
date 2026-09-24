/**
 * Ready queue, classroom simulation table, and completed set (spec §10, §28).
 *
 * Integrates a classroom scratchpad table tracking real-time burst cuts
 * alongside ready queue and completed lanes.
 */
import { Check, Clock, Hourglass } from 'lucide-react';
import type { SimulationFrame } from '../engine/timeline';
import type { GanttBlock, ProcessResult } from '../types/scheduling';
import { textOn } from './processColors';

export interface ProcessCutState {
  struckThrough: number[];
  active: number;
}

export function getProcessCutState(
  p: ProcessResult,
  gantt: GanttBlock[],
  currentTime: number,
): ProcessCutState {
  if (currentTime <= 0 && gantt.length > 0 && gantt[0].startTime >= currentTime) {
    return { struckThrough: [], active: p.burstTime };
  }

  let remaining = p.burstTime;
  const cuts: number[] = [p.burstTime];
  let currentRunningReduction = 0;

  for (const block of gantt) {
    if (block.processId !== p.id) continue;
    if (currentTime <= block.startTime) break;

    if (currentTime >= block.endTime) {
      const slice = block.endTime - block.startTime;
      remaining -= slice;
      const val = Math.max(0, remaining);
      if (cuts[cuts.length - 1] !== val) {
        cuts.push(val);
      }
    } else {
      currentRunningReduction = currentTime - block.startTime;
    }
  }

  const active = Math.max(0, remaining - currentRunningReduction);
  const struckThrough = currentRunningReduction > 0 ? [...cuts] : cuts.slice(0, -1);

  return { struckThrough, active };
}

interface ReadyQueueProps {
  frame: SimulationFrame | null;
  processes: ProcessResult[];
  gantt?: GanttBlock[];
  colors: Record<string, string>;
  showPriority?: boolean;
  onSelectProcess?: (id: string | null) => void;
  selectedProcess?: string | null;
}

export function ReadyQueue({
  frame,
  processes,
  gantt = [],
  colors,
  showPriority = false,
  onSelectProcess,
  selectedProcess,
}: ReadyQueueProps) {
  const byId = new Map(processes.map((p) => [p.id, p]));
  const ready = frame?.readyIds ?? [];
  const completed = frame?.completedIds ?? [];
  const unarrived = processes
    .filter((p) => (frame ? p.arrivalTime > frame.time : true))
    .map((p) => p.id);
  const currentTime = frame ? frame.time : 0;

  return (
    <div className="space-y-3.5">
      {/* ── Classroom Scratchpad Table (Top) ── */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between px-0.5">
          <div className="flex items-center gap-1.5">
            <span className="label text-[10px] font-bold text-ink">Classroom Table</span>
            <span className="tabular font-mono text-[9px] text-muted-2">
              (cuts: <span className="line-through">5</span> 3 0)
            </span>
          </div>
          {frame && (
            <span className="tabular font-mono text-[10px] font-bold text-crt-dim bg-crt/15 border border-crt/30 px-1.5 py-0.5">
              clock = {frame.time}
            </span>
          )}
        </div>

        <div className="thin-scroll max-h-48 overflow-y-auto overflow-x-auto border border-rule bg-bone/40">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="sticky top-0 z-10 border-b border-rule bg-bone-3/95 backdrop-blur-xs text-[10px] font-mono text-muted-2">
                <th scope="col" className="px-2 py-1 font-semibold">
                  PID
                </th>
                <th scope="col" className="px-1.5 py-1 text-center font-semibold">
                  AT
                </th>
                <th scope="col" className="px-1.5 py-1 text-center font-semibold">
                  BT
                </th>
                {showPriority && (
                  <th scope="col" className="px-1.5 py-1 text-center font-semibold">
                    Prio
                  </th>
                )}
                <th scope="col" className="px-2 py-1 font-semibold">
                  Remaining (Cuts)
                </th>
                <th scope="col" className="px-2 py-1 text-right font-semibold">
                  State
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-rule/40 text-xs">
              {processes.map((p) => {
                const cutState = getProcessCutState(p, gantt, currentTime);
                const phase = frame?.phase[p.id] ?? 'unarrived';
                const isRunning = frame?.runningId === p.id;
                const isSelected = selectedProcess === p.id;

                return (
                  <tr
                    key={p.id}
                    onClick={() => onSelectProcess?.(selectedProcess === p.id ? null : p.id)}
                    className={[
                      'transition-colors cursor-pointer',
                      isRunning
                        ? 'bg-crt/20 font-semibold'
                        : isSelected
                          ? 'bg-bone-3/90'
                          : 'hover:bg-bone-2/70',
                    ].join(' ')}
                  >
                    <td className="px-2 py-1">
                      <div className="flex items-center gap-1.5">
                        <span
                          aria-hidden="true"
                          className="h-2.5 w-1 shrink-0"
                          style={{ backgroundColor: colors[p.id] ?? '#A7A49B' }}
                        />
                        <span className="tabular font-mono text-xs font-bold">{p.id}</span>
                      </div>
                    </td>
                    <td className="px-1.5 py-1 text-center tabular font-mono text-[11px] text-muted-2">
                      {p.arrivalTime}
                    </td>
                    <td className="px-1.5 py-1 text-center tabular font-mono text-[11px] text-muted-2">
                      {p.burstTime}
                    </td>
                    {showPriority && (
                      <td className="px-1.5 py-1 text-center tabular font-mono text-[11px] text-muted-2">
                        {p.priority ?? '—'}
                      </td>
                    )}
                    <td className="px-2 py-1 tabular font-mono text-xs">
                      <div className="flex flex-wrap items-center gap-1">
                        {cutState.struckThrough.map((val, idx) => (
                          <span
                            key={idx}
                            className="line-through decoration-ink/60 text-muted-2/80 text-[11px]"
                          >
                            {val}
                          </span>
                        ))}
                        <span
                          className={[
                            'font-bold',
                            cutState.active === 0
                              ? 'text-crt-dim'
                              : isRunning
                                ? 'text-ink underline decoration-crt decoration-2 animate-pulse'
                                : 'text-text',
                          ].join(' ')}
                        >
                          {cutState.active}
                        </span>
                      </div>
                    </td>
                    <td className="px-2 py-1 text-right tabular text-[10px]">
                      {isRunning && (
                        <span className="inline-flex items-center gap-1 border border-crt bg-crt/30 px-1 py-0.5 font-bold text-ink">
                          <span className="h-1.5 w-1.5 rounded-full bg-crt animate-pulse" />
                          RUNNING
                        </span>
                      )}
                      {!isRunning && phase === 'ready' && (
                        <span className="border border-rule bg-bone-2 px-1 py-0.5 font-semibold text-muted-2">
                          READY
                        </span>
                      )}
                      {!isRunning && phase === 'unarrived' && (
                        <span className="border border-rule/50 bg-bone-2/40 px-1 py-0.5 text-muted-2/60">
                          WAITING
                        </span>
                      )}
                      {!isRunning && phase === 'completed' && (
                        <span className="border border-electric/40 bg-electric/15 px-1 py-0.5 font-bold text-electric">
                          ✓ DONE
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Divider ── */}
      <div className="border-t border-rule/60 pt-1" />

      {/* ── Ready Queue, Not Arrived & Completed Lanes (Bottom) ── */}
      <div className="space-y-2">
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
    <div className={['border border-rule border-l-2 bg-bone-2/50 p-1.5', accent].join(' ')}>
      <div className="mb-1.5 flex items-center justify-between">
        <span className="label flex items-center gap-1.5 text-muted-2 text-[10px]">
          {icon}
          {title}
        </span>
        <span className="tabular text-[10px] text-muted-2 font-mono">
          {String(count).padStart(2, '0')}
        </span>
      </div>
      {count === 0 ? (
        <p className="tabular py-0.5 text-[10px] text-muted-2/80">{empty}</p>
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
        'anim-enter-queue flex items-center gap-1.5 border px-1.5 py-0.5 transition-transform hover:-translate-y-px',
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
      <span className="tabular text-[10px] font-bold">{id}</span>
      <span className="tabular text-[9px] opacity-75">{detail}</span>
    </button>
  );
}
